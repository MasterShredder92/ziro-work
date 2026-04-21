var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import "server-only";
import { createInvoice as dataCreateInvoice, deleteInvoice as dataDeleteInvoice, getInvoiceById, listInvoices as dataListInvoices, updateInvoice, } from "@data/invoices";
import { createLineItemsBulk, deleteLineItemsForInvoice, listLineItems, } from "@data/invoiceLineItems";
import { getBillingSettings, incrementInvoiceSequence, } from "@data/billingSettings";
import { listPayments } from "@data/payments";
import { listCredits } from "@data/credits";
const DAY_MS = 1000 * 60 * 60 * 24;
export async function listInvoices(tenantId, filter, opts) {
    return dataListInvoices(tenantId, filter, opts);
}
export async function getInvoice(tenantId, id) {
    const invoice = await getInvoiceById(id, tenantId);
    if (!invoice)
        return null;
    const [lineItems, payments, credits] = await Promise.all([
        listLineItems(tenantId, id),
        listPayments(tenantId, { invoice_id: id }),
        listCredits(tenantId, undefined, { limit: 100 }).then((rows) => rows.filter((row) => row.invoice_id === id)),
    ]);
    return Object.assign(Object.assign({}, invoice), { lineItems, payments, credits });
}
function padNumber(n, width) {
    const s = `${n}`;
    return s.length >= width ? s : "0".repeat(width - s.length) + s;
}
async function nextInvoiceNumber(tenantId) {
    var _a, _b;
    const settings = await incrementInvoiceSequence(tenantId);
    const prefix = (_a = settings.invoice_prefix) !== null && _a !== void 0 ? _a : "INV-";
    const padWidth = (_b = settings.invoice_pad_width) !== null && _b !== void 0 ? _b : 4;
    const n = settings.invoice_next_number - 1;
    return `${prefix}${padNumber(n, padWidth)}`;
}
export async function createInvoice(tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const settings = await getBillingSettings(tenantId);
    const defaultNet = (_a = settings === null || settings === void 0 ? void 0 : settings.default_net_days) !== null && _a !== void 0 ? _a : 15;
    const taxRateBp = (_b = settings === null || settings === void 0 ? void 0 : settings.default_tax_rate_bp) !== null && _b !== void 0 ? _b : 0;
    const lineItems = (_c = input.lineItems) !== null && _c !== void 0 ? _c : [];
    const subtotal = lineItems.reduce((sum, item) => {
        var _a, _b, _c;
        const qty = (_a = item.quantity) !== null && _a !== void 0 ? _a : 1;
        const unit = (_b = item.unit_amount_cents) !== null && _b !== void 0 ? _b : 0;
        const amount = (_c = item.amount_cents) !== null && _c !== void 0 ? _c : Math.round(qty * unit);
        return sum + amount;
    }, 0);
    const taxableTotal = lineItems.reduce((sum, item) => {
        var _a, _b, _c;
        if (!item.taxable)
            return sum;
        const qty = (_a = item.quantity) !== null && _a !== void 0 ? _a : 1;
        const unit = (_b = item.unit_amount_cents) !== null && _b !== void 0 ? _b : 0;
        const amount = (_c = item.amount_cents) !== null && _c !== void 0 ? _c : Math.round(qty * unit);
        return sum + amount;
    }, 0);
    const taxCents = Math.round((taxableTotal * taxRateBp) / 10000);
    const discountCents = (_d = input.discount_cents) !== null && _d !== void 0 ? _d : 0;
    const totalCents = Math.max(0, subtotal + taxCents - discountCents);
    const now = new Date();
    const due = (_e = input.due_at) !== null && _e !== void 0 ? _e : new Date(now.getTime() + defaultNet * DAY_MS).toISOString();
    const number = (_f = input.number) !== null && _f !== void 0 ? _f : (input.autoNumber === false ? null : await nextInvoiceNumber(tenantId));
    const { lineItems: _omit, autoNumber: _auto } = input, invoiceInsert = __rest(input, ["lineItems", "autoNumber"]);
    void _omit;
    void _auto;
    const invoice = await dataCreateInvoice(tenantId, Object.assign({ currency: (_g = settings === null || settings === void 0 ? void 0 : settings.default_currency) !== null && _g !== void 0 ? _g : "USD", terms: (_h = settings === null || settings === void 0 ? void 0 : settings.default_terms) !== null && _h !== void 0 ? _h : null, status: "draft", issued_at: now.toISOString(), due_at: due, subtotal_cents: subtotal, tax_cents: taxCents, discount_cents: discountCents, total_cents: totalCents, amount_cents: totalCents, amount_paid_cents: 0, balance_cents: totalCents, number }, invoiceInsert));
    const items = lineItems.length
        ? await createLineItemsBulk(tenantId, lineItems.map((item, idx) => {
            var _a;
            return (Object.assign(Object.assign({}, item), { invoice_id: invoice.id, sort_order: (_a = item.sort_order) !== null && _a !== void 0 ? _a : idx }));
        }))
        : [];
    return Object.assign(Object.assign({}, invoice), { lineItems: items, payments: [], credits: [] });
}
export async function updateInvoiceStatus(tenantId, id, status) {
    const patch = { status };
    if (status === "paid")
        patch.paid_at = new Date().toISOString();
    if (status === "sent")
        patch.sent_at = new Date().toISOString();
    return updateInvoice(id, tenantId, patch);
}
export async function voidInvoice(tenantId, id, reason) {
    return updateInvoice(id, tenantId, {
        status: "void",
        voided_at: new Date().toISOString(),
        void_reason: reason !== null && reason !== void 0 ? reason : null,
    });
}
export async function patchInvoice(tenantId, id, patch) {
    return updateInvoice(id, tenantId, patch);
}
export async function deleteInvoice(tenantId, id) {
    await deleteLineItemsForInvoice(id, tenantId);
    await dataDeleteInvoice(id, tenantId);
}
export async function recomputeInvoiceTotals(tenantId, invoiceId) {
    var _a, _b;
    const [invoice, items, payments] = await Promise.all([
        getInvoiceById(invoiceId, tenantId),
        listLineItems(tenantId, invoiceId),
        listPayments(tenantId, { invoice_id: invoiceId }),
    ]);
    if (!invoice)
        throw new Error("Invoice not found");
    const subtotal = items.reduce((s, i) => { var _a; return s + ((_a = i.amount_cents) !== null && _a !== void 0 ? _a : 0); }, 0);
    const taxable = items
        .filter((i) => i.taxable)
        .reduce((s, i) => { var _a; return s + ((_a = i.amount_cents) !== null && _a !== void 0 ? _a : 0); }, 0);
    const settings = await getBillingSettings(tenantId);
    const taxRateBp = (_a = settings === null || settings === void 0 ? void 0 : settings.default_tax_rate_bp) !== null && _a !== void 0 ? _a : 0;
    const tax = Math.round((taxable * taxRateBp) / 10000);
    const discount = (_b = invoice.discount_cents) !== null && _b !== void 0 ? _b : 0;
    const total = Math.max(0, subtotal + tax - discount);
    const paid = payments
        .filter((p) => p.status === "succeeded")
        .reduce((s, p) => { var _a; return s + Math.max(0, p.amount_cents - ((_a = p.refunded_cents) !== null && _a !== void 0 ? _a : 0)); }, 0);
    const balance = Math.max(0, total - paid);
    const status = invoice.status === "void"
        ? "void"
        : balance === 0
            ? "paid"
            : paid > 0
                ? "partial"
                : invoice.status || "open";
    return updateInvoice(invoiceId, tenantId, {
        subtotal_cents: subtotal,
        tax_cents: tax,
        total_cents: total,
        amount_cents: total,
        amount_paid_cents: paid,
        balance_cents: balance,
        status,
        paid_at: balance === 0 ? new Date().toISOString() : null,
    });
}
