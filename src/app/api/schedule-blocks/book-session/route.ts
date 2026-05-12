/**
 * POST /api/schedule-blocks/book-session
 *
 * Books a student into an open time slot.
 * Handles two modes:
 *   - Single session: creates or updates a schedule_blocks row for the specific date
 *   - Recurring: creates a recurring_lessons rule + a schedule_blocks row for the specific date
 *
 * Body:
 *   block_id?       — existing open_time block id to update (optional — if no block exists, creates one)
 *   teacher_id      — required
 *   location_id     — required
 *   room_id?        — optional
 *   block_date      — YYYY-MM-DD
 *   start_time      — HH:MM
 *   end_time        — HH:MM
 *   student_id      — required
 *   is_recurring    — boolean
 *   is_first_lesson — boolean (sets block_type to first_day)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requirePermission } from "@/lib/auth/guards";
import { logStudentScheduleActivity } from "@/lib/schedule/studentActivityLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ok(data: unknown) {
  return NextResponse.json({ data }, { status: 200 });
}
function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}
function serverError(msg: string) {
  return NextResponse.json({ error: msg }, { status: 500 });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
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
    return badRequest("Missing required fields: teacher_id, location_id, block_date, start_time, end_time, student_id");
  }

  const session = await requirePermission("schedule.write")();
  const tenantId = session.tenantId;
  const supabase = getServiceClient();

  // Determine block_type
  const blockType = is_first_lesson ? "first_day" : "student_session";

  // ── If recurring: upsert into recurring_lessons ──────────────────────────
  if (is_recurring) {
    // day_of_week: 0=Sun, 1=Mon, ..., 6=Sat
    const d = new Date((block_date as string) + "T00:00:00");
    const dayOfWeek = d.getDay();

    // Get student's instrument
    const { data: studentRow } = await supabase
      .from("students")
      .select("instrument")
      .eq("id", student_id as string)
      .eq("tenant_id", tenantId)
      .single();

    // Upsert recurring rule (unique on student+teacher+location+day+start_time)
    const { error: rlError } = await supabase
      .from("recurring_lessons")
      .upsert({
        tenant_id: tenantId,
        student_id: student_id as string,
        teacher_id: teacher_id as string,
        location_id: location_id as string,
        day_of_week: dayOfWeek,
        start_time: start_time as string,
        end_time: end_time as string,
        instrument: studentRow?.instrument ?? null,
        is_active: true,
        effective_from: block_date as string,
        effective_until: null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "student_id,teacher_id,location_id,day_of_week,start_time",
        ignoreDuplicates: false,
      });

    if (rlError) {
      // Non-fatal: log and continue to create the block
      console.error("recurring_lessons upsert error:", rlError.message);
    }
  }

  // ── Create or update the schedule_blocks row for this specific date ───────
  let resultBlock: Record<string, unknown> | null = null;

  if (block_id) {
    // Update existing open_time block
    const { data: updated, error: updateError } = await supabase
      .from("schedule_blocks")
      .update({
        student_id: student_id as string,
        block_type: blockType,
        status: "booked",
        is_recurring: is_recurring ? true : false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", block_id as string)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (updateError) return serverError(updateError.message);
    resultBlock = updated as Record<string, unknown>;
  } else {
    // Create a new block row for this date/time
    const { data: created, error: createError } = await supabase
      .from("schedule_blocks")
      .insert({
        tenant_id: tenantId,
        teacher_id: teacher_id as string,
        location_id: location_id as string,
        room_id: room_id ?? null,
        student_id: student_id as string,
        block_date: block_date as string,
        start_time: start_time as string,
        end_time: end_time as string,
        block_type: blockType,
        status: "booked",
        is_recurring: is_recurring ? true : false,
        generated_from_availability: false,
      })
      .select()
      .single();

    if (createError) return serverError(createError.message);
    resultBlock = created as Record<string, unknown>;
  }

  await logStudentScheduleActivity({
    tenantId,
    studentId: student_id as string,
    action: "session_booked",
    details: {
      schedule_block_id: resultBlock?.id,
      block_date,
      start_time,
      end_time,
      teacher_id,
      location_id,
      is_recurring: !!is_recurring,
      block_type: blockType,
    },
    locationId: location_id as string,
  });

  return ok(resultBlock);
}
