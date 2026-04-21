/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
/**
 * Manual Square sync — pulls invoices, payments, and customers from Square API
 * and upserts into Supabase.
 *
 * POST /api/integrations/square/sync
 *
 * This route uses maxDuration = 300 (Vercel Pro) and returns a streaming
 * Server-Sent Events response so the browser gets live progress updates
 * without timing out.
 */
// Vercel Pro allows up to 300 seconds for serverless functions
export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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
async function squareFetch(path, accessToken) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch(`https://connect.squareup.com${path}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Square-Version": "2024-01-17",
                "Content-Type": "application/json",
            },
            signal: controller.signal,
        });
        let body;
        try {
            body = await res.json();
        }
        catch (_a) {
            body = {};
        }
        return { ok: res.ok, status: res.status, body };
    }
    catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.name) === "AbortError") {
            return { ok: false, status: 408, body: { errors: [{ detail: "Request timed out after 15s" }] } };
        }
        throw err;
    }
    finally {
        clearTimeout(timer);
    }
}
export async function POST(req) {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    if (!accessToken) {
        return NextResponse.json({ error: "Square access token not configured. Add SQUARE_ACCESS_TOKEN to environment variables." }, { status: 503 });
    }
    // Default: pull current month + next month so projected invoices are always captured
    const now = new Date();
    const defaultSince = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    let sinceDate = defaultSince;
    try {
        const body = await req.json().catch(() => ({}));
        if (body.all === true) {
            sinceDate = "2020-01-01"; // full backfill
        }
        else if (body.since && /^\d{4}-\d{2}-\d{2}$/.test(body.since)) {
            sinceDate = body.since;
        }
    }
    catch ( /* no body */_a) { /* no body */ }
    // End date: last day of next month (so we capture scheduled/projected invoices)
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const endDate = `${nextMonthEnd.getFullYear()}-${String(nextMonthEnd.getMonth() + 1).padStart(2, "0")}-${String(nextMonthEnd.getDate()).padStart(2, "0")}`;
    const tenantId = DEFAULT_TENANT_ID;
    const db = getServiceClient();
    // ── Use Server-Sent Events so the browser gets live progress ──────────────
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
            function send(data) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            }
            const errors = [];
            const stats = {
                locations: 0,
                invoicesFetched: 0,
                invoicesUpserted: 0,
                invoicesLinked: 0,
                paymentsFetched: 0,
                paymentsUpserted: 0,
                customersFetched: 0,
                customersLinked: 0,
            };
            try {
                send({ status: "running", message: "Fetching Square locations…" });
                // ── Step 1: Fetch all Square locations ──────────────────────────────
                const locRes = await squareFetch("/v2/locations", accessToken);
                if (!locRes.ok) {
                    send({ status: "error", error: `Square locations fetch failed (${locRes.status})` });
                    controller.close();
                    return;
                }
                const locations = (_b = (_a = locRes.body) === null || _a === void 0 ? void 0 : _a.locations) !== null && _b !== void 0 ? _b : [];
                if (locations.length === 0) {
                    send({ status: "error", error: "No Square locations found for this account." });
                    controller.close();
                    return;
                }
                stats.locations = locations.length;
                send({ status: "running", message: `Found ${locations.length} location(s). Syncing invoices and payments…` });
                // ── Step 2: Build customer → family lookup from DB (no Square API call) ─
                const { data: familyRows } = await db
                    .from("families")
                    .select("id, square_customer_id")
                    .eq("tenant_id", tenantId)
                    .not("square_customer_id", "is", null);
                const customerToFamily = {};
                for (const f of (familyRows !== null && familyRows !== void 0 ? familyRows : [])) {
                    if (f.square_customer_id)
                        customerToFamily[f.square_customer_id] = f.id;
                }
                const { data: studentRows } = await db
                    .from("students")
                    .select("id, square_customer_id, family_id")
                    .eq("tenant_id", tenantId)
                    .not("square_customer_id", "is", null);
                const customerToStudentFamily = {};
                for (const s of (studentRows !== null && studentRows !== void 0 ? studentRows : [])) {
                    if (s.square_customer_id && s.family_id) {
                        customerToStudentFamily[s.square_customer_id] = s.family_id;
                    }
                }
                send({
                    status: "running",
                    message: `Syncing invoices across ${locations.length} location(s)…`,
                    stats: Object.assign({}, stats),
                });
                // ── Step 4: Fetch invoices per location ──────────────────────────────
                for (const loc of locations) {
                    let cursor;
                    do {
                        const params = new URLSearchParams({ location_id: loc.id, limit: "200" });
                        if (cursor)
                            params.set("cursor", cursor);
                        // Filter by date range: current month start through end of next month
                        params.set("filter.date_range.start_date", sinceDate);
                        params.set("filter.date_range.end_date", endDate);
                        const invRes = await squareFetch(`/v2/invoices?${params.toString()}`, accessToken);
                        if (!invRes.ok) {
                            errors.push(`Location ${loc.id}: ${(_f = (_e = (_d = (_c = invRes.body) === null || _c === void 0 ? void 0 : _c.errors) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.detail) !== null && _f !== void 0 ? _f : invRes.status}`);
                            break;
                        }
                        const invoices = (_h = (_g = invRes.body) === null || _g === void 0 ? void 0 : _g.invoices) !== null && _h !== void 0 ? _h : [];
                        cursor = (_j = invRes.body) === null || _j === void 0 ? void 0 : _j.cursor;
                        stats.invoicesFetched += invoices.length;
                        if (invoices.length === 0)
                            break;
                        const rows = invoices.map((inv) => {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
                            const primaryRecipient = (_a = inv.primary_recipient) !== null && _a !== void 0 ? _a : {};
                            const paymentRequests = (_b = inv.payment_requests) !== null && _b !== void 0 ? _b : [];
                            const firstPayment = (_c = paymentRequests[0]) !== null && _c !== void 0 ? _c : {};
                            const computedAmountMoney = (_d = firstPayment.computed_amount_money) !== null && _d !== void 0 ? _d : null;
                            const totalCompletedAmountMoney = (_e = firstPayment.total_completed_amount_money) !== null && _e !== void 0 ? _e : null;
                            const dueDate = (_f = firstPayment.due_date) !== null && _f !== void 0 ? _f : null;
                            const sqCustId = (_g = primaryRecipient.customer_id) !== null && _g !== void 0 ? _g : null;
                            const familyId = sqCustId
                                ? ((_j = (_h = customerToFamily[sqCustId]) !== null && _h !== void 0 ? _h : customerToStudentFamily[sqCustId]) !== null && _j !== void 0 ? _j : null)
                                : null;
                            if (familyId)
                                stats.invoicesLinked++;
                            const row = {
                                tenant_id: tenantId,
                                square_invoice_id: inv.id,
                                square_location_id: (_k = inv.location_id) !== null && _k !== void 0 ? _k : loc.id,
                                location_id: null, // Square location IDs are not UUIDs — kept in square_location_id
                                square_customer_id: sqCustId,
                                family_id: familyId,
                                invoice_number: (_l = inv.invoice_number) !== null && _l !== void 0 ? _l : null,
                                title: (_m = inv.title) !== null && _m !== void 0 ? _m : null,
                                status: normalizeStatus(inv.status),
                                customer_name: [primaryRecipient.given_name, primaryRecipient.family_name]
                                    .filter(Boolean).join(" ") || null,
                                customer_email: (_o = primaryRecipient.email_address) !== null && _o !== void 0 ? _o : null,
                                amount_cents: toCents(computedAmountMoney),
                                requested_amount: toCents(computedAmountMoney),
                                amount_paid_cents: toCents(totalCompletedAmountMoney),
                                due_date: dueDate,
                                invoice_date: toDate(inv.created_at),
                                square_created_at: (_p = inv.created_at) !== null && _p !== void 0 ? _p : null,
                                paid_at: null,
                                raw_json: inv,
                                synced_at: new Date().toISOString(),
                            };
                            if (((_q = inv.status) === null || _q === void 0 ? void 0 : _q.toUpperCase()) === "PAID") {
                                // Try payment_requests[].completed_at first
                                for (const pr of paymentRequests) {
                                    if (pr.completed_at) {
                                        row.paid_at = toDate(pr.completed_at);
                                        break;
                                    }
                                }
                                // Fallback: use invoice updated_at (Square updates it when paid)
                                if (!row.paid_at && inv.updated_at) {
                                    row.paid_at = toDate(inv.updated_at);
                                }
                            }
                            return row;
                        });
                        for (let i = 0; i < rows.length; i += 50) {
                            const batch = rows.slice(i, i + 50);
                            const { error } = await db
                                .from("square_invoices_fact")
                                .upsert(batch, { onConflict: "square_invoice_id" });
                            if (error) {
                                errors.push(error.message);
                            }
                            else {
                                stats.invoicesUpserted += batch.length;
                            }
                        }
                        // Send progress update every batch
                        send({
                            status: "running",
                            message: `Invoices: ${stats.invoicesUpserted} synced so far…`,
                            stats: Object.assign({}, stats),
                        });
                    } while (cursor);
                }
                send({
                    status: "running",
                    message: `Invoices done (${stats.invoicesUpserted}). Syncing payments…`,
                    stats: Object.assign({}, stats),
                });
                // ── Step 5: Fetch payments per location ──────────────────────────────
                for (const loc of locations) {
                    let cursor;
                    do {
                        const params = new URLSearchParams({ location_id: loc.id, limit: "100", sort_order: "ASC" });
                        if (sinceDate) {
                            params.set("begin_time", `${sinceDate}T00:00:00Z`);
                        }
                        if (cursor)
                            params.set("cursor", cursor);
                        const payRes = await squareFetch(`/v2/payments?${params.toString()}`, accessToken);
                        if (!payRes.ok) {
                            errors.push(`Payments for location ${loc.id}: ${(_o = (_m = (_l = (_k = payRes.body) === null || _k === void 0 ? void 0 : _k.errors) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.detail) !== null && _o !== void 0 ? _o : payRes.status}`);
                            break;
                        }
                        const payments = (_q = (_p = payRes.body) === null || _p === void 0 ? void 0 : _p.payments) !== null && _q !== void 0 ? _q : [];
                        cursor = (_r = payRes.body) === null || _r === void 0 ? void 0 : _r.cursor;
                        stats.paymentsFetched += payments.length;
                        if (payments.length === 0)
                            break;
                        const rows = payments.map((pay) => {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
                            const amtMoney = (_a = pay.amount_money) !== null && _a !== void 0 ? _a : {};
                            const totalMoney = (_b = pay.total_money) !== null && _b !== void 0 ? _b : {};
                            const netMoney = (_c = pay.net_amount_money) !== null && _c !== void 0 ? _c : {};
                            const refundedMoney = (_d = pay.refunded_money) !== null && _d !== void 0 ? _d : {};
                            const tipMoney = (_e = pay.tip_money) !== null && _e !== void 0 ? _e : {};
                            const appFeeMoney = (_f = pay.app_fee_money) !== null && _f !== void 0 ? _f : {};
                            const processingFees = (_g = pay.processing_fee) !== null && _g !== void 0 ? _g : [];
                            const processingFeeTotal = processingFees.reduce((sum, fee) => { var _a, _b; return sum + ((_b = (_a = fee.amount_money) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : 0); }, 0);
                            const reportingDate = (_h = toDate(pay.created_at)) !== null && _h !== void 0 ? _h : new Date().toISOString().split("T")[0];
                            const sourceType = (_j = pay.source_type) !== null && _j !== void 0 ? _j : (pay.card_details ? "CARD" : pay.cash_details ? "CASH" : "OTHER");
                            const tenderBucket = sourceType === "CARD" ? "card" : sourceType === "CASH" ? "cash" : "other";
                            return {
                                tenant_id: tenantId,
                                square_payment_id: pay.id,
                                square_location_id: (_k = pay.location_id) !== null && _k !== void 0 ? _k : loc.id,
                                location_id: null, // Square location IDs are not UUIDs — kept in square_location_id
                                status: (_l = pay.status) !== null && _l !== void 0 ? _l : "UNKNOWN",
                                reporting_date: reportingDate,
                                amount_money_cents: (_m = amtMoney.amount) !== null && _m !== void 0 ? _m : null,
                                total_money_cents: (_o = totalMoney.amount) !== null && _o !== void 0 ? _o : null,
                                net_total_cents: (_p = netMoney.amount) !== null && _p !== void 0 ? _p : null,
                                refunded_money_cents: (_q = refundedMoney.amount) !== null && _q !== void 0 ? _q : null,
                                tip_money_cents: (_r = tipMoney.amount) !== null && _r !== void 0 ? _r : null,
                                application_fee_money_cents: (_s = appFeeMoney.amount) !== null && _s !== void 0 ? _s : null,
                                processing_fee_total_cents: processingFeeTotal,
                                source_type: sourceType,
                                tender_bucket: tenderBucket,
                                created_at_square: (_t = pay.created_at) !== null && _t !== void 0 ? _t : null,
                                updated_at_square: (_u = pay.updated_at) !== null && _u !== void 0 ? _u : null,
                                team_member_id: (_v = pay.team_member_id) !== null && _v !== void 0 ? _v : null,
                                raw_json: pay,
                                synced_at: new Date().toISOString(),
                            };
                        });
                        for (let i = 0; i < rows.length; i += 50) {
                            const batch = rows.slice(i, i + 50);
                            const { error } = await db
                                .from("square_payments_fact")
                                .upsert(batch, { onConflict: "square_payment_id" });
                            if (error) {
                                errors.push(`Payments upsert: ${error.message}`);
                            }
                            else {
                                stats.paymentsUpserted += batch.length;
                            }
                        }
                        // Send progress every batch
                        if (stats.paymentsFetched % 500 === 0 || !cursor) {
                            send({
                                status: "running",
                                message: `Payments: ${stats.paymentsUpserted} synced so far…`,
                                stats: Object.assign({}, stats),
                            });
                        }
                    } while (cursor);
                }
                console.log("[Square Sync] Complete:", stats);
                const finalMessage = [
                    `Sync from ${sinceDate} complete.`,
                    `${stats.invoicesUpserted} invoices synced (${stats.invoicesLinked} linked to families).`,
                    `${stats.paymentsUpserted} payments synced.`,
                    stats.customersLinked > 0 ? `${stats.customersLinked} new customers linked.` : "",
                    errors.length > 0 ? `${errors.length} non-fatal error(s).` : "",
                ].filter(Boolean).join(" ");
                send({
                    status: "success",
                    message: finalMessage,
                    stats,
                    errors: errors.length > 0 ? errors : undefined,
                });
            }
            catch (err) {
                console.error("[Square Sync] Unexpected error:", err);
                send({ status: "error", error: (_s = err === null || err === void 0 ? void 0 : err.message) !== null && _s !== void 0 ? _s : "Unexpected error during sync" });
            }
            finally {
                controller.close();
            }
        },
    });
    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
