import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createSessionLog,
  getSessionLogByBlockId,
  listSessionLog,
  type SessionLogFilter,
} from "@data/sessionLog";
import { getScheduleBlockById } from "@data/scheduleBlocks";
import { requirePermission } from "@/lib/auth/guards";
import { assertLocationAllowed, resolveUserLocationAccess } from "@/lib/auth/locationAccess";
import {
  badRequest,
  created,
  ok,
  parseListQuery,
  readJson,
  serverError,
} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("schedule.read")();
    const tenantId = session.tenantId;
    const url = new URL(req.url);
    const requestedLocationId =
      url.searchParams.get("location_id") ?? url.searchParams.get("locationId");
    const access = await resolveUserLocationAccess({
      session,
      preferredLocationId: requestedLocationId,
      autoRepairProfileLocation: true,
    });
    const resolvedLocationId = requestedLocationId
      ? assertLocationAllowed(access, requestedLocationId)
      : access.selectedLocationId;
    const filter: SessionLogFilter = {
      student_id: url.searchParams.get("student_id") ?? undefined,
      teacher_id: url.searchParams.get("teacher_id") ?? undefined,
      schedule_block_id: url.searchParams.get("schedule_block_id") ?? undefined,
      location_id: resolvedLocationId ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      date_from: url.searchParams.get("date_from") ?? undefined,
      date_to: url.searchParams.get("date_to") ?? undefined,
    };
    const data = await listSessionLog(tenantId, filter, parseListQuery(req));
    return ok({ data, count: data.length });
  } catch (err) {
    return serverError(err);
  }
}

const SessionLogCreateSchema = z
  .object({
    schedule_block_id: z.string().uuid(),
    student_id: z.string().uuid(),
    teacher_id: z.string().uuid(),
    location_id: z.string().uuid(),
    block_date: z.string(),
    student_rate: z.number(),
    teacher_rate: z.number(),
    status: z.string().optional(),
    lesson_notes: z.string().nullable().optional(),
    teacher_note: z.string().nullable().optional(),
    engagement_level: z.number().int().min(1).max(5).nullable().optional(),
    progress_indicator: z.string().nullable().optional(),
    worked_on: z.array(z.string()).nullable().optional(),
    instrument: z.string().nullable().optional(),
    ai_summary: z.string().nullable().optional(),
    voice_note_url: z.string().nullable().optional(),
    payment_gated: z.boolean().optional(),
  })
  .passthrough();

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("schedule.write")();
    const tenantId = session.tenantId;
    const body = await readJson(req);
    const parsed = SessionLogCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid session_log payload", parsed.error.flatten());
    }
    const block = await getScheduleBlockById(parsed.data.schedule_block_id, tenantId);
    if (!block) return badRequest("schedule_block not found");
    const access = await resolveUserLocationAccess({
      session,
      preferredLocationId: block.location_id,
      autoRepairProfileLocation: true,
    });
    const locationId = assertLocationAllowed(access, block.location_id);
    if (!locationId || locationId !== block.location_id) {
      return badRequest("Location access denied");
    }

    if (parsed.data.location_id !== block.location_id) {
      return badRequest("session_log location_id must match schedule block location");
    }
    if (parsed.data.student_id !== block.student_id) {
      return badRequest("session_log student_id must match schedule block student");
    }
    if (parsed.data.teacher_id !== block.teacher_id) {
      return badRequest("session_log teacher_id must match schedule block teacher");
    }
    if (parsed.data.block_date !== block.block_date) {
      return badRequest("session_log block_date must match schedule block date");
    }

    const existing = await getSessionLogByBlockId(block.id, tenantId).catch(() => null);
    if (existing?.id) {
      return ok({ data: existing });
    }

    const row = await createSessionLog(tenantId, parsed.data);
    return created({ data: row });
  } catch (err) {
    return serverError(err);
  }
}
