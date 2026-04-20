import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";

export const dynamic = "force-dynamic";

const LOCATION_NAMES: Record<string, string> = {
  "f7b52dd5-12ee-437f-9c60-f8adf454ac31": "Bellevue",
  "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": "Gretna",
  "cebd97d4-c241-4de2-8ade-49e5cc0070d5": "Elkhorn",
  "d48229c1-b70a-4d29-893e-5079887dab76": "Omaha",
};

const LOCATION_COLORS: Record<string, string> = {
  "f7b52dd5-12ee-437f-9c60-f8adf454ac31": "#7C3AED",
  "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": "#16A34A",
  "cebd97d4-c241-4de2-8ade-49e5cc0070d5": "#0EA5E9",
  "d48229c1-b70a-4d29-893e-5079887dab76": "#DC2626",
};

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Normalize a paid_at value to a plain YYYY-MM-DD string for comparison.
 *  paid_at may be stored as "2026-04-15" or "2026-04-15T00:00:00Z" depending on sync source. */
function normalizePaidAt(paidAt: string | null): string | null {
  if (!paidAt) return null;
  return paidAt.slice(0, 10); // always take first 10 chars = YYYY-MM-DD
}

export async function GET() {
  try {
    const tenantId = await getCRMTenantId();
    const db = getServiceClient();
    const now = new Date();

    // Current month bounds (YYYY-MM-DD)
    const mtdStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    const mtdEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    // Next month bounds
    const nextStart = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 1));
    const nextEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 2, 0));

    // Fetch all invoices for this tenant
    const { data: allInvoices, error } = await db
      .from("square_invoices")
      .select("id,status,amount_cents,requested_amount,amount_paid,invoice_date,due_date,paid_at,location_id,recurring_series_id")
      .eq("tenant_id", tenantId);

    if (error) throw error;
    const invoices = allInvoices ?? [];

    function computeMetrics(rows: typeof invoices) {
      // Invoices created/issued this month
      const mtdInvoices = rows.filter(
        (r) => r.invoice_date && r.invoice_date >= mtdStart && r.invoice_date <= mtdEnd
      );

      // Collected = invoices paid this month (normalize paid_at to date-only for comparison)
      const collected = rows
        .filter((r) => {
          const d = normalizePaidAt(r.paid_at);
          return d !== null && d >= mtdStart && d <= mtdEnd;
        })
        .reduce((s, r) => s + (r.amount_paid ?? r.amount_cents ?? 0), 0);

      // Total invoiced = sum of requested amounts for invoices issued this month
      const totalInvoiced = mtdInvoices.reduce(
        (s, r) => s + (r.requested_amount ?? r.amount_cents ?? 0),
        0
      );

      // Actual charged = what was actually billed (after any discounts applied in Square)
      const actualCharged = mtdInvoices.reduce((s, r) => s + (r.amount_cents ?? 0), 0);

      // Discounted = difference between requested and actual (Square discounts)
      const discounted = Math.max(0, totalInvoiced - actualCharged);

      // Scheduled = invoices that are scheduled or unpaid with future due dates
      const scheduled = rows
        .filter(
          (r) =>
            r.status === "SCHEDULED" ||
            (r.status === "UNPAID" && r.due_date && r.due_date > mtdEnd)
        )
        .reduce((s, r) => s + (r.amount_cents ?? 0), 0);

      // Next month projected = invoices due next month (recurring + one-time)
      const nextMonthProjected = rows
        .filter((r) => r.due_date && r.due_date >= nextStart && r.due_date <= nextEnd)
        .reduce((s, r) => s + (r.amount_cents ?? 0), 0);

      return {
        collected,
        totalInvoiced,
        discounted,
        nextMonthProjected,
        scheduled,
      };
    }

    // All schools
    const allMetrics = computeMetrics(invoices);

    // Per location
    const locationIds = [
      ...new Set(invoices.map((r) => r.location_id).filter(Boolean)),
    ] as string[];

    const perLocation = locationIds.map((locId) => ({
      id: locId,
      name: LOCATION_NAMES[locId] ?? locId,
      color: LOCATION_COLORS[locId] ?? "#909098",
      metrics: computeMetrics(invoices.filter((r) => r.location_id === locId)),
    }));

    // Sort by known location order
    const ORDER = Object.keys(LOCATION_NAMES);
    perLocation.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

    return NextResponse.json({
      data: { allSchools: allMetrics, locations: perLocation },
    });
  } catch (err) {
    console.error("[billing-summary]", err);
    return NextResponse.json(
      { error: "Failed to compute billing summary" },
      { status: 500 }
    );
  }
}
