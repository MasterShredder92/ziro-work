import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";
export const dynamic = "force-dynamic";

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

type InvoiceRow = {
  status: string | null;
  amount_cents: number | null;
  requested_amount: number | null;
  amount_paid_cents: number | null;
  due_date: string | null;
  paid_at: string | null;
  square_location_id: string | null;
};

/**
 * Compute billing metrics for a set of invoice rows.
 * Logic mirrors invoices/page.tsx metricsForSqLocation() exactly.
 */
function computeMetrics(
  rows: InvoiceRow[],
  mtdStart: string,
  mtdEnd: string,
  nextStart: string,
  nextEnd: string,
  today: string,
) {
  // Rows due this month
  const mtdRows = rows.filter(
    (r) => r.due_date && r.due_date >= mtdStart && r.due_date <= mtdEnd,
  );

  // Collected = PAID invoices with due_date this month OR paid_at this month
  const collected = rows
    .filter((r) => {
      const status = r.status;
      const dueDate = r.due_date;
      const paidAt = r.paid_at ? r.paid_at.slice(0, 10) : null;
      if (status === "PAID" && dueDate && dueDate >= mtdStart && dueDate <= mtdEnd) return true;
      if (paidAt && paidAt >= mtdStart && paidAt <= mtdEnd) return true;
      return false;
    })
    .reduce((s, r) => s + (r.amount_paid_cents ?? r.amount_cents ?? 0), 0);

  // Total invoiced = sum of requested_amount (or amount_cents) for MTD rows
  const totalInvoiced = mtdRows.reduce(
    (s, r) => s + (r.requested_amount ?? r.amount_cents ?? 0),
    0,
  );

  // Actual charged = amount_cents for MTD rows (after discounts)
  const actualCharged = mtdRows.reduce((s, r) => s + (r.amount_cents ?? 0), 0);

  // Discounted = difference between requested and actual
  const discounted = Math.max(0, totalInvoiced - actualCharged);

  // Scheduled payments = SCHEDULED or UNPAID (all, not date-filtered — matches invoices page)
  const scheduled = rows
    .filter((r) => r.status === "SCHEDULED" || r.status === "UNPAID")
    .reduce((s, r) => s + (r.amount_cents ?? 0), 0);

  // Next month projected = rows due next month, using requested_amount ?? amount_cents
  const nextMonthProjected = rows
    .filter((r) => r.due_date && r.due_date >= nextStart && r.due_date <= nextEnd)
    .reduce((s, r) => s + (r.requested_amount ?? r.amount_cents ?? 0), 0);

  // Outstanding = UNPAID or PARTIALLY_PAID with due_date <= today
  const outstanding = rows
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

  return {
    collected,
    totalInvoiced,
    discounted,
    nextMonthProjected,
    scheduled,
    outstanding,
    overdueCount,
  };
}

export async function GET(_req: NextRequest) {
  try {
    const tenantId = await getCRMTenantId();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getServiceClient() as any;
    const now = new Date();
    const today = toDateStr(now);

    const mtdStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    const mtdEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const nextStart = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 1));
    const nextEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 2, 0));

    // Fetch location map
    const { data: locRows } = await db
      .from("locations")
      .select("id,name,color,square_location_id")
      .eq("tenant_id", tenantId);

    const sqToLoc: Record<string, { id: string; name: string; color: string }> = {};
    for (const loc of (locRows ?? []) as {
      id: string;
      name: string;
      color: string;
      square_location_id: string | null;
    }[]) {
      if (loc.square_location_id) {
        sqToLoc[loc.square_location_id] = { id: loc.id, name: loc.name, color: loc.color };
      }
    }

    // ── Fetch invoices for current + next month only (same window as invoices page) ──
    // This is the critical fix: restrict to due_date in [mtdStart, nextEnd]
    // so the numbers match the invoices page exactly.
    const { data: allInvoices, error } = await db
      .from("square_invoices_fact")
      .select(
        "status,amount_cents,requested_amount,amount_paid_cents,due_date,paid_at,square_location_id",
      )
      .eq("tenant_id", tenantId)
      .gte("due_date", mtdStart)
      .lte("due_date", nextEnd)
      .limit(10000);

    if (error) throw error;
    const invoices: InvoiceRow[] = allInvoices ?? [];

    const allMetrics = computeMetrics(invoices, mtdStart, mtdEnd, nextStart, nextEnd, today);

    const ORDER = ["Bellevue", "Gretna", "Elkhorn", "Omaha"];
    const locationIds = [
      ...new Set(invoices.map((r) => r.square_location_id).filter(Boolean)),
    ] as string[];

    const perLocation = locationIds
      .filter((sqId) => sqToLoc[sqId])
      .map((sqId) => {
        const info = sqToLoc[sqId];
        const locInvoices = invoices.filter((r) => r.square_location_id === sqId);
        return {
          id: info.id,
          squareLocationId: sqId,
          name: info.name,
          color: info.color,
          metrics: computeMetrics(locInvoices, mtdStart, mtdEnd, nextStart, nextEnd, today),
        };
      });

    // Sort by canonical order (match by short name)
    perLocation.sort(
      (a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name),
    );

    return NextResponse.json({
      data: { allSchools: allMetrics, locations: perLocation },
    });
  } catch (err) {
    console.error("[billing-summary]", err);
    return NextResponse.json(
      { error: "Failed to compute billing summary" },
      { status: 500 },
    );
  }
}
