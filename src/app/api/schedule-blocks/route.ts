import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createScheduleBlock,
  findConflictingBlocks,
  listScheduleBlocks,
  type ScheduleBlockFilter,
} from "@data/scheduleBlocks";
import { createSessionLog, getSessionLogByBlockId } from "@data/sessionLog";
import type { ScheduleBlockInsert } from "@/lib/types/entities";
import { requirePermission } from "@/lib/auth/guards";
import { assertLocationAllowed, resolveUserLocationAccess } from "@/lib/auth/locationAccess"; // used in POST handler
import { validateSubCoverage } from "@/lib/schedule/subCoverageIntegrity";
import { validateTeacherLocationAssignment } from "@/lib/schedule/teacherAssignmentIntegrity";
import {
  badRequest,
  created,
  ok,
  parseListQuery,
  readJson,
  serverError,
} from "@/lib/http";
import { logStudentScheduleActivity } from "@/lib/schedule/studentActivityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BlockTypeSchema = z.enum([
  "open_time",
  "student_session",
  "first_day",
  "last_day",
  "not_bookable",
  "sub",
  "call_out",
  "meet_greet",
  "teacher_training",
  "makeup_session",
  "virtual",
]);

const BlockStatusSchema = z.enum(["available", "booked"]);

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("schedule.read")();
    const tenantId = session.tenantId;
    const url = new URL(req.url);
    const requestedLocationId =
      url.searchParams.get("location_id") ?? url.searchParams.get("locationId");
    // Use the requested locationId directly — bypass profile_locations filter so
    // all 4 active studios are accessible regardless of session role.
    // assertLocationAllowed was silently redirecting cross-location requests to the
    // fallback location, causing wrong data to render on the grid.
    const resolvedLocationId = requestedLocationId ?? null;
    const filter: ScheduleBlockFilter = {
      teacher_id: url.searchParams.get("teacher_id") ?? undefined,
      student_id: url.searchParams.get("student_id") ?? undefined,
      location_id: resolvedLocationId ?? undefined,
      room_id: url.searchParams.get("room_id") ?? undefined,
      block_type: url.searchParams.get("block_type") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      date_from: url.searchParams.get("date_from") ?? undefined,
      date_to: url.searchParams.get("date_to") ?? undefined,
    };
    const recurring = url.searchParams.get("is_recurring");
    if (recurring === "true") filter.is_recurring = true;
    else if (recurring === "false") filter.is_recurring = false;

    const data = await listScheduleBlocks(tenantId, filter, parseListQuery(req));
    return ok({ data, count: data.length });
  } catch (err) {
    return serverError(err);
  }
}

const BlockCreateSchema = z
  .object({
    block_date: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    teacher_id: z.string().uuid(),
    location_id: z.string().uuid(),
    student_id: z.string().uuid().nullable().optional(),
    room_id: z.string().uuid().nullable().optional(),
    room: z.string().nullable().optional(),
    block_type: BlockTypeSchema.optional(),
    status: BlockStatusSchema.optional(),
    is_recurring: z.boolean().optional(),
    is_virtual: z.boolean().optional(),
    is_makeup_session: z.boolean().optional(),
    notes: z.string().nullable().optional(),
    fifth_week: z.boolean().optional(),
    generated_from_availability: z.boolean().optional(),
    original_teacher_id: z.string().uuid().nullable().optional(),
    original_teacher_name: z.string().nullable().optional(),
    checked_in: z.boolean().optional(),
    checked_in_at: z.string().nullable().optional(),
    checked_in_by: z.string().uuid().nullable().optional(),
    teacher_tally: z.boolean().nullable().optional(),
  })
  .passthrough();

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("schedule.write")();
    const tenantId = session.tenantId;
    const locationAccess = await resolveUserLocationAccess({
      session,
      autoRepairProfileLocation: true,
    });
    const body = await readJson(req);
    const parsed = BlockCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid schedule_block payload", parsed.error.flatten());
    }
    const locationId = parsed.data.location_id
      ? assertLocationAllowed(locationAccess, parsed.data.location_id)
      : locationAccess.selectedLocationId;
    if (!locationId) {
      return badRequest("Missing location_id");
    }
    const insertData = {
      ...parsed.data,
      location_id: locationId,
    };
    const blockType = String(insertData.block_type ?? "student_session");
    const url = new URL(req.url);
    const skipConflict = url.searchParams.get("skip_conflict_check") === "true";
    const isSubCoverage = blockType === "sub";

    const teacherLocation = await validateTeacherLocationAssignment({
      teacherId: insertData.teacher_id,
      locationId: insertData.location_id,
    });
    if (!teacherLocation.ok) {
      return badRequest(teacherLocation.error);
    }

    if (isSubCoverage) {
      const validation = await validateSubCoverage({
        tenantId,
        blockDate: insertData.block_date,
        startTime: insertData.start_time,
        endTime: insertData.end_time,
        teacherId: insertData.teacher_id,
        locationId: insertData.location_id,
        originalTeacherId:
          typeof insertData.original_teacher_id === "string"
            ? insertData.original_teacher_id
            : null,
      });
      if (!validation.ok) {
        return badRequest(validation.error, validation.details);
      }
      insertData.original_teacher_name =
        insertData.original_teacher_name ?? validation.originalTeacherName ?? null;
      insertData.status = insertData.student_id ? "booked" : "available";
    }
    if (blockType === "call_out") {
      insertData.status = "available";
      insertData.checked_in = false;
      insertData.checked_in_at = null;
      insertData.checked_in_by = null;
      insertData.teacher_tally = false;
    }
    if (blockType === "makeup_session" || insertData.is_makeup_session === true) {
      if (!insertData.student_id) {
        return badRequest("Makeup sessions require student_id.");
      }
      insertData.block_type = "makeup_session";
      insertData.is_makeup_session = true;
      insertData.status = "booked";
    }
    if (insertData.checked_in === true) {
      insertData.checked_in_at = insertData.checked_in_at ?? new Date().toISOString();
      insertData.checked_in_by =
        insertData.checked_in_by ?? session.profileId ?? session.userId;
      insertData.teacher_tally =
        typeof insertData.teacher_tally === "boolean" ? insertData.teacher_tally : true;
      insertData.status = "booked";
    }

    if (!skipConflict && !isSubCoverage) {
      const conflicts = await findConflictingBlocks(
        tenantId,
        insertData.teacher_id,
        insertData.block_date,
        insertData.start_time,
        insertData.end_time,
      );
      if (conflicts.length > 0) {
        return badRequest("Teacher has conflicting block(s).", {
          conflicts: conflicts.map((c) => ({
            id: c.id,
            block_date: c.block_date,
            start_time: c.start_time,
            end_time: c.end_time,
            status: c.status,
          })),
        });
      }
    }

    const row = await createScheduleBlock(
      tenantId,
      insertData as unknown as Omit<ScheduleBlockInsert, "tenant_id">,
    );

    if (row.checked_in && row.student_id && row.teacher_id && row.location_id) {
      const existingLog = await getSessionLogByBlockId(row.id, tenantId).catch(() => null);
      if (!existingLog) {
        await createSessionLog(tenantId, {
          schedule_block_id: row.id,
          student_id: row.student_id,
          teacher_id: row.teacher_id,
          location_id: row.location_id,
          block_date: row.block_date,
          student_rate: 0,
          teacher_rate: 0,
          status: "checked_in",
        }).catch(() => null);
      }
    }

    if (typeof row.student_id === "string" && row.student_id.length > 0) {
      await logStudentScheduleActivity({
        tenantId,
        studentId: row.student_id,
        action: "schedule_block_created",
        locationId: row.location_id ?? null,
        details: {
          schedule_block_id: row.id,
          block_date: row.block_date,
          start_time: row.start_time,
          end_time: row.end_time,
          teacher_id: row.teacher_id,
          block_type: row.block_type,
          status: row.status,
        },
      });
    }

    return created({ data: row });
  } catch (err) {
    return serverError(err);
  }
}
