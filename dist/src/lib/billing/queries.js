import { listSquareInvoices, listSquarePayments } from "@data/squareInvoices";
const DAY_MS = 1000 * 60 * 60 * 24;
function diffDays(fromIso, to) {
    if (!fromIso)
        return 0;
    const from = new Date(fromIso).getTime();
    if (!Number.isFinite(from))
        return 0;
    return Math.floor((to.getTime() - from) / DAY_MS);
}
function outstandingCents(invoice) {
    var _a, _b;
    const amount = (_a = invoice.amount_cents) !== null && _a !== void 0 ? _a : 0;
    const paid = (_b = invoice.amount_paid) !== null && _b !== void 0 ? _b : 0;
    return Math.max(0, amount - paid);
}
function toInvoiceRow(invoice, now) {
    const outstanding = outstandingCents(invoice);
    const daysOverdue = outstanding > 0 && invoice.due_date ? diffDays(invoice.due_date, now) : 0;
    return Object.assign(Object.assign({}, invoice), { outstanding_cents: outstanding, is_overdue: outstanding > 0 && daysOverdue > 0, days_overdue: Math.max(0, daysOverdue) });
}
function toPaymentRow(payment) {
    var _a, _b, _c;
    const net = (_c = (_b = (_a = payment.net_total_cents) !== null && _a !== void 0 ? _a : payment.total_money_cents) !== null && _b !== void 0 ? _b : payment.amount_money_cents) !== null && _c !== void 0 ? _c : 0;
    return Object.assign(Object.assign({}, payment), { net_cents: net });
}
export async function getTenantInvoices(tenantId) {
    const invoices = await listSquareInvoices(tenantId, undefined, {
        limit: 500,
        orderBy: "invoice_date",
        ascending: false,
    });
    const now = new Date();
    return invoices.map((invoice) => toInvoiceRow(invoice, now));
}
export async function getTenantPayments(tenantId) {
    const payments = await listSquarePayments(tenantId, {
        limit: 500,
        orderBy: "reporting_date",
        ascending: false,
    });
    return payments.map(toPaymentRow);
}
const BUCKET_SPECS = [
    { id: "current", label: "Current", minDays: -Infinity, maxDays: 0 },
    { id: "0-30", label: "1 – 30 days", minDays: 1, maxDays: 30 },
    { id: "31-60", label: "31 – 60 days", minDays: 31, maxDays: 60 },
    { id: "61-90", label: "61 – 90 days", minDays: 61, maxDays: 90 },
    { id: "90+", label: "90+ days", minDays: 91, maxDays: null },
];
function bucketFor(daysOverdue) {
    for (const spec of BUCKET_SPECS) {
        const min = spec.minDays;
        const max = spec.maxDays;
        if (daysOverdue >= min && (max === null || daysOverdue <= max)) {
            return spec;
        }
    }
    return BUCKET_SPECS[0];
}
export function buildAgingReport(invoices) {
    const buckets = new Map();
    for (const spec of BUCKET_SPECS) {
        buckets.set(spec.id, {
            id: spec.id,
            label: spec.label,
            minDays: Number.isFinite(spec.minDays) ? spec.minDays : 0,
            maxDays: spec.maxDays,
            invoiceCount: 0,
            outstandingCents: 0,
        });
    }
    for (const invoice of invoices) {
        if (invoice.outstanding_cents <= 0)
            continue;
        const spec = bucketFor(invoice.days_overdue);
        const bucket = buckets.get(spec.id);
        if (!bucket)
            continue;
        bucket.invoiceCount += 1;
        bucket.outstandingCents += invoice.outstanding_cents;
    }
    return BUCKET_SPECS.map((spec) => buckets.get(spec.id));
}
export async function getAgingReport(tenantId) {
    const invoices = await getTenantInvoices(tenantId);
    return buildAgingReport(invoices);
}
