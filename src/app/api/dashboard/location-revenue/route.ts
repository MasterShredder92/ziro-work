import { type NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, serverError } from "@/lib/http";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type LocationRevenue = {
  locationId: string;
  name: string;
  shortName: string;
  color: string;
  squareLocationId: string;
  collectedCents: number;
  invoicedCents: number;
  outstandingCents: number;
  invoiceCount: number;
  collectionRate: number; // 0–100
};

export async function GET(_req: NextRequest) {
  try {
    const tenantId = await getCRMTenantId();
    const db = getServiceClient();

    const now = new Date();
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const mtdEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
    const today = now.toISOString().split("T")[0];

    // Fetch locations
    const { data: locations, error: locErr } = await db
      .from("locations")
      .select("id, name, color, square_location_id")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);
    if (locErr) throw locErr;

    // Fetch current-month invoices from square_invoices_fact
    const { data: invoices, error: invErr } = await db
      .from("square_invoices_fact")
      .select("status, amount_cents, amount_paid_cents, requested_amount, due_date, paid_at, square_location_id, location_id")
      .eq("tenant_id", tenantId)
      .gte("due_date", mtdStart)
      .lte("due_date", mtdEnd)
      .limit(20000);
    if (invErr) throw invErr;

    const rows = invoices ?? [];

    const result: LocationRevenue[] = (locations ?? []).map((loc) => {
      // Match by location_id (uuid) first, fall back to square_location_id
      const locRows = rows.filter(
        (r) =>
          r.location_id === loc.id ||
          r.square_location_id === loc.square_location_id,
      );

      const collectedCents = locRows
        .filter((r) => {
          const paidAt = r.paid_at ? r.paid_at.slice(0, 10) : null;
          if (r.status === "PAID" && r.due_date >= mtdStart && r.due_date <= mtdEnd) return true;
          if (paidAt && paidAt >= mtdStart && paidAt <= mtdEnd) return true;
          return false;
        })
        .reduce((s, r) => s + (r.amount_paid_cents ?? r.amount_cents ?? 0), 0);

      const invoicedCents = locRows.reduce(
        (s, r) => s + (r.requested_amount ?? r.amount_cents ?? 0),
        0,
      );

      const outstandingCents = locRows
        .filter(
          (r) =>
            (r.status === "UNPAID" || r.status === "PARTIALLY_PAID") &&
            r.due_date <= today,
        )
        .reduce((s, r) => s + (r.amount_cents ?? 0), 0);

      const collectionRate =
        invoicedCents > 0 ? Math.round((collectedCents / invoicedCents) * 100) : 0;

      const shortName = loc.name
        .replace(" Music Lessons", "")
        .replace(" Music", "");

      return {
        locationId: loc.id,
        name: loc.name,
        shortName,
        color: loc.color ?? "#c4f036",
        squareLocationId: loc.square_location_id ?? "",
        collectedCents,
        invoicedCents,
        outstandingCents,
        invoiceCount: locRows.length,
        collectionRate,
      };
    });

    // Sort by collected descending
    result.sort((a, b) => b.collectedCents - a.collectedCents);

    return ok({ locations: result, month: mtdStart.slice(0, 7) });
  } catch (err) {
    return serverError(err);
  }
}
