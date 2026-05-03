import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "@/app/api/crm/_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/teacher-utilization
 *
 * Returns teacher utilization for the current month:
 * - Only counts block_type = 'student_session'
 * - Excludes fifth_week = true blocks
 * - Scoped to current month (MTD start → month end)
 * - Returns top teachers sorted by session count descending
 * - Includes teacher display_name and location breakdown
 */
export async function GET(req: NextRequest) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { tenantId } = resolved.context;
    const db = getServiceClient();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    // Billable block types — mirrors payroll route logic
    const BILLABLE_TYPES = [
      "student_session",
      "first_day",
      "last_day",
      "virtual",
      "meet_greet",
      "sub",
    ];

    // Fetch all billable blocks for current month, no 5th week
    const { data: blocks, error: blocksErr } = await db
      .from("schedule_blocks")
      .select("teacher_id, location_id, status")
      .eq("tenant_id", tenantId)
      .in("block_type", BILLABLE_TYPES)
      .eq("fifth_week", false)
      .gte("block_date", monthStart)
      .lte("block_date", monthEnd);

    if (blocksErr) throw blocksErr;

    // Fetch active teachers
    const { data: teachers, error: teacherErr } = await db
      .from("teachers")
      .select("id, display_name, first_name, last_name")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

    if (teacherErr) throw teacherErr;

    // Fetch locations for name mapping
    const { data: locations, error: locErr } = await db
      .from("locations")
      .select("id, name, color")
      .eq("tenant_id", tenantId);

    if (locErr) throw locErr;

    const teacherMap = new Map(
      (teachers ?? []).map((t) => [
        t.id,
        { name: t.display_name ?? `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() },
      ]),
    );

    const locationMap = new Map(
      (locations ?? []).map((l) => [l.id, { name: l.name, color: l.color }]),
    );

    // Aggregate: sessions per teacher (total + by location)
    const teacherTotals = new Map<
      string,
      { total: number; booked: number; byLocation: Map<string, number> }
    >();

    for (const block of blocks ?? []) {
      if (!block.teacher_id) continue;
      if (!teacherTotals.has(block.teacher_id)) {
        teacherTotals.set(block.teacher_id, {
          total: 0,
          booked: 0,
          byLocation: new Map(),
        });
      }
      const entry = teacherTotals.get(block.teacher_id)!;
      entry.total++;
      if (block.status === "booked") {
        entry.booked++;
      }
      if (block.location_id) {
        entry.byLocation.set(
          block.location_id,
          (entry.byLocation.get(block.location_id) ?? 0) + 1,
        );
      }
    }

    // Build result array, sorted by total sessions desc
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

    return ok({
      teachers: result,
      mtd: { start: monthStart, end: monthEnd },
    });
  } catch (err) {
    return serverError(err);
  }
}
