import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, serverError } from "@/lib/http";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toYmd(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

/** Monday 00:00 local of the calendar week containing `d`. */
function mondayOfWeekContaining(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay();
  const delta = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + delta);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split("T")[0]!.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

/**
 * GET /api/dashboard/families-overview?locationId=optional
 *
 * CRM signals for the Families dashboard tile (location = `families.primary_location_id`
 * and `students.location_id` for student-linked stats when scoped).
 *
 * Students / family = active students with a family_id ÷ distinct family_ids among those rows
 * (optionally filtered by `students.location_id`), not `activeStudents / activeFamilies`.
 */
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getCRMTenantId();
    const db = getServiceClient();
    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId")?.trim() || null;

    const now = new Date();
    const mtdStart = toYmd(new Date(now.getFullYear(), now.getMonth(), 1));
    const nextMonthStart = toYmd(new Date(now.getFullYear(), now.getMonth() + 1, 1));

    const thisMonday = mondayOfWeekContaining(now);
    const oldestMonday = new Date(thisMonday);
    oldestMonday.setDate(oldestMonday.getDate() - 49);

    const weekStarts: Date[] = [];
    for (let i = 0; i < 8; i++) {
      const w = new Date(oldestMonday);
      w.setDate(w.getDate() + i * 7);
      weekStarts.push(w);
    }

    const activeQ = db
      .from("families")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("archived_at", null);
    const newMtdQ = db
      .from("families")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("archived_at", null)
      .gte("created_at", `${mtdStart}T00:00:00.000Z`)
      .lt("created_at", `${nextMonthStart}T00:00:00.000Z`);
    const overdueQ = db
      .from("families")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("archived_at", null)
      .gt("overdue_balance_cents", 0);
    const createdQ = db
      .from("families")
      .select("created_at")
      .eq("tenant_id", tenantId)
      .is("archived_at", null)
      .gte("created_at", oldestMonday.toISOString());

    const studBase = () =>
      db
        .from("students")
        .select("family_id")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .not("family_id", "is", null);

    const [activeHead, newMtdHead, overdueHead, createdRows, studentRows] = await Promise.all([
      locationId ? activeQ.eq("primary_location_id", locationId) : activeQ,
      locationId ? newMtdQ.eq("primary_location_id", locationId) : newMtdQ,
      locationId ? overdueQ.eq("primary_location_id", locationId) : overdueQ,
      locationId ? createdQ.eq("primary_location_id", locationId) : createdQ,
      locationId ? studBase().eq("location_id", locationId) : studBase(),
    ]);

    if (activeHead.error) throw activeHead.error;
    if (newMtdHead.error) throw newMtdHead.error;
    if (overdueHead.error) throw overdueHead.error;
    if (createdRows.error) throw createdRows.error;
    if (studentRows.error) throw studentRows.error;

    const newFamiliesByWeek = [0, 0, 0, 0, 0, 0, 0, 0];
    for (const row of createdRows.data ?? []) {
      const ca = String(row.created_at ?? "");
      const created = parseYmd(ca);
      for (let i = 0; i < 8; i++) {
        const a = weekStarts[i]!;
        const b = new Date(a);
        b.setDate(b.getDate() + 7);
        if (created >= a && created < b) {
          newFamiliesByWeek[i]++;
          break;
        }
      }
    }

    const linked = studentRows.data ?? [];
    const activeStudentsLinked = linked.length;
    const familiesWithActiveStudent = new Set(
      linked.map((r) => String(r.family_id ?? "")).filter((id) => id.length > 0),
    ).size;

    return ok({
      activeFamilies: activeHead.count ?? 0,
      newFamiliesMtd: newMtdHead.count ?? 0,
      familiesPastDueBalance: overdueHead.count ?? 0,
      activeStudentsLinked,
      familiesWithActiveStudent,
      newFamiliesByWeek,
      weekLabels: ["−7", "−6", "−5", "−4", "−3", "−2", "−1", "•"],
      range: { mtdStart, mtdEnd: toYmd(new Date(now.getFullYear(), now.getMonth() + 1, 0)) },
    });
  } catch (err) {
    return serverError(err);
  }
}
