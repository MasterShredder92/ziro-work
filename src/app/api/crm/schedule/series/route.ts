/**
 * POST /api/crm/schedule/series
 *
 * Creates a recurring schedule series for a student and generates
 * 52 weeks of 30-min blocks forward from the start date.
 *
 * Rules:
 * - All sessions are 30-min blocks. Hour lesson = duration_blocks: 2 (two consecutive 30-min blocks).
 * - Default: recurring forever (effective_until = null).
 * - One-time session: set is_recurring: false — creates series + single block only.
 *
 * Body:
 *   student_id      — required
 *   teacher_id      — required
 *   location_id     — required
 *   start_date      — YYYY-MM-DD (first session date)
 *   start_time      — HH:MM (24h)
 *   duration_blocks — int, default 1 (1 = 30 min, 2 = 60 min)
 *   is_recurring    — boolean, default true
 *   room_id?        — optional
 *   is_first_lesson? — boolean, marks first block as first_day type
 */
import { NextRequest } from "next/server";
import { ok, badRequest, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../_context";
import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEEKS_TO_GENERATE = 52;

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
}

function addWeeks(dateStr: string, weeks: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split("T")[0];
}

export async function POST(req: NextRequest) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "admin",
  });
  if ("response" in resolved) return resolved.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const {
    student_id,
    teacher_id,
    location_id,
    start_date,
    start_time,
    duration_blocks = 1,
    is_recurring = true,
    room_id = null,
    is_first_lesson = false,
  } = body;

  if (!student_id || !teacher_id || !location_id || !start_date || !start_time) {
    return badRequest("Missing required: student_id, teacher_id, location_id, start_date, start_time");
  }

  const durationBlocks = Number(duration_blocks);
  if (![1, 2].includes(durationBlocks)) {
    return badRequest("duration_blocks must be 1 (30 min) or 2 (60 min)");
  }

  const { tenantId } = resolved.context;
  const supabase = await createTenantBoundSupabaseClient({ tenantId: resolved.context.tenantId });

  // Compute day_of_week from start_date
  const startD = new Date((start_date as string) + "T00:00:00");
  const dayOfWeek = startD.getDay(); // 0=Sun..6=Sat

  // Compute end_time for a single 30-min block
  const blockEndTime = addMinutes(start_time as string, 30);
  const startTimeFull = (start_time as string).length === 5
    ? (start_time as string) + ":00"
    : (start_time as string);

  // ── 1. Create the series record ──────────────────────────────────────────
  const { data: series, error: seriesError } = await supabase
    .from("schedule_series")
    .insert({
      tenant_id: tenantId,
      student_id: student_id as string,
      teacher_id: teacher_id as string,
      location_id: location_id as string,
      day_of_week: dayOfWeek,
      start_time: startTimeFull,
      end_time: blockEndTime,
      duration_blocks: durationBlocks,
      effective_from: start_date as string,
      effective_until: null,
      last_generated: is_recurring
        ? addWeeks(start_date as string, WEEKS_TO_GENERATE - 1)
        : (start_date as string),
      is_active: true,
      is_recurring: Boolean(is_recurring),
    })
    .select()
    .single();

  if (seriesError) {
    console.error("[schedule/series POST] series insert error:", JSON.stringify(seriesError));
    return serverError(seriesError);
  }

  const seriesId = series.id as string;
  const weeksToGen = is_recurring ? WEEKS_TO_GENERATE : 1;

  // ── 2. Generate blocks ───────────────────────────────────────────────────
  // For each week, create durationBlocks consecutive 30-min blocks
  const blocksToInsert: Record<string, unknown>[] = [];

  for (let week = 0; week < weeksToGen; week++) {
    const blockDate = addWeeks(start_date as string, week);

    for (let slot = 0; slot < durationBlocks; slot++) {
      const slotStart = addMinutes(startTimeFull, slot * 30);
      const slotEnd = addMinutes(startTimeFull, (slot + 1) * 30);
      const isFirstBlock = week === 0 && slot === 0;

      blocksToInsert.push({
        tenant_id: tenantId,
        teacher_id: teacher_id as string,
        student_id: student_id as string,
        location_id: location_id as string,
        room_id: room_id ?? null,
        block_date: blockDate,
        start_time: slotStart,
        end_time: slotEnd,
        block_type: isFirstBlock && is_first_lesson ? "first_day" : "student_session",
        status: "booked",
        is_recurring: Boolean(is_recurring),
        series_id: seriesId,
        series_anchor: isFirstBlock,
      });
    }
  }

  // Insert in batches of 500 to avoid payload limits
  const BATCH = 500;
  let insertedCount = 0;
  for (let i = 0; i < blocksToInsert.length; i += BATCH) {
    const batch = blocksToInsert.slice(i, i + BATCH);
    const { error: batchError } = await supabase
      .from("schedule_blocks")
      .insert(batch);

    if (batchError) {
      console.error("[schedule/series POST] block insert error:", JSON.stringify(batchError));
      // Rollback: delete the series record we just created
      await supabase.from("schedule_series").delete().eq("id", seriesId);
      return serverError(batchError);
    }
    insertedCount += batch.length;
  }

  return ok({
    series_id: seriesId,
    blocks_created: insertedCount,
    weeks_generated: weeksToGen,
    duration_blocks: durationBlocks,
    effective_from: start_date,
    last_generated: series.last_generated,
  });
}
