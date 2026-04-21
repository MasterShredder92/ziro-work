import { clientFor } from "@data/_client";
import { listSquareInvoices, listSquarePayments, listSquareRefunds, } from "@data/squareInvoices";
import { validateInvoiceInput } from "./validators";
function requireTenant(input) {
    if (!input.tenantId || input.tenantId.trim().length === 0) {
        throw new Error("tenantId is required");
    }
    return input.tenantId;
}
function internalInvoiceId(conversationId) {
    const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `INT-${conversationId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}
export const createInvoiceTool = {
    name: "createInvoice",
    description: "Create an invoice record. Validates customer linkage and amount. Defaults to an internal invoice number when Square id is not supplied.",
    handler: async (input) => {
        var _a, _b, _c, _d, _e, _f;
        const tenantId = requireTenant(input);
        const { args, errors } = validateInvoiceInput((_a = input.args) !== null && _a !== void 0 ? _a : input.raw);
        if (errors.length > 0) {
            return {
                result: { ok: false, errors },
                metadata: { validation_failed: true },
            };
        }
        const rawObj = typeof input.args === "object" && input.args !== null
            ? input.args
            : safeParse(input.raw);
        const squareInvoiceId = (_b = pickString(rawObj, [
            "square_invoice_id",
            "squareInvoiceId",
            "external_id",
        ])) !== null && _b !== void 0 ? _b : internalInvoiceId((_c = input.conversationId) !== null && _c !== void 0 ? _c : "x");
        const customerName = pickString(rawObj, ["customer_name", "name"]);
        const customerEmail = pickString(rawObj, ["customer_email", "email"]);
        const locationId = pickString(rawObj, ["location_id", "locationId"]);
        const supabase = clientFor(tenantId);
        const { data, error } = await supabase
            .from("square_invoices")
            .insert({
            tenant_id: tenantId,
            square_invoice_id: squareInvoiceId,
            family_id: args.family_id,
            amount_cents: args.amount_cents,
            requested_amount: args.amount_cents,
            due_date: args.due_date,
            title: args.description,
            invoice_number: (_d = args.invoice_number) !== null && _d !== void 0 ? _d : squareInvoiceId,
            square_customer_id: args.customer_id,
            customer_name: customerName,
            customer_email: customerEmail,
            location_id: locationId,
            status: "draft",
            raw_data: args.metadata,
        })
            .select("*")
            .single();
        if (error) {
            return {
                result: { ok: false, errors: [error.message] },
                metadata: { db_error: true, code: (_e = error.code) !== null && _e !== void 0 ? _e : null },
            };
        }
        return {
            result: { ok: true, invoice: data },
            metadata: {
                entity: "square_invoice",
                action: "create",
                invoice_id: (_f = data === null || data === void 0 ? void 0 : data.id) !== null && _f !== void 0 ? _f : null,
                square_invoice_id: squareInvoiceId,
            },
        };
    },
};
export const recordPaymentTool = {
    name: "recordPayment",
    description: "Record a payment against Square payment facts. Requires amount, reporting_date, and either a Square payment id or idempotency hint.",
    handler: async (input) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const tenantId = requireTenant(input);
        const rawObj = typeof input.args === "object" && input.args !== null
            ? input.args
            : safeParse(input.raw);
        const errors = [];
        const amountRaw = (_b = (_a = rawObj.amount) !== null && _a !== void 0 ? _a : rawObj.amount_cents) !== null && _b !== void 0 ? _b : rawObj.total;
        let amountCents = null;
        if (typeof amountRaw === "number")
            amountCents = Math.round(amountRaw * 100);
        else if (typeof amountRaw === "string") {
            const parsed = Number.parseFloat(amountRaw.replace(/[^\d.\-]/g, ""));
            if (Number.isFinite(parsed))
                amountCents = Math.round(parsed * 100);
        }
        const reportingDate = (_c = pickString(rawObj, ["reporting_date", "date"])) !== null && _c !== void 0 ? _c : new Date().toISOString().slice(0, 10);
        const squarePaymentId = (_d = pickString(rawObj, ["square_payment_id", "payment_id", "external_id"])) !== null && _d !== void 0 ? _d : `INT-PMT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const status = ((_e = pickString(rawObj, ["status"])) !== null && _e !== void 0 ? _e : "completed").toLowerCase();
        const tender = ((_f = pickString(rawObj, ["tender_bucket", "tender"])) !== null && _f !== void 0 ? _f : "other").toLowerCase();
        const locationId = pickString(rawObj, ["location_id", "locationId"]);
        if (amountCents === null)
            errors.push("amount is required and must be numeric");
        else if (amountCents <= 0)
            errors.push("amount must be greater than zero");
        if (errors.length > 0) {
            return {
                result: { ok: false, errors },
                metadata: { validation_failed: true },
            };
        }
        const supabase = clientFor(tenantId);
        const { data, error } = await supabase
            .from("square_payments_fact")
            .insert({
            tenant_id: tenantId,
            square_payment_id: squarePaymentId,
            reporting_date: reportingDate,
            status,
            tender_bucket: tender,
            amount_money_cents: amountCents,
            total_money_cents: amountCents,
            net_total_cents: amountCents,
            location_id: locationId,
            raw_json: rawObj,
        })
            .select("*")
            .single();
        if (error) {
            return {
                result: { ok: false, errors: [error.message] },
                metadata: { db_error: true, code: (_g = error.code) !== null && _g !== void 0 ? _g : null },
            };
        }
        return {
            result: { ok: true, payment: data },
            metadata: {
                entity: "square_payment",
                action: "record",
                payment_id: (_h = data === null || data === void 0 ? void 0 : data.id) !== null && _h !== void 0 ? _h : null,
                square_payment_id: squarePaymentId,
            },
        };
    },
};
export const reconcileSquareTool = {
    name: "reconcileSquare",
    description: "Reconcile invoices, payments, and refunds for a tenant. Returns totals and a list of invoices that still have outstanding balances.",
    handler: async (input) => {
        const tenantId = requireTenant(input);
        const rawObj = typeof input.args === "object" && input.args !== null
            ? input.args
            : safeParse(input.raw);
        const limit = typeof rawObj.limit === "number"
            ? rawObj.limit
            : typeof rawObj.limit === "string"
                ? Number.parseInt(rawObj.limit, 10)
                : 200;
        const [invoices, payments, refunds] = await Promise.all([
            listSquareInvoices(tenantId, undefined, { limit }),
            listSquarePayments(tenantId, { limit }),
            listSquareRefunds(tenantId, { limit }),
        ]);
        const totalInvoiced = invoices.reduce((sum, i) => { var _a; return sum + ((_a = i.amount_cents) !== null && _a !== void 0 ? _a : 0); }, 0);
        const totalPaid = payments.reduce((sum, p) => { var _a, _b; return sum + ((_b = (_a = p.net_total_cents) !== null && _a !== void 0 ? _a : p.amount_money_cents) !== null && _b !== void 0 ? _b : 0); }, 0);
        const totalRefunded = refunds.reduce((sum, r) => { var _a; return sum + ((_a = r.amount_money_cents) !== null && _a !== void 0 ? _a : 0); }, 0);
        const outstanding = invoices
            .filter((i) => {
            var _a, _b;
            const amount = (_a = i.amount_cents) !== null && _a !== void 0 ? _a : 0;
            const paid = (_b = i.amount_paid) !== null && _b !== void 0 ? _b : 0;
            return amount > paid;
        })
            .map((i) => {
            var _a, _b, _c, _d;
            return ({
                id: i.id,
                square_invoice_id: i.square_invoice_id,
                family_id: i.family_id,
                amount_cents: (_a = i.amount_cents) !== null && _a !== void 0 ? _a : 0,
                amount_paid: (_b = i.amount_paid) !== null && _b !== void 0 ? _b : 0,
                balance_cents: ((_c = i.amount_cents) !== null && _c !== void 0 ? _c : 0) - ((_d = i.amount_paid) !== null && _d !== void 0 ? _d : 0),
                due_date: i.due_date,
                status: i.status,
            });
        });
        return {
            result: {
                ok: true,
                totals: {
                    invoiced_cents: totalInvoiced,
                    paid_cents: totalPaid,
                    refunded_cents: totalRefunded,
                    net_cents: totalPaid - totalRefunded,
                    outstanding_count: outstanding.length,
                },
                outstanding,
                counts: {
                    invoices: invoices.length,
                    payments: payments.length,
                    refunds: refunds.length,
                },
            },
            metadata: {
                entity: "square",
                action: "reconcile",
                outstanding_count: outstanding.length,
            },
        };
    },
};
function pickString(obj, keys) {
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === "string" && v.trim().length > 0)
            return v.trim();
    }
    return null;
}
function safeParse(raw) {
    try {
        const p = JSON.parse(raw);
        if (p && typeof p === "object" && !Array.isArray(p))
            return p;
    }
    catch (_a) {
        // ignore
    }
    return {};
}
