/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/**
 * Square Webhook Receiver — processes real-time events from Square
 *
 * Register this URL in Square Developer Dashboard → Webhooks:
 *   https://ziro-work.vercel.app/api/integrations/square/webhook
 *
 * Subscribe to these events:
 *   invoice.created, invoice.updated, invoice.payment_made, invoice.canceled, invoice.deleted,
 *   payment.created, payment.updated,
 *   customer.created, customer.updated, customer.deleted,
 *   refund.created, refund.updated,
 *   order.created, order.updated
 */

function verifySquareSignature(
  body: string,
  signature: string | null,
  signingKey: string,
  notificationUrl: string
): boolean {
  if (!signature || !signingKey) return false;
  const hmac = crypto.createHmac("sha256", signingKey);
  hmac.update(notificationUrl + body);
  const expected = hmac.digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

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

async function resolveFamilyId(db: any, tenantId: string, squareCustomerId: string | null): Promise<string | null> {
  if (!squareCustomerId) return null;
  const { data } = await db
    .from("families")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("square_customer_id", squareCustomerId)
    .limit(1);
  if (data?.length > 0) return data[0].id;
  // families is the exclusive billing entity — no student fallback.
  return null;
}

async function handleInvoiceEvent(db: any, tenantId: string, eventType: string, invoiceData: any) {
  const inv = invoiceData?.object?.invoice ?? invoiceData;
  if (!inv?.id) return;

  const primaryRecipient = inv.primary_recipient ?? {};
  const paymentRequests: any[] = inv.payment_requests ?? [];
  const firstPayment = paymentRequests[0] ?? {};
  const computedAmountMoney = firstPayment.computed_amount_money ?? null;
  const totalCompletedAmountMoney = firstPayment.total_completed_amount_money ?? null;
  const dueDate = firstPayment.due_date ?? null;
  const sqCustId: string | null = primaryRecipient.customer_id ?? null;
  const familyId = await resolveFamilyId(db, tenantId, sqCustId);

  // Resolve internal uuid location_id from Square text location_id (NOT NULL UUID column)
  let internalLocationId: string | null = null;
  if (inv.location_id) {
    const { data: locRow } = await db
      .from("locations")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("square_location_id", inv.location_id)
      .maybeSingle();
    internalLocationId = locRow?.id ?? null;
  }

  if (eventType === "invoice.deleted") {
    await db.from("square_invoices").delete().eq("square_invoice_id", inv.id).eq("tenant_id", tenantId);
    console.log(`[Square Webhook] Deleted invoice ${inv.id}`);
    return;
  }

  const row: Record<string, any> = {
    tenant_id: tenantId,
    square_invoice_id: inv.id,
    square_location_id: inv.location_id ?? null,
    location_id: internalLocationId,
    square_customer_id: sqCustId,
    family_id: familyId,
    invoice_number: inv.invoice_number ?? null,
    title: inv.title ?? null,
    status: normalizeStatus(inv.status),
    customer_name: [primaryRecipient.given_name, primaryRecipient.family_name].filter(Boolean).join(" ") || null,
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
      if (pr.completed_at) { row.paid_at = toDate(pr.completed_at); break; }
    }
  }

  const upsertRes = await db.from("square_invoices").upsert(row, { onConflict: "square_invoice_id" });
  if (upsertRes.error) {
    console.error(`[Square Webhook] square_invoices upsert FAILED for ${inv.id}:`, upsertRes.error.message, upsertRes.error.details);
  }

  // Also update our internal invoices table so ZiroWork records reflect real status
  const internalStatusMap: Record<string, string> = {
    PAID: "paid",
    PARTIALLY_PAID: "partially_paid",
    UNPAID: "open",
    SCHEDULED: "scheduled",
    DRAFT: "draft",
    CANCELLED: "cancelled",
  };
  const internalStatus = internalStatusMap[row.status] ?? null;
  if (internalStatus) {
    const { error: intErr } = await db
      .from("invoices")
      .update({
        status: internalStatus,
        balance_cents: Math.max(0, (row.amount_cents ?? 0) - (row.amount_paid ?? 0)),
        square_public_url: inv.public_url ?? undefined,
        ...(internalStatus === "paid" ? { paid_at: row.paid_at ?? new Date().toISOString() } : {}),
      })
      .eq("square_invoice_id", inv.id);
    if (intErr) {
      console.warn(`[Square Webhook] internal invoices update failed for ${inv.id}:`, intErr.message);
    }
  }

  console.log(`[Square Webhook] Upserted invoice ${inv.id} (${row.status}) family=${familyId ?? "unlinked"}`);
}

async function handlePaymentEvent(db: any, tenantId: string, paymentData: any) {
  const pay = paymentData?.object?.payment ?? paymentData;
  if (!pay?.id) return;

  const amtMoney = pay.amount_money ?? {};
  const totalMoney = pay.total_money ?? {};
  const netMoney = pay.net_amount_money ?? {};
  const refundedMoney = pay.refunded_money ?? {};
  const tipMoney = pay.tip_money ?? {};
  const appFeeMoney = pay.app_fee_money ?? {};
  const processingFees: any[] = pay.processing_fee ?? [];
  const processingFeeTotal = processingFees.reduce(
    (sum: number, fee: any) => sum + ((fee.amount_money?.amount as number) ?? 0), 0
  );
  const reportingDate = toDate(pay.created_at) ?? new Date().toISOString().split("T")[0];
  const sourceType = pay.source_type ?? (pay.card_details ? "CARD" : pay.cash_details ? "CASH" : "OTHER");
  const tenderBucket = sourceType === "CARD" ? "card" : sourceType === "CASH" ? "cash" : "other";

  const row = {
    tenant_id: tenantId,
    square_payment_id: pay.id,
    square_location_id: pay.location_id ?? null,
    location_id: pay.location_id ?? null,
    status: pay.status ?? "UNKNOWN",
    reporting_date: reportingDate,
    amount_money_cents: amtMoney.amount ?? null,
    total_money_cents: totalMoney.amount ?? null,
    net_total_cents: netMoney.amount ?? null,
    refunded_money_cents: refundedMoney.amount ?? null,
    tip_money_cents: tipMoney.amount ?? null,
    application_fee_money_cents: appFeeMoney.amount ?? null,
    processing_fee_total_cents: processingFeeTotal,
    source_type: sourceType,
    tender_bucket: tenderBucket,
    created_at_square: pay.created_at ?? null,
    updated_at_square: pay.updated_at ?? null,
    raw_json: pay,
    synced_at: new Date().toISOString(),
  };

  await db.from("square_payments_fact").upsert(row, { onConflict: "square_payment_id" });
  console.log(`[Square Webhook] Upserted payment ${pay.id} (${row.status}) $${(row.total_money_cents ?? 0) / 100}`);
}

async function handleCustomerEvent(db: any, tenantId: string, eventType: string, customerData: any) {
  const cust = customerData?.object?.customer ?? customerData;
  if (!cust?.id) return;

  const email: string | null = cust.email_address ?? null;
  const squareCustId: string = cust.id;

  if (eventType === "customer.deleted") {
    // Don't delete from our system, just log
    console.log(`[Square Webhook] Customer deleted: ${squareCustId}`);
    return;
  }

  if (!email) return;

  // Try to link to a family by email
  const { data: families } = await db
    .from("families")
    .select("id, square_customer_id")
    .eq("tenant_id", tenantId)
    .ilike("primary_email", email)
    .limit(1);

  if (families?.length > 0 && !families[0].square_customer_id) {
    await db.from("families")
      .update({ square_customer_id: squareCustId, updated_at: new Date().toISOString() })
      .eq("id", families[0].id).eq("tenant_id", tenantId);
    console.log(`[Square Webhook] Linked customer ${squareCustId} to family ${families[0].id}`);
    return;
  }

  // families is the exclusive billing entity — no student fallback.
}

export async function POST(req: NextRequest) {
  assertServiceRoleAllowed("Square webhook — no caller session, HMAC signature-based auth");
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");
  const signingKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? "";
  const notificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://ziro-work.vercel.app"}/api/integrations/square/webhook`;

  // Verify signature if key is configured
  if (signingKey) {
    const valid = verifySquareSignature(rawBody, signature, signingKey, notificationUrl);
    if (!valid) {
      console.warn("[Square Webhook] Invalid signature — rejecting");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.type as string;
  const eventData = event.data as any;
  console.log("[Square Webhook] Received:", eventType, event.event_id);

  const tenantId = DEFAULT_TENANT_ID;
  const db = getServiceClient();

  try {
    switch (eventType) {
      // ── Invoice events ──────────────────────────────────────────────────
      case "invoice.created":
      case "invoice.updated":
      case "invoice.payment_made":
      case "invoice.canceled":
      case "invoice.published":
      case "invoice.refunded":
      case "invoice.deleted":
        await handleInvoiceEvent(db, tenantId, eventType, eventData);
        break;

      // ── Payment events ──────────────────────────────────────────────────
      case "payment.created":
      case "payment.updated":
        await handlePaymentEvent(db, tenantId, eventData);
        break;

      // ── Customer events — keep family links current (families is the exclusive billing entity) ──
      case "customer.created":
      case "customer.updated":
      case "customer.deleted":
        await handleCustomerEvent(db, tenantId, eventType, eventData);
        break;

      // ── Refund events ────────────────────────────────────────────────────
      case "refund.created":
      case "refund.updated": {
        // Update the related payment's refunded_money_cents
        const refund = eventData?.object?.refund ?? eventData;
        if (refund?.payment_id) {
          const refundedCents = refund.amount_money?.amount ?? 0;
          await db.from("square_payments_fact")
            .update({ refunded_money_cents: refundedCents, synced_at: new Date().toISOString() })
            .eq("square_payment_id", refund.payment_id)
            .eq("tenant_id", tenantId);
          console.log(`[Square Webhook] Updated refund on payment ${refund.payment_id}`);
        }
        break;
      }

      default:
        console.log("[Square Webhook] Unhandled event type:", eventType);
    }
  } catch (err) {
    console.error("[Square Webhook] Error processing event:", eventType, err);
    // Still return 200 so Square doesn't retry indefinitely
  }

  return NextResponse.json({ received: true });
}
