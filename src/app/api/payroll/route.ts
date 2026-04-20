import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Block types that COUNT toward teacher pay (tally as a billable session).
 *
 * COUNTS:
 *   student_session  — regular booked lesson
 *   first_day        — first lesson (booked appointment)
 *   last_day         — last lesson (booked appointment)
 *   virtual          — remote booked lesson
 *   meet_greet       — trial/intro lesson (teacher is working)
 *   sub              — sub teacher covered a slot
 *
 * DOES NOT COUNT:
 *   makeup_session   — not tallied to teacher per business rules
 *   open_time        — unbooked availability slot
 *   not_bookable     — blocked time, no student
 *   call_out         — teacher called out, session did not happen
 *   teacher_training — internal, no student
 */
const BILLABLE_BLOCK_TYPES = [
  "student_session",
  "first_day",
  "last_day",
  "virtual",
  "meet_greet",
  "sub",
];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId") || DEFAULT_TENANT_ID;
  const locationId = url.searchParams.get("locationId") || null;

  // Default: current month
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const defaultEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
  const startDate = url.searchParams.get("start") || defaultStart;
  const endDate = url.searchParams.get("end") || defaultEnd;

  const supabase = getServiceClient();

  // 1. Get all active teachers (including square_team_member_id for cross-reference)
  const { data: teachers, error: teachersError } = await supabase
    .from("teachers")
    .select(
      "id, first_name, last_name, display_name, email, photo_url, instruments, pay_rate_per_half_hour, rate_per_block, needs_1099, w9_completed_at, teacher_role, is_active, square_team_member_id"
    )
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (teachersError) {
    return NextResponse.json({ error: teachersError.message }, { status: 500 });
  }

  // 2. Get all locations so we can show names in the breakdown
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, color")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const locationMap: Record<string, { name: string; color: string }> = {};
  for (const loc of locations ?? []) {
    locationMap[loc.id] = { name: loc.name, color: loc.color ?? "#909098" };
  }

  // 3. Get schedule blocks for the date range — only billable types
  let blocksQuery = supabase
    .from("schedule_blocks")
    .select("id, teacher_id, location_id, block_date, start_time, end_time, block_type, status, student_id")
    .eq("tenant_id", tenantId)
    .gte("block_date", startDate)
    .lt("block_date", endDate)
    .in("block_type", BILLABLE_BLOCK_TYPES);

  if (locationId) {
    blocksQuery = blocksQuery.eq("location_id", locationId);
  }

  const { data: blocks, error: blocksError } = await blocksQuery;
  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }

  // 4. Get teacher_locations for multi-location assignment
  const { data: teacherLocations } = await supabase
    .from("teacher_locations")
    .select("teacher_id, location_id")
    .eq("tenant_id", tenantId);

  const teacherLocationMap: Record<string, string[]> = {};
  for (const tl of teacherLocations ?? []) {
    if (!teacherLocationMap[tl.teacher_id]) teacherLocationMap[tl.teacher_id] = [];
    teacherLocationMap[tl.teacher_id].push(tl.location_id);
  }

  // 5. Aggregate sessions per teacher, broken down by location
  type SessionTally = { total: number; byLocation: Record<string, number> };
  const sessionsByTeacher: Record<string, SessionTally> = {};

  for (const block of blocks ?? []) {
    if (!block.teacher_id) continue;
    if (!sessionsByTeacher[block.teacher_id]) {
      sessionsByTeacher[block.teacher_id] = { total: 0, byLocation: {} };
    }
    sessionsByTeacher[block.teacher_id].total++;
    const loc = block.location_id ?? "unknown";
    sessionsByTeacher[block.teacher_id].byLocation[loc] =
      (sessionsByTeacher[block.teacher_id].byLocation[loc] ?? 0) + 1;
  }

  // 6. Build payroll rows
  const rows = (teachers ?? []).map((t) => {
    const tally = sessionsByTeacher[t.id] ?? { total: 0, byLocation: {} };
    const payRate = t.pay_rate_per_half_hour ?? t.rate_per_block ?? 0;

    // Gross pay in cents: sessions × rate (rate stored in dollars)
    const grossPayCents = Math.round(tally.total * payRate * 100);

    // Build per-location breakdown with names and colors
    const locationBreakdown = Object.entries(tally.byLocation).map(([locId, count]) => ({
      location_id: locId,
      location_name: locationMap[locId]?.name ?? locId,
      location_color: locationMap[locId]?.color ?? "#909098",
      session_count: count,
      gross_pay_cents: Math.round(count * payRate * 100),
    }));

    // Sort breakdown by session count descending
    locationBreakdown.sort((a, b) => b.session_count - a.session_count);

    return {
      id: t.id,
      display_name:
        (t.display_name ??
        [t.first_name, t.last_name].filter(Boolean).join(" ")) ||
        "Unknown",
      email: t.email,
      photo_url: t.photo_url,
      instruments: t.instruments ?? [],
      teacher_role: t.teacher_role,
      pay_rate_per_half_hour: payRate,
      needs_1099: t.needs_1099,
      w9_completed_at: t.w9_completed_at,
      square_team_member_id: t.square_team_member_id,
      session_count: tally.total,
      location_breakdown: locationBreakdown,
      gross_pay_cents: grossPayCents,
      location_ids: teacherLocationMap[t.id] ?? [],
    };
  });

  // Sort by gross pay descending
  rows.sort((a, b) => b.gross_pay_cents - a.gross_pay_cents);

  const totalGross = rows.reduce((sum, r) => sum + r.gross_pay_cents, 0);
  const totalSessions = rows.reduce((sum, r) => sum + r.session_count, 0);

  // Build per-location totals for the summary header
  const locationTotalsMap: Record<
    string,
    { name: string; color: string; sessions: number; gross_pay_cents: number }
  > = {};
  for (const row of rows) {
    for (const lb of row.location_breakdown) {
      if (!locationTotalsMap[lb.location_id]) {
        locationTotalsMap[lb.location_id] = {
          name: lb.location_name,
          color: lb.location_color,
          sessions: 0,
          gross_pay_cents: 0,
        };
      }
      locationTotalsMap[lb.location_id].sessions += lb.session_count;
      locationTotalsMap[lb.location_id].gross_pay_cents += lb.gross_pay_cents;
    }
  }

  const locationTotals = Object.entries(locationTotalsMap).map(([id, v]) => ({
    location_id: id,
    ...v,
  }));

  return NextResponse.json({
    rows,
    summary: {
      totalGrossCents: totalGross,
      totalSessions,
      startDate,
      endDate,
      teacherCount: rows.length,
      locationTotals,
    },
  });
}
