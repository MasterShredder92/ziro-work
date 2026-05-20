import { NextRequest } from "next/server";
import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";
import { ok, serverError } from "@/lib/http";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BILLABLE_TYPES = [
  "student_session",
  "first_day",
  "last_day",
  "virtual",
  "meet_greet",
  "sub",
] as const;

/** Monday = 0 … Sunday = 6 from a YYYY-MM-DD calendar date (local parts). */
function dowMondayFirst(isoDate: string): number {
  const [y, mo, d] = isoDate.split("-").map(Number);
  if (!y || !mo || !d) return 0;
  const dt = new Date(y, mo - 1, d);
  const sun0 = dt.getDay();
  return sun0 === 0 ? 6 : sun0 - 1;
}

/**
 * GET /api/dashboard/schedule-overview?locationId=optional
 *
 * Real schedule_block aggregates for the dashboard Schedule module:
 * - sessionsByDow: booked billable blocks this month, bucketed Mon–Sun
 * - mtdBookedSessions, mtdOpenSlots, fillRatePct, teachersTeachingMtd
 *
 * Mirrors teacher-utilization rules (billable types, fifth_week = false, MTD).
 */
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getCRMTenantId();
    const db = await createTenantBoundSupabaseClient({ tenantId });

    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId")?.trim() || null;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]!;
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]!;

    const [bookedResult, openResult] = await Promise.all([
      db
        .from("schedule_blocks")
        .select("block_date, teacher_id, location_id, status")
        .eq("tenant_id", tenantId)
        .in("block_type", [...BILLABLE_TYPES])
        .eq("fifth_week", false)
        .gte("block_date", monthStart)
        .lte("block_date", monthEnd),

      db
        .from("schedule_blocks")
        .select("block_date, location_id")
        .eq("tenant_id", tenantId)
        .eq("block_type", "open_time")
        .eq("fifth_week", false)
        .gte("block_date", monthStart)
        .lte("block_date", monthEnd),
    ]);

    if (bookedResult.error) throw bookedResult.error;
    if (openResult.error) throw openResult.error;

    const locFilter = (loc: string | null | undefined) =>
      !locationId || (loc && String(loc) === locationId);

    const sessionsByDow = [0, 0, 0, 0, 0, 0, 0];
    let mtdBookedSessions = 0;
    const teacherIds = new Set<string>();

    for (const row of bookedResult.data ?? []) {
      if (!locFilter(row.location_id)) continue;
      if (row.status !== "booked") continue;
      mtdBookedSessions++;
      const dow = dowMondayFirst(String(row.block_date ?? ""));
      sessionsByDow[dow]++;
      if (row.teacher_id) teacherIds.add(String(row.teacher_id));
    }

    let mtdOpenSlots = 0;
    for (const row of openResult.data ?? []) {
      if (!locFilter(row.location_id)) continue;
      mtdOpenSlots++;
    }

    const denom = mtdBookedSessions + mtdOpenSlots;
    const fillRatePct = denom > 0 ? Math.round((mtdBookedSessions / denom) * 100) : 0;

    return ok({
      sessionsByDow,
      mtdBookedSessions,
      mtdOpenSlots,
      fillRatePct,
      teachersTeachingMtd: teacherIds.size,
      range: { mtdStart: monthStart, mtdEnd: monthEnd },
    });
  } catch (err) {
    return serverError(err);
  }
}
