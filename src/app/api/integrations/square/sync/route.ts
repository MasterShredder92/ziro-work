import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/**
 * Manual Square sync — pulls latest invoices from Square API and upserts into square_invoices
 * POST /api/integrations/square/sync
 */

// Map Square invoice status to our normalized status
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

// Convert Square money object (amount in smallest currency unit) to cents
function toCents(money: { amount?: number | null; currency?: string } | null | undefined): number | null {
  if (!money || money.amount == null) return null;
  return money.amount; // Square already stores in cents for USD
}

// Extract a date string (YYYY-MM-DD) from a Square datetime string
function toDate(dt: string | null | undefined): string | null {
  if (!dt) return null;
  return dt.split("T")[0];
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
  let cursor: string | undefined;
  let totalFetched = 0;
  let totalUpserted = 0;
  const errors: string[] = [];

  try {
    // Paginate through all Square invoices
    do {
      const url = new URL("https://connect.squareup.com/v2/invoices");
      url.searchParams.set("limit", "200");
      if (cursor) url.searchParams.set("cursor", cursor);

      const invoicesRes = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Square-Version": "2024-01-17",
          "Content-Type": "application/json",
        },
      });

      if (!invoicesRes.ok) {
        const err = await invoicesRes.json();
        console.error("[Square Sync] Invoice fetch failed:", err);
        return NextResponse.json({ error: "Square API error", details: err }, { status: 502 });
      }

      const invoicesData = await invoicesRes.json();
      const invoices: Record<string, unknown>[] = invoicesData.invoices ?? [];
      cursor = invoicesData.cursor as string | undefined;
      totalFetched += invoices.length;

      if (invoices.length === 0) break;

      // Build upsert rows
      const rows = invoices.map((inv) => {
        const primaryRecipient = (inv.primary_recipient as Record<string, unknown> | null) ?? {};
        const paymentRequests = (inv.payment_requests as Record<string, unknown>[] | null) ?? [];
        const firstPayment = paymentRequests[0] ?? {};
        const computedAmountMoney = firstPayment.computed_amount_money as { amount?: number } | null;
        const totalCompletedAmountMoney = firstPayment.total_completed_amount_money as { amount?: number } | null;
        const dueDate = (firstPayment.due_date as string | null) ?? null;

        return {
          tenant_id: tenantId,
          square_invoice_id: inv.id as string,
          square_location_id: (inv.location_id as string | null) ?? null,
          square_customer_id: (primaryRecipient.customer_id as string | null) ?? null,
          invoice_number: (inv.invoice_number as string | null) ?? null,
          title: (inv.title as string | null) ?? null,
          status: normalizeStatus(inv.status as string | undefined),
          customer_name: (primaryRecipient.given_name && primaryRecipient.family_name
            ? `${primaryRecipient.given_name} ${primaryRecipient.family_name}`
            : (primaryRecipient.given_name as string | null) ?? (primaryRecipient.family_name as string | null) ?? null),
          customer_email: (primaryRecipient.email_address as string | null) ?? null,
          amount_cents: toCents(computedAmountMoney),
          requested_amount: toCents(computedAmountMoney),
          amount_paid: toCents(totalCompletedAmountMoney),
          due_date: dueDate,
          invoice_date: toDate(inv.created_at as string | null),
          square_created_at: (inv.created_at as string | null) ?? null,
          paid_at: toDate(inv.payment_conditions ? null : null), // set below if PAID
          raw_data: inv,
          synced_at: new Date().toISOString(),
        };
      });

      // Set paid_at for PAID invoices from payment_requests
      for (let i = 0; i < invoices.length; i++) {
        const inv = invoices[i];
        if ((inv.status as string)?.toUpperCase() === "PAID") {
          const paymentRequests = (inv.payment_requests as Record<string, unknown>[] | null) ?? [];
          for (const pr of paymentRequests) {
            const completedAt = (pr.completed_at as string | null) ?? null;
            if (completedAt) {
              rows[i].paid_at = toDate(completedAt);
              break;
            }
          }
        }
      }

      // Upsert in batches of 50
      const batchSize = 50;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await db
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

    console.log(`[Square Sync] Fetched ${totalFetched}, upserted ${totalUpserted} invoices`);

    return NextResponse.json({
      success: true,
      invoiceCount: totalFetched,
      upsertedCount: totalUpserted,
      errors: errors.length > 0 ? errors : undefined,
      message: `Synced ${totalUpserted} of ${totalFetched} invoices from Square.`,
    });
  } catch (err) {
    console.error("[Square Sync] Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error during sync" }, { status: 500 });
  }
}
