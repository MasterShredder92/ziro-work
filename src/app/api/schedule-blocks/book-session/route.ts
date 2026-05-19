/**
 * POST /api/schedule-blocks/book-session
 *
 * Thin wrapper around the book_session Postgres RPC.
 * All booking logic, validation, recurring-rule upsert, and
 * activity logging execute atomically inside the database function.
 *
 * Body:
 *   block_id?       — existing open_time block id to update
 *   teacher_id      — required
 *   location_id     — required
 *   room_id?        — optional
 *   block_date      — YYYY-MM-DD
 *   start_time      — HH:MM
 *   end_time        — HH:MM
 *   student_id      — required
 *   is_recurring    — boolean
 *   is_first_lesson — boolean
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requirePermission } from "@/lib/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALIDATION_PREFIXES = [
  "book_session_invalid_student:",
  "book_session_invalid_teacher:",
  "book_session_block_not_found:",
  "session_log_invalid_block:",
  "session_log_student_mismatch:",
  "student_stage_invalid:",
  "enroll_student_not_found:",
  "enroll_student_invalid_teacher:",
];

function ok(data: unknown) {
  return NextResponse.json({ data }, { status: 200 });
}
function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}
function serverError(msg: string) {
  return NextResponse.json({ error: msg }, { status: 500 });
}
function dbError(msg: string) {
  const isValidation = VALIDATION_PREFIXES.some((p) => msg.startsWith(p));
  return isValidation ? badRequest(msg) : serverError(msg);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const {
    block_id,
    teacher_id,
    location_id,
    room_id,
    block_date,
    start_time,
    end_time,
    student_id,
    is_recurring,
    is_first_lesson,
  } = body;

  if (!teacher_id || !location_id || !block_date || !start_time || !end_time || !student_id) {
    return badRequest(
      "Missing required fields: teacher_id, location_id, block_date, start_time, end_time, student_id",
    );
  }

  const session = await requirePermission("schedule.write")();
  const supabase = getServiceClient();

  const { data, error } = await supabase.rpc("book_session", {
    p_tenant_id:       session.tenantId,
    p_teacher_id:      teacher_id as string,
    p_location_id:     location_id as string,
    p_student_id:      student_id as string,
    p_block_date:      block_date as string,
    p_start_time:      start_time as string,
    p_end_time:        end_time as string,
    p_is_recurring:    !!is_recurring,
    p_is_first_lesson: !!is_first_lesson,
    p_block_id:        (block_id as string) ?? null,
    p_room_id:         (room_id as string) ?? null,
  });

  if (error) return dbError(error.message);
  return ok(data);
}
