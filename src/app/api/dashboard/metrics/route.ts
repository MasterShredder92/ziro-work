import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, serverError } from "@/lib/http";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * GET /api/dashboard/metrics
 *
 * Returns current-month-scoped metrics for the main dashboard.
 *
 * Money figures pull from square_invoices_fact — same source as the
 * invoices page and billing-summary route — so numbers are accurate.
 *
 * Returns:
 * - activeStudents: count from students.status='active'
 * - activeFamilies: count of non-archived families
 * - collectedCents: PAID invoices this month (MTD)
 * - outstandingCents: UNPAID/PARTIALLY_PAID past due date
 * - overdueCount: count of overdue invoices
 * - scheduledCents: SCHEDULED invoices this month
 * - projectedMonthlyCents: from v_family_billing (pricing_tiers SSOT)
 * - totalInvoicedCents: sum of requested_amount for MTD rows
 */
export async function GET(_req: NextRequest) {
  try {
    const tenantId = await getCRMTenantId();
    const db = getServiceClient();

    const now = new Date();
    const today = toDateStr(now);
    const mtdStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    const mtdEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const nextStart = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 1));
    const nextEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 2, 0));

    // ── Student counts ─────────────────────────────────────────────
    const { data: studentCounts, error: scErr } = await db
      .from("students")
      .select("status")
      .eq("tenant_id", tenantId);
    if (scErr) throw scErr;

    const activeStudents = (studentCounts ?? []).filter((s) => s.status === "active").length;

    // ── Active families ────────────────────────────────────────────
    const { count: activeFamilies, error: famErr } = await db
      .from("families")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("archived_at", null);
    if (famErr) throw famErr;

    // ── Invoice metrics from square_invoices_fact (same as billing-summary) ──
    // Fetch current + next month window to compute all metrics
    const { data: allInvoices, error: invErr } = await db
      .from("square_invoices_fact")
      .select("status,amount_cents,requested_amount,amount_paid_cents,due_date,paid_at")
      .eq("tenant_id", tenantId)
      .gte("due_date", mtdStart)
      .lte("due_date", nextEnd)
      .limit(10000);
    if (invErr) throw invErr;

    const rows = allInvoices ?? [];

    // MTD rows only (due this month)
    const mtdRows = rows.filter(
      (r) => r.due_date && r.due_date >= mtdStart && r.due_date <= mtdEnd,
    );

    // Collected = PAID invoices with due_date this month OR paid_at this month
    const collectedCents = rows
      .filter((r) => {
        const paidAt = r.paid_at ? r.paid_at.slice(0, 10) : null;
        if (r.status === "PAID" && r.due_date && r.due_date >= mtdStart && r.due_date <= mtdEnd)
          return true;
        if (paidAt && paidAt >= mtdStart && paidAt <= mtdEnd) return true;
        return false;
      })
      .reduce((s, r) => s + (r.amount_paid_cents ?? r.amount_cents ?? 0), 0);

    // Total invoiced = sum of requested_amount for MTD rows
    const totalInvoicedCents = mtdRows.reduce(
      (s, r) => s + (r.requested_amount ?? r.amount_cents ?? 0),
      0,
    );

    // Outstanding = UNPAID or PARTIALLY_PAID with due_date <= today
    const outstandingCents = rows
      .filter(
        (r) =>
          (r.status === "UNPAID" || r.status === "PARTIALLY_PAID") &&
          r.due_date &&
          r.due_date <= today,
      )
      .reduce((s, r) => s + (r.amount_cents ?? 0), 0);

    const overdueCount = rows.filter(
      (r) =>
        (r.status === "UNPAID" || r.status === "PARTIALLY_PAID") &&
        r.due_date &&
        r.due_date < today,
    ).length;

    // Scheduled = SCHEDULED or UNPAID (all, not date-filtered — matches invoices page)
    const scheduledCents = rows
      .filter((r) => r.status === "SCHEDULED" || r.status === "UNPAID")
      .reduce((s, r) => s + (r.amount_cents ?? 0), 0);

    // ── Projected monthly revenue from pricing_tiers SSOT ─────────
    // v_family_billing.family_monthly_total_cents = already the full monthly
    // total per family (rate × sessions, with multi-student tier applied)
    const { data: billingRows, error: billingErr } = await db
      .from("v_family_billing")
      .select("family_monthly_total_cents")
      .eq("tenant_id", tenantId);

    let projectedMonthlyCents = 0;
    if (!billingErr && billingRows) {
      projectedMonthlyCents = billingRows.reduce(
        (s, r) => s + (r.family_monthly_total_cents ?? 0),
        0,
      );
    }

    return ok({
      activeStudents,
      activeFamilies: activeFamilies ?? 0,
      collectedCents,
      totalInvoicedCents,
      outstandingCents,
      overdueCount,
      scheduledCents,
      projectedMonthlyCents,
      mtd: { start: mtdStart, end: mtdEnd, today },
    });
  } catch (err) {
    return serverError(err);
  }
}
