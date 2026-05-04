import { getServiceClient } from "@/lib/supabase";
import { ok, serverError } from "@/lib/http";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/teacher-utilization
 *
 * Returns teacher utilization for the current month:
 * - Only counts billable block types (mirrors payroll logic)
 * - Excludes fifth_week = true blocks
 * - Scoped to current month (MTD start → month end)
 * - Returns all active teachers sorted by session count descending
 */
export async function GET() {
  try {
    const tenantId = await getCRMTenantId();
    const db = getServiceClient();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const BILLABLE_TYPES = [
      "student_session",
      "first_day",
      "last_day",
      "virtual",
      "meet_greet",
      "sub",
    ];

    // Parallel queries — no sequential waterfalls
    const [blocksResult, teachersResult, locationsResult] = await Promise.all([
      db
        .from("schedule_blocks")
        .select("teacher_id, location_id, status")
        .eq("tenant_id", tenantId)
        .in("block_type", BILLABLE_TYPES)
        .eq("fifth_week", false)
        .gte("block_date", monthStart)
        .lte("block_date", monthEnd),

      db
        .from("teachers")
        .select("id, display_name, first_name, last_name")
        .eq("tenant_id", tenantId)
        .eq("is_active", true),

      db
        .from("locations")
        .select("id, name, color")
        .eq("tenant_id", tenantId),
    ]);

    if (blocksResult.error) throw blocksResult.error;
    if (teachersResult.error) throw teachersResult.error;
    if (locationsResult.error) throw locationsResult.error;

    const teacherMap = new Map(
      (teachersResult.data ?? []).map((t) => [
        t.id,
        { name: t.display_name ?? `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() },
      ]),
    );

    const locationMap = new Map(
      (locationsResult.data ?? []).map((l) => [l.id, { name: l.name, color: l.color }]),
    );

    // Aggregate sessions per teacher
    const teacherTotals = new Map<
      string,
      { total: number; booked: number; byLocation: Map<string, number> }
    >();

    for (const block of blocksResult.data ?? []) {
      if (!block.teacher_id) continue;
      if (!teacherTotals.has(block.teacher_id)) {
        teacherTotals.set(block.teacher_id, { total: 0, booked: 0, byLocation: new Map() });
      }
      const entry = teacherTotals.get(block.teacher_id)!;
      entry.total++;
      if (block.status === "booked") entry.booked++;
      if (block.location_id) {
        entry.byLocation.set(block.location_id, (entry.byLocation.get(block.location_id) ?? 0) + 1);
      }
    }

    const result = Array.from(teacherTotals.entries())
      .map(([teacherId, data]) => {
        const teacher = teacherMap.get(teacherId);
        const byLocation = Array.from(data.byLocation.entries()).map(([locId, count]) => ({
          locationId: locId,
          locationName: locationMap.get(locId)?.name ?? "Unknown",
          locationColor: locationMap.get(locId)?.color ?? null,
          sessions: count,
        }));
        return {
          teacherId,
          teacherName: teacher?.name ?? "Unknown Teacher",
          totalSessions: data.total,
          bookedSessions: data.booked,
          byLocation,
        };
      })
      .sort((a, b) => b.totalSessions - a.totalSessions);

    const payload = {
      teachers: result,
      mtd: { start: monthStart, end: monthEnd },
    };

    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    return res;
  } catch (err) {
    return serverError(err);
  }
}
