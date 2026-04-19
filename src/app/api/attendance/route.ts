import { NextRequest } from "next/server";
import { z } from "zod";
import {
  badRequest,
  created,
  ok,
  parseListQuery,
  readJson,
  resolveTenantId,
} from "@/lib/http";
import {
  resolveAttendanceContext,
  respondAttendanceError,
} from "@/lib/attendance/guard";
import {
  listAttendanceRecords,
  upsertAttendanceRecord,
  type AttendanceStatus,
} from "@data/attendanceRecords";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const hinted = resolveTenantId(req);
    const { tenantId } = await resolveAttendanceContext(hinted, "attendance.read");
    const url = new URL(req.url);
    const filter = {
      session_id: url.searchParams.get("session_id") ?? undefined,
      student_id: url.searchParams.get("student_id") ?? undefined,
      teacher_id: url.searchParams.get("teacher_id") ?? undefined,
      schedule_block_id:
        url.searchParams.get("schedule_block_id") ?? undefined,
      status: (url.searchParams.get("status") as AttendanceStatus) ?? undefined,
      date_from: url.searchParams.get("date_from") ?? undefined,
      date_to: url.searchParams.get("date_to") ?? undefined,
    };
    const data = await listAttendanceRecords(filter, tenantId, parseListQuery(req));
    return ok({ data, count: data.length });
  } catch (err) {
    return respondAttendanceError(err);
  }
}

const RecordCreateSchema = z.object({
  session_id: z.string().min(1),
  student_id: z.string().min(1),
  status: z.enum([
    "present",
    "absent",
    "tardy",
    "excused",
    "makeup",
    "no_show",
  ]),
  schedule_block_id: z.string().nullable().optional(),
  teacher_id: z.string().nullable().optional(),
  arrived_at: z.string().nullable().optional(),
  left_at: z.string().nullable().optional(),
  minutes_late: z.number().int().nullable().optional(),
  reason_id: z.string().nullable().optional(),
  reason_text: z.string().nullable().optional(),
  is_excused: z.boolean().optional(),
  marked_by: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const hinted = resolveTenantId(req);
    const { tenantId } = await resolveAttendanceContext(hinted, "attendance.write");
    const body = await readJson(req);
    const parsed = RecordCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid attendance payload", parsed.error.flatten());
    }
    const row = await upsertAttendanceRecord({
      tenant_id: tenantId,
      ...parsed.data,
      is_excused: parsed.data.is_excused ?? parsed.data.status === "excused",
    });
    return created({ data: row });
  } catch (err) {
    return respondAttendanceError(err);
  }
}
