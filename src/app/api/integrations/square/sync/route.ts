/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/**
 * Manual Square sync — pulls latest invoices from Square API and upserts into square_invoices
 * POST /api/integrations/square/sync
 *
 * Square's GET /v2/invoices requires a location_id.
 * We first fetch all locations for the account, then pull invoices per location.
 */

function normalizeStatus(squareStatus: string | undefined): string {
  switch ((squareStatus ?? "").toUpperCase()) {
    case "PAID": return "PAID";
    case "PARTIALLY_PAID": return "PARTIALLY_PAID";
    case "PAYMENT_PENDING": return "UNPAID";
    case "UNPAID": return "UNPAID";
    case "SCHEDULED": return "SCHEDULED";
    case "DRAFT": return "DRAFT";
    case "CANCELED":
    case "CANCELLED": return "CANCELLED";
    default: return squareStatus ?? "UNKNOWN";
  }
}

function toCents(money: { amount?: number | null } | null | undefined): number | null {
  if (!money || money.amount == null) return null;
  return money.amount;
}

function toDate(dt: string | null | undefined): string | null {
  if (!dt) return null;
  return dt.split("T")[0];
}

async function squareFetch(path: string, accessToken: string): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await fetch(`https://connect.squareup.com${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": "2024-01-17",
      "Content-Type": "application/json",
    },
  });
  let body: any;
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  return { ok: res.ok, status: res.status, body };
}

export async function POST(_req: NextRequest) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Square access token not configured. Add SQUARE_ACCESS_TOKEN to environment variables." },
      { status: 503 }
    );
  }

  const tenantId = DEFAULT_TENANT_ID;
  const db = getServiceClient();
  let totalFetched = 0;
  let totalUpserted = 0;
  const errors: string[] = [];

  try {
    // ── Step 1: Fetch all Square locations ──────────────────────────────────
    const locRes = await squareFetch("/v2/locations", accessToken);
    if (!locRes.ok) {
      return NextResponse.json(
        { error: `Square locations fetch failed (${locRes.status})`, details: locRes.body },
        { status: 502 }
      );
    }
    const locations: { id: string }[] = locRes.body?.locations ?? [];
    if (locations.length === 0) {
      return NextResponse.json({ error: "No Square locations found for this account." }, { status: 404 });
    }

    // ── Step 2: For each location, paginate through invoices ─────────────────
    for (const loc of locations) {
      let cursor: string | undefined;

      do {
        const params = new URLSearchParams({ location_id: loc.id, limit: "200" });
        if (cursor) params.set("cursor", cursor);

        const invRes = await squareFetch(`/v2/invoices?${params.toString()}`, accessToken);
        if (!invRes.ok) {
          console.error(`[Square Sync] Invoice fetch failed for location ${loc.id}:`, invRes.body);
          errors.push(`Location ${loc.id}: ${invRes.body?.errors?.[0]?.detail ?? invRes.status}`);
          break;
        }

        const invoices: Record<string, any>[] = invRes.body?.invoices ?? [];
        cursor = invRes.body?.cursor as string | undefined;
        totalFetched += invoices.length;

        if (invoices.length === 0) break;

        // Build upsert rows
        const rows = invoices.map((inv) => {
          const primaryRecipient: Record<string, any> = inv.primary_recipient ?? {};
          const paymentRequests: Record<string, any>[] = inv.payment_requests ?? [];
          const firstPayment = paymentRequests[0] ?? {};
          const computedAmountMoney = firstPayment.computed_amount_money ?? null;
          const totalCompletedAmountMoney = firstPayment.total_completed_amount_money ?? null;
          const dueDate = firstPayment.due_date ?? null;

          const row: Record<string, any> = {
            tenant_id: tenantId,
            square_invoice_id: inv.id as string,
            square_location_id: inv.location_id ?? loc.id,
            square_customer_id: primaryRecipient.customer_id ?? null,
            invoice_number: inv.invoice_number ?? null,
            title: inv.title ?? null,
            status: normalizeStatus(inv.status),
            customer_name: [primaryRecipient.given_name, primaryRecipient.family_name]
              .filter(Boolean).join(" ") || null,
            customer_email: primaryRecipient.email_address ?? null,
            amount_cents: toCents(computedAmountMoney),
            requested_amount: toCents(computedAmountMoney),
            amount_paid: toCents(totalCompletedAmountMoney),
            due_date: dueDate,
            invoice_date: toDate(inv.created_at),
            square_created_at: inv.created_at ?? null,
            paid_at: null,
            raw_data: inv,
            synced_at: new Date().toISOString(),
          };

          // Set paid_at for PAID invoices
          if ((inv.status as string)?.toUpperCase() === "PAID") {
            for (const pr of paymentRequests) {
              if (pr.completed_at) {
                row.paid_at = toDate(pr.completed_at);
                break;
              }
            }
          }

          return row;
        });

        // Upsert in batches of 50
        const batchSize = 50;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const { error } = await (db as any)
            .from("square_invoices")
            .upsert(batch, { onConflict: "square_invoice_id" });
          if (error) {
            console.error("[Square Sync] Upsert error:", error);
            errors.push(error.message);
          } else {
            totalUpserted += batch.length;
          }
        }
      } while (cursor);
    }

    console.log(`[Square Sync] Locations: ${locations.length}, Fetched: ${totalFetched}, Upserted: ${totalUpserted}`);

    if (errors.length > 0 && totalUpserted === 0) {
      return NextResponse.json(
        { error: `Sync failed: ${errors[0]}`, errors },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      locationCount: locations.length,
      invoiceCount: totalFetched,
      upsertedCount: totalUpserted,
      errors: errors.length > 0 ? errors : undefined,
      message: `Synced ${totalUpserted} of ${totalFetched} invoices across ${locations.length} location(s).`,
    });
  } catch (err: any) {
    console.error("[Square Sync] Unexpected error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error during sync" },
      { status: 500 }
    );
  }
}
