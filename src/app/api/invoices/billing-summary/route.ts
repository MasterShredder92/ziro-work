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

function computeMetrics(
  rows: InvoiceRow[],
  mtdStart: string,
  mtdEnd: string,
  nextStart: string,
  nextEnd: string
) {
  const today = toDateStr(new Date());

  const mtdInvoices = rows.filter(
    (r) => r.due_date && r.due_date >= mtdStart && r.due_date <= mtdEnd
  );

  const collected = rows
    .filter((r) => {
      if (r.status === "PAID" && r.due_date && r.due_date >= mtdStart && r.due_date <= mtdEnd) return true;
      const d = r.paid_at ? r.paid_at.slice(0, 10) : null;
      if (d && d >= mtdStart && d <= mtdEnd) return true;
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

  return { collected, totalInvoiced, discounted, nextMonthProjected, scheduled, outstanding, overdueCount };
}

export async function GET(_req: NextRequest) {
  try {
    const tenantId = await getCRMTenantId();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getServiceClient() as any;
    const now = new Date();

    const mtdStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    const mtdEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const nextStart = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 1));
    const nextEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 2, 0));

    // Fetch location map from locations table (has square_location_id column)
    const { data: locRows } = await db
      .from("locations")
      .select("id,name,color,square_location_id")
      .eq("tenant_id", tenantId);

    const sqToLoc: Record<string, { id: string; name: string; color: string }> = {};
    for (const loc of (locRows ?? []) as { id: string; name: string; color: string; square_location_id: string | null }[]) {
      if (loc.square_location_id) {
        sqToLoc[loc.square_location_id] = { id: loc.id, name: loc.name, color: loc.color };
      }
    }

    // Fetch all invoices — limit 10000 to bypass Supabase 1000-row default cap
    const { data: allInvoices, error } = await db
      .from("square_invoices_fact")
      .select("status,amount_cents,requested_amount,amount_paid_cents,due_date,paid_at,square_location_id")
      .eq("tenant_id", tenantId)
      .limit(10000);

    if (error) throw error;
    const invoices: InvoiceRow[] = allInvoices ?? [];

    const allMetrics = computeMetrics(invoices, mtdStart, mtdEnd, nextStart, nextEnd);

    const ORDER = ["Bellevue Music Lessons", "Gretna Music Lessons", "Elkhorn Music Lessons", "Omaha Music Lessons"];
    const locationIds = [...new Set(invoices.map((r) => r.square_location_id).filter(Boolean))] as string[];
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
          metrics: computeMetrics(locInvoices, mtdStart, mtdEnd, nextStart, nextEnd),
        };
      });

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
