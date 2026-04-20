import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  // 1. Get all active teachers
  const teachersQuery = supabase
    .from("teachers")
    .select("id, first_name, last_name, display_name, email, photo_url, instruments, pay_rate_per_half_hour, rate_per_block, needs_1099, w9_completed_at, teacher_role, is_active")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const { data: teachers, error: teachersError } = await teachersQuery;
  if (teachersError) {
    return NextResponse.json({ error: teachersError.message }, { status: 500 });
  }

  // 2. Get schedule blocks for the date range (booked/completed sessions)
  let blocksQuery = supabase
    .from("schedule_blocks")
    .select("id, teacher_id, location_id, block_date, start_time, end_time, block_type, status, student_id")
    .eq("tenant_id", tenantId)
    .gte("block_date", startDate)
    .lt("block_date", endDate)
    // Valid block_type enum values for paid sessions:
    // student_session = regular lesson, makeup_session = makeup, meet_greet = trial/intro
    .in("block_type", ["student_session", "makeup_session", "meet_greet", "first_day", "virtual", "sub"]);

  if (locationId) {
    blocksQuery = blocksQuery.eq("location_id", locationId);
  }

  const { data: blocks, error: blocksError } = await blocksQuery;
  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }

  // 3. Get teacher_locations for multi-location assignment
  const { data: teacherLocations } = await supabase
    .from("teacher_locations")
    .select("teacher_id, location_id")
    .eq("tenant_id", tenantId);

  const teacherLocationMap: Record<string, string[]> = {};
  for (const tl of teacherLocations ?? []) {
    if (!teacherLocationMap[tl.teacher_id]) teacherLocationMap[tl.teacher_id] = [];
    teacherLocationMap[tl.teacher_id].push(tl.location_id);
  }

  // 4. Aggregate sessions per teacher
  const sessionsByTeacher: Record<string, { count: number; locationCounts: Record<string, number> }> = {};
  for (const block of blocks ?? []) {
    if (!block.teacher_id) continue;
    if (!sessionsByTeacher[block.teacher_id]) {
      sessionsByTeacher[block.teacher_id] = { count: 0, locationCounts: {} };
    }
    sessionsByTeacher[block.teacher_id].count++;
    const loc = block.location_id ?? "unknown";
    sessionsByTeacher[block.teacher_id].locationCounts[loc] =
      (sessionsByTeacher[block.teacher_id].locationCounts[loc] ?? 0) + 1;
  }

  // 5. Build payroll rows
  const rows = (teachers ?? []).map((t) => {
    const sessions = sessionsByTeacher[t.id] ?? { count: 0, locationCounts: {} };
    const payRate = t.pay_rate_per_half_hour ?? t.rate_per_block ?? 0;
    const grossPay = sessions.count * payRate * 100; // in cents
    return {
      id: t.id,
      display_name: (t.display_name ?? [t.first_name, t.last_name].filter(Boolean).join(" ")) || "Unknown",
      email: t.email,
      photo_url: t.photo_url,
      instruments: t.instruments ?? [],
      teacher_role: t.teacher_role,
      pay_rate_per_half_hour: payRate,
      needs_1099: t.needs_1099,
      w9_completed_at: t.w9_completed_at,
      session_count: sessions.count,
      location_counts: sessions.locationCounts,
      gross_pay_cents: grossPay,
      location_ids: teacherLocationMap[t.id] ?? [],
    };
  });

  // Sort by gross pay descending
  rows.sort((a, b) => b.gross_pay_cents - a.gross_pay_cents);

  const totalGross = rows.reduce((sum, r) => sum + r.gross_pay_cents, 0);
  const totalSessions = rows.reduce((sum, r) => sum + r.session_count, 0);

  return NextResponse.json({
    rows,
    summary: {
      totalGrossCents: totalGross,
      totalSessions,
      startDate,
      endDate,
      teacherCount: rows.length,
    },
  });
}
