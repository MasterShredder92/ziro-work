/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServiceClient } from "@/lib/supabase";
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
function verifySquareSignature(body, signature, signingKey, notificationUrl) {
    if (!signature || !signingKey)
        return false;
    const hmac = crypto.createHmac("sha256", signingKey);
    hmac.update(notificationUrl + body);
    const expected = hmac.digest("base64");
    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    }
    catch (_a) {
        return false;
    }
}
function normalizeStatus(squareStatus) {
    switch ((squareStatus !== null && squareStatus !== void 0 ? squareStatus : "").toUpperCase()) {
        case "PAID": return "PAID";
        case "PARTIALLY_PAID": return "PARTIALLY_PAID";
        case "PAYMENT_PENDING": return "UNPAID";
        case "UNPAID": return "UNPAID";
        case "SCHEDULED": return "SCHEDULED";
        case "DRAFT": return "DRAFT";
        case "CANCELED":
        case "CANCELLED": return "CANCELLED";
        default: return squareStatus !== null && squareStatus !== void 0 ? squareStatus : "UNKNOWN";
    }
}
function toCents(money) {
    if (!money || money.amount == null)
        return null;
    return money.amount;
}
function toDate(dt) {
    if (!dt)
        return null;
    return dt.split("T")[0];
}
async function resolveFamilyId(db, tenantId, squareCustomerId) {
    var _a;
    if (!squareCustomerId)
        return null;
    const { data } = await db
        .from("families")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("square_customer_id", squareCustomerId)
        .limit(1);
    if ((data === null || data === void 0 ? void 0 : data.length) > 0)
        return data[0].id;
    // Also check students
    const { data: stuData } = await db
        .from("students")
        .select("family_id")
        .eq("tenant_id", tenantId)
        .eq("square_customer_id", squareCustomerId)
        .limit(1);
    if ((stuData === null || stuData === void 0 ? void 0 : stuData.length) > 0)
        return (_a = stuData[0].family_id) !== null && _a !== void 0 ? _a : null;
    return null;
}
async function handleInvoiceEvent(db, tenantId, eventType, invoiceData) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const inv = (_b = (_a = invoiceData === null || invoiceData === void 0 ? void 0 : invoiceData.object) === null || _a === void 0 ? void 0 : _a.invoice) !== null && _b !== void 0 ? _b : invoiceData;
    if (!(inv === null || inv === void 0 ? void 0 : inv.id))
        return;
    const primaryRecipient = (_c = inv.primary_recipient) !== null && _c !== void 0 ? _c : {};
    const paymentRequests = (_d = inv.payment_requests) !== null && _d !== void 0 ? _d : [];
    const firstPayment = (_e = paymentRequests[0]) !== null && _e !== void 0 ? _e : {};
    const computedAmountMoney = (_f = firstPayment.computed_amount_money) !== null && _f !== void 0 ? _f : null;
    const totalCompletedAmountMoney = (_g = firstPayment.total_completed_amount_money) !== null && _g !== void 0 ? _g : null;
    const dueDate = (_h = firstPayment.due_date) !== null && _h !== void 0 ? _h : null;
    const sqCustId = (_j = primaryRecipient.customer_id) !== null && _j !== void 0 ? _j : null;
    const familyId = await resolveFamilyId(db, tenantId, sqCustId);
    if (eventType === "invoice.deleted") {
        await db.from("square_invoices").delete().eq("square_invoice_id", inv.id).eq("tenant_id", tenantId);
        console.log(`[Square Webhook] Deleted invoice ${inv.id}`);
        return;
    }
    const row = {
        tenant_id: tenantId,
        square_invoice_id: inv.id,
        square_location_id: (_k = inv.location_id) !== null && _k !== void 0 ? _k : null,
        location_id: (_l = inv.location_id) !== null && _l !== void 0 ? _l : null,
        square_customer_id: sqCustId,
        family_id: familyId,
        invoice_number: (_m = inv.invoice_number) !== null && _m !== void 0 ? _m : null,
        title: (_o = inv.title) !== null && _o !== void 0 ? _o : null,
        status: normalizeStatus(inv.status),
        customer_name: [primaryRecipient.given_name, primaryRecipient.family_name].filter(Boolean).join(" ") || null,
        customer_email: (_p = primaryRecipient.email_address) !== null && _p !== void 0 ? _p : null,
        amount_cents: toCents(computedAmountMoney),
        requested_amount: toCents(computedAmountMoney),
        amount_paid: toCents(totalCompletedAmountMoney),
        due_date: dueDate,
        invoice_date: toDate(inv.created_at),
        square_created_at: (_q = inv.created_at) !== null && _q !== void 0 ? _q : null,
        paid_at: null,
        raw_data: inv,
        synced_at: new Date().toISOString(),
    };
    // Set paid_at for PAID invoices
    if (((_r = inv.status) === null || _r === void 0 ? void 0 : _r.toUpperCase()) === "PAID") {
        for (const pr of paymentRequests) {
            if (pr.completed_at) {
                row.paid_at = toDate(pr.completed_at);
                break;
            }
        }
    }
    await db.from("square_invoices").upsert(row, { onConflict: "square_invoice_id" });
    console.log(`[Square Webhook] Upserted invoice ${inv.id} (${row.status}) family=${familyId !== null && familyId !== void 0 ? familyId : "unlinked"}`);
}
async function handlePaymentEvent(db, tenantId, paymentData) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
    const pay = (_b = (_a = paymentData === null || paymentData === void 0 ? void 0 : paymentData.object) === null || _a === void 0 ? void 0 : _a.payment) !== null && _b !== void 0 ? _b : paymentData;
    if (!(pay === null || pay === void 0 ? void 0 : pay.id))
        return;
    const amtMoney = (_c = pay.amount_money) !== null && _c !== void 0 ? _c : {};
    const totalMoney = (_d = pay.total_money) !== null && _d !== void 0 ? _d : {};
    const netMoney = (_e = pay.net_amount_money) !== null && _e !== void 0 ? _e : {};
    const refundedMoney = (_f = pay.refunded_money) !== null && _f !== void 0 ? _f : {};
    const tipMoney = (_g = pay.tip_money) !== null && _g !== void 0 ? _g : {};
    const appFeeMoney = (_h = pay.app_fee_money) !== null && _h !== void 0 ? _h : {};
    const processingFees = (_j = pay.processing_fee) !== null && _j !== void 0 ? _j : [];
    const processingFeeTotal = processingFees.reduce((sum, fee) => { var _a, _b; return sum + ((_b = (_a = fee.amount_money) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : 0); }, 0);
    const reportingDate = (_k = toDate(pay.created_at)) !== null && _k !== void 0 ? _k : new Date().toISOString().split("T")[0];
    const sourceType = (_l = pay.source_type) !== null && _l !== void 0 ? _l : (pay.card_details ? "CARD" : pay.cash_details ? "CASH" : "OTHER");
    const tenderBucket = sourceType === "CARD" ? "card" : sourceType === "CASH" ? "cash" : "other";
    const row = {
        tenant_id: tenantId,
        square_payment_id: pay.id,
        square_location_id: (_m = pay.location_id) !== null && _m !== void 0 ? _m : null,
        location_id: (_o = pay.location_id) !== null && _o !== void 0 ? _o : null,
        status: (_p = pay.status) !== null && _p !== void 0 ? _p : "UNKNOWN",
        reporting_date: reportingDate,
        amount_money_cents: (_q = amtMoney.amount) !== null && _q !== void 0 ? _q : null,
        total_money_cents: (_r = totalMoney.amount) !== null && _r !== void 0 ? _r : null,
        net_total_cents: (_s = netMoney.amount) !== null && _s !== void 0 ? _s : null,
        refunded_money_cents: (_t = refundedMoney.amount) !== null && _t !== void 0 ? _t : null,
        tip_money_cents: (_u = tipMoney.amount) !== null && _u !== void 0 ? _u : null,
        application_fee_money_cents: (_v = appFeeMoney.amount) !== null && _v !== void 0 ? _v : null,
        processing_fee_total_cents: processingFeeTotal,
        source_type: sourceType,
        tender_bucket: tenderBucket,
        created_at_square: (_w = pay.created_at) !== null && _w !== void 0 ? _w : null,
        updated_at_square: (_x = pay.updated_at) !== null && _x !== void 0 ? _x : null,
        raw_json: pay,
        synced_at: new Date().toISOString(),
    };
    await db.from("square_payments_fact").upsert(row, { onConflict: "square_payment_id" });
    console.log(`[Square Webhook] Upserted payment ${pay.id} (${row.status}) $${((_y = row.total_money_cents) !== null && _y !== void 0 ? _y : 0) / 100}`);
}
async function handleCustomerEvent(db, tenantId, eventType, customerData) {
    var _a, _b, _c;
    const cust = (_b = (_a = customerData === null || customerData === void 0 ? void 0 : customerData.object) === null || _a === void 0 ? void 0 : _a.customer) !== null && _b !== void 0 ? _b : customerData;
    if (!(cust === null || cust === void 0 ? void 0 : cust.id))
        return;
    const email = (_c = cust.email_address) !== null && _c !== void 0 ? _c : null;
    const squareCustId = cust.id;
    if (eventType === "customer.deleted") {
        // Don't delete from our system, just log
        console.log(`[Square Webhook] Customer deleted: ${squareCustId}`);
        return;
    }
    if (!email)
        return;
    // Try to link to a family by email
    const { data: families } = await db
        .from("families")
        .select("id, square_customer_id")
        .eq("tenant_id", tenantId)
        .ilike("primary_email", email)
        .limit(1);
    if ((families === null || families === void 0 ? void 0 : families.length) > 0 && !families[0].square_customer_id) {
        await db.from("families")
            .update({ square_customer_id: squareCustId, updated_at: new Date().toISOString() })
            .eq("id", families[0].id).eq("tenant_id", tenantId);
        console.log(`[Square Webhook] Linked customer ${squareCustId} to family ${families[0].id}`);
        return;
    }
    // Try to link to a student by email
    const { data: students } = await db
        .from("students")
        .select("id, family_id, square_customer_id")
        .eq("tenant_id", tenantId)
        .ilike("email", email)
        .limit(1);
    if ((students === null || students === void 0 ? void 0 : students.length) > 0 && !students[0].square_customer_id) {
        await db.from("students")
            .update({ square_customer_id: squareCustId, updated_at: new Date().toISOString() })
            .eq("id", students[0].id).eq("tenant_id", tenantId);
        console.log(`[Square Webhook] Linked customer ${squareCustId} to student ${students[0].id}`);
    }
}
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f;
    const rawBody = await req.text();
    const signature = req.headers.get("x-square-hmacsha256-signature");
    const signingKey = (_a = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) !== null && _a !== void 0 ? _a : "";
    const notificationUrl = `${(_b = process.env.NEXT_PUBLIC_APP_URL) !== null && _b !== void 0 ? _b : "https://ziro-work.vercel.app"}/api/integrations/square/webhook`;
    // Verify signature if key is configured
    if (signingKey) {
        const valid = verifySquareSignature(rawBody, signature, signingKey, notificationUrl);
        if (!valid) {
            console.warn("[Square Webhook] Invalid signature — rejecting");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
    }
    let event;
    try {
        event = JSON.parse(rawBody);
    }
    catch (_g) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const eventType = event.type;
    const eventData = event.data;
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
            // ── Customer events — keep family/student links current ─────────────
            case "customer.created":
            case "customer.updated":
            case "customer.deleted":
                await handleCustomerEvent(db, tenantId, eventType, eventData);
                break;
            // ── Refund events ────────────────────────────────────────────────────
            case "refund.created":
            case "refund.updated": {
                // Update the related payment's refunded_money_cents
                const refund = (_d = (_c = eventData === null || eventData === void 0 ? void 0 : eventData.object) === null || _c === void 0 ? void 0 : _c.refund) !== null && _d !== void 0 ? _d : eventData;
                if (refund === null || refund === void 0 ? void 0 : refund.payment_id) {
                    const refundedCents = (_f = (_e = refund.amount_money) === null || _e === void 0 ? void 0 : _e.amount) !== null && _f !== void 0 ? _f : 0;
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
    }
    catch (err) {
        console.error("[Square Webhook] Error processing event:", eventType, err);
        // Still return 200 so Square doesn't retry indefinitely
    }
    return NextResponse.json({ received: true });
}
