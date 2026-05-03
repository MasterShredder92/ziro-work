import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "@/app/api/crm/_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mtdBounds() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1).toISOString().split("T")[0];
  const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];
  return { start, end, today };
}

/**
 * GET /api/dashboard/metrics
 *
 * Returns current-month-scoped metrics for the main dashboard:
 * - activeStudents: count of students with status='active'
 * - inactiveStudents: count of students with status='inactive'
 * - activeFamilies: count of non-archived families
 * - collectedCents: sum of paid invoice totals this month
 * - outstandingCents: sum of open/overdue invoice balances
 * - overdueCount: number of overdue invoices
 * - scheduledCents: sum of scheduled invoice totals this month
 * - projectedMonthlyCents: active students × rate_tier × sessions_per_month
 *   (from v_family_billing, current month only)
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
    const { start, end, today } = mtdBounds();

    // ── Student counts ─────────────────────────────────────────────
    const { data: studentCounts, error: scErr } = await db
      .from("students")
      .select("status")
      .eq("tenant_id", tenantId);
    if (scErr) throw scErr;

    const activeStudents = (studentCounts ?? []).filter((s) => s.status === "active").length;
    const inactiveStudents = (studentCounts ?? []).filter((s) => s.status === "inactive").length;

    // ── Active families ────────────────────────────────────────────
    const { count: activeFamilies, error: famErr } = await db
      .from("families")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("archived_at", null);
    if (famErr) throw famErr;

    // ── Invoice metrics (MTD from invoices table) ──────────────────
    const { data: invoices, error: invErr } = await db
      .from("invoices")
      .select("status, total_cents, amount_paid_cents, balance_cents, paid_at, due_date, amount_cents")
      .eq("tenant_id", tenantId)
      .gte("due_date", start)
      .lte("due_date", end);
    if (invErr) throw invErr;

    const invRows = invoices ?? [];

    const collectedCents = invRows
      .filter((i) => i.status === "paid" && i.paid_at)
      .reduce((s, i) => s + (i.amount_paid_cents ?? i.total_cents ?? i.amount_cents ?? 0), 0);

    // 'open' = unpaid/outstanding in this schema
    const outstandingCents = invRows
      .filter((i) => i.status === "open")
      .reduce((s, i) => s + (i.balance_cents ?? i.total_cents ?? i.amount_cents ?? 0), 0);

    const overdueCount = invRows.filter(
      (i) => i.status === "open" && i.due_date && i.due_date < today,
    ).length;

    const scheduledCents = invRows
      .filter((i) => i.status === "scheduled")
      .reduce((s, i) => s + (i.total_cents ?? i.amount_cents ?? 0), 0);

    // ── Projected monthly revenue from pricing_tiers SSOT ─────────
    // v_family_billing joins families + pricing_tiers + active student count
    // projected = SUM(rate_tier_cents * sessions_per_month) per active family
    const { data: billingRows, error: billingErr } = await db
      .from("v_family_billing")
      .select("family_monthly_total_cents, tier_sessions_per_month, active_student_count")
      .eq("tenant_id", tenantId);

    let projectedMonthlyCents = 0;
    if (!billingErr && billingRows) {
      projectedMonthlyCents = billingRows.reduce((s, r) => {
        // family_monthly_total_cents is already the full monthly total for this family
        return s + (r.family_monthly_total_cents ?? 0);
      }, 0);
    }

    return ok({
      activeStudents,
      inactiveStudents,
      activeFamilies: activeFamilies ?? 0,
      collectedCents,
      outstandingCents,
      overdueCount,
      scheduledCents,
      projectedMonthlyCents,
      mtd: { start, end, today },
    });
  } catch (err) {
    return serverError(err);
  }
}
