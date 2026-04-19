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

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
}
function startOfNextMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().split("T")[0];
}
function endOfNextMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 2, 0).toISOString().split("T")[0];
}

export async function GET() {
  try {
    const tenantId = await getCRMTenantId();
    const db = getServiceClient();
    const now = new Date();
    const mtdStart = startOfMonth(now);
    const mtdEnd = endOfMonth(now);
    const nextStart = startOfNextMonth(now);
    const nextEnd = endOfNextMonth(now);

    // Fetch all invoices for this tenant
    const { data: allInvoices, error } = await db
      .from("square_invoices")
      .select("id,status,amount_cents,requested_amount,amount_paid,invoice_date,due_date,paid_at,location_id,recurring_series_id")
      .eq("tenant_id", tenantId);

    if (error) throw error;
    const invoices = allInvoices ?? [];

    function computeMetrics(rows: typeof invoices) {
      const mtdInvoices = rows.filter((r) => r.invoice_date && r.invoice_date >= mtdStart && r.invoice_date <= mtdEnd);
      const collected = rows
        .filter((r) => r.paid_at && r.paid_at >= `${mtdStart}T00:00:00` && r.paid_at <= `${mtdEnd}T23:59:59`)
        .reduce((s, r) => s + (r.amount_paid ?? r.amount_cents ?? 0), 0);
      const totalInvoiced = mtdInvoices.reduce((s, r) => s + (r.requested_amount ?? r.amount_cents ?? 0), 0);
      const actualCharged = mtdInvoices.reduce((s, r) => s + (r.amount_cents ?? 0), 0);
      const discounted = Math.max(0, totalInvoiced - actualCharged);
      const scheduled = rows
        .filter((r) => r.status === "SCHEDULED" || (r.status === "UNPAID" && r.due_date && r.due_date > mtdEnd))
        .reduce((s, r) => s + (r.amount_cents ?? 0), 0);
      // Next month projected: recurring series invoices due next month
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
    const locationIds = [...new Set(invoices.map((r) => r.location_id).filter(Boolean))] as string[];
    const perLocation = locationIds.map((locId) => ({
      id: locId,
      name: LOCATION_NAMES[locId] ?? locId,
      color: LOCATION_COLORS[locId] ?? "#909098",
      metrics: computeMetrics(invoices.filter((r) => r.location_id === locId)),
    }));

    // Sort by known location order
    const ORDER = Object.keys(LOCATION_NAMES);
    perLocation.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

    return NextResponse.json({ data: { allSchools: allMetrics, locations: perLocation } });
  } catch (err) {
    console.error("[billing-summary]", err);
    return NextResponse.json({ error: "Failed to compute billing summary" }, { status: 500 });
  }
}
