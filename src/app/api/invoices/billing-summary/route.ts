import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";
export const dynamic = "force-dynamic";

// Internal UUID → location info (used as fallback)
const UUID_LOCATION_MAP: Record<string, { name: string; color: string }> = {
  "f7b52dd5-12ee-437f-9c60-f8adf454ac31": { name: "Bellevue", color: "#7C3AED" },
  "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": { name: "Gretna", color: "#16A34A" },
  "cebd97d4-c241-4de2-8ade-49e5cc0070d5": { name: "Elkhorn", color: "#0EA5E9" },
  "d48229c1-b70a-4d29-893e-5079887dab76": { name: "Omaha", color: "#DC2626" },
};

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function normalizePaidAt(paidAt: string | null | undefined): string | null {
  if (!paidAt) return null;
  return paidAt.slice(0, 10);
}

type InvoiceRow = {
  status: string | null;
  amount_cents: number | null;
  requested_amount: number | null;
  amount_paid_cents: number | null;
  invoice_date: string | null;
  due_date: string | null;
  paid_at: string | null;
  square_location_id: string | null;
  location_id: string | null;
  recurring_series_id: string | null;
};

function computeMetrics(
  rows: InvoiceRow[],
  mtdStart: string,
  mtdEnd: string,
  nextStart: string,
  nextEnd: string
) {
  const today = toDateStr(new Date());

  const mtdInvoices = rows.filter(
    (r) => r.invoice_date && r.invoice_date >= mtdStart && r.invoice_date <= mtdEnd
  );

  const collected = rows
    .filter((r) => {
      // Primary: paid_at in current month
      const d = normalizePaidAt(r.paid_at);
      if (d !== null && d >= mtdStart && d <= mtdEnd) return true;
      // Fallback: PAID status with invoice_date in current month (when paid_at is missing)
      if (r.status === "PAID" && r.invoice_date && r.invoice_date >= mtdStart && r.invoice_date <= mtdEnd) return true;
      return false;
    })
    .reduce((s, r) => s + (r.amount_paid_cents ?? r.amount_cents ?? 0), 0);

  const totalInvoiced = mtdInvoices.reduce(
    (s, r) => s + (r.requested_amount ?? r.amount_cents ?? 0),
    0
  );

  const actualCharged = mtdInvoices.reduce((s, r) => s + (r.amount_cents ?? 0), 0);
  const discounted = Math.max(0, totalInvoiced - actualCharged);

  const scheduled = rows
    .filter(
      (r) =>
        r.status === "SCHEDULED" ||
        (r.status === "UNPAID" && r.due_date && r.due_date > mtdEnd)
    )
    .reduce((s, r) => s + (r.amount_cents ?? 0), 0);

  const nextMonthProjected = rows
    .filter((r) => r.due_date && r.due_date >= nextStart && r.due_date <= nextEnd)
    .reduce((s, r) => s + (r.amount_cents ?? 0), 0);

  const outstanding = rows
    .filter(
      (r) =>
        (r.status === "UNPAID" || r.status === "PARTIALLY_PAID") &&
        r.due_date &&
        r.due_date <= today
    )
    .reduce((s, r) => s + (r.amount_cents ?? 0), 0);

  const overdueCount = rows.filter(
    (r) =>
      (r.status === "UNPAID" || r.status === "PARTIALLY_PAID") &&
      r.due_date &&
      r.due_date < today
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

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getCRMTenantId();
    const db = getServiceClient();
    const now = new Date();

    const mtdStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    const mtdEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const nextStart = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 1));
    const nextEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 2, 0));

    // Fetch from square_invoices_fact — the table the sync writes to
    const { data: allInvoices, error } = await (db as any)
      .from("square_invoices_fact")
      .select("status,amount_cents,requested_amount,amount_paid_cents,invoice_date,due_date,paid_at,square_location_id,location_id,recurring_series_id")
      .eq("tenant_id", tenantId);

    if (error) throw error;
    const invoices: InvoiceRow[] = allInvoices ?? [];

    // Build square_location_id → display info map dynamically
    const sqLocToInfo: Record<string, { name: string; color: string }> = {};
    for (const inv of invoices) {
      const sqId = inv.square_location_id;
      const uuidId = inv.location_id;
      if (sqId && !sqLocToInfo[sqId]) {
        if (uuidId && UUID_LOCATION_MAP[uuidId]) {
          sqLocToInfo[sqId] = UUID_LOCATION_MAP[uuidId];
        }
        // else: unknown Square location — skip from per-location breakdown
      }
    }

    const allMetrics = computeMetrics(invoices, mtdStart, mtdEnd, nextStart, nextEnd);

    const locationIds = [...new Set(invoices.map((r) => r.square_location_id).filter(Boolean))] as string[];
    const perLocation = locationIds
      .filter((sqId) => sqLocToInfo[sqId]) // only known locations
      .map((sqId) => {
        const info = sqLocToInfo[sqId];
        const locInvoices = invoices.filter((r) => r.square_location_id === sqId);
        return {
          id: sqId,
          name: info.name,
          color: info.color,
          metrics: computeMetrics(locInvoices, mtdStart, mtdEnd, nextStart, nextEnd),
        };
      });

    const ORDER = ["Bellevue", "Gretna", "Elkhorn", "Omaha"];
    perLocation.sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));

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
