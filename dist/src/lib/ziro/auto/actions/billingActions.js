import { listSquareInvoices } from "@data/squareInvoices";
const REMINDER_GRACE_DAYS = 1;
const LATE_FEE_THRESHOLD_DAYS = 14;
const LATE_FEE_RATE = 0.05;
function isOverdue(invoice, now) {
    var _a;
    const status = ((_a = invoice.status) !== null && _a !== void 0 ? _a : "").toUpperCase();
    if (status === "PAID" || status === "CANCELED" || status === "CANCELLED") {
        return false;
    }
    if (!invoice.due_date)
        return false;
    const due = new Date(invoice.due_date).getTime();
    if (!Number.isFinite(due))
        return false;
    return due < now.getTime();
}
function daysBetween(olderIso, now) {
    if (!olderIso)
        return null;
    const t = new Date(olderIso).getTime();
    if (!Number.isFinite(t))
        return null;
    const diff = now.getTime() - t;
    if (diff < 0)
        return 0;
    return Math.floor(diff / (24 * 60 * 60 * 1000));
}
function invoiceDisplayName(invoice) {
    if (invoice.title && invoice.title.trim().length > 0)
        return invoice.title.trim();
    if (invoice.invoice_number && invoice.invoice_number.trim().length > 0) {
        return invoice.invoice_number.trim();
    }
    return invoice.square_invoice_id;
}
async function loadOverdueInvoices(tenantId, now) {
    const invoices = await listSquareInvoices(tenantId, {}, { limit: 500, ascending: false });
    return invoices.filter((invoice) => isOverdue(invoice, now));
}
export const detectOverdueInvoices = {
    key: "detectOverdueInvoices",
    description: "Flag unpaid invoices past their due date.",
    async handler(ctx) {
        const overdue = await loadOverdueInvoices(ctx.tenantId, ctx.now);
        const entries = overdue.map((invoice) => {
            var _a, _b, _c, _d;
            return ({
                invoiceId: invoice.id,
                squareInvoiceId: invoice.square_invoice_id,
                title: invoiceDisplayName(invoice),
                status: invoice.status,
                amountCents: (_a = invoice.amount_cents) !== null && _a !== void 0 ? _a : null,
                amountPaid: (_b = invoice.amount_paid) !== null && _b !== void 0 ? _b : null,
                dueDate: invoice.due_date,
                customerName: (_c = invoice.customer_name) !== null && _c !== void 0 ? _c : null,
                customerEmail: (_d = invoice.customer_email) !== null && _d !== void 0 ? _d : null,
                daysOverdue: daysBetween(invoice.due_date, ctx.now),
            });
        });
        return {
            triggered: entries.length > 0,
            details: {
                count: entries.length,
                invoices: entries,
            },
        };
    },
};
export const autoSendInvoiceReminders = {
    key: "autoSendInvoiceReminders",
    description: "Assemble reminder payloads for overdue invoices.",
    async handler(ctx) {
        const overdue = await loadOverdueInvoices(ctx.tenantId, ctx.now);
        const reminders = overdue
            .filter((invoice) => {
            const days = daysBetween(invoice.due_date, ctx.now);
            return typeof days === "number" && days >= REMINDER_GRACE_DAYS;
        })
            .map((invoice) => {
            var _a, _b, _c;
            return ({
                invoiceId: invoice.id,
                squareInvoiceId: invoice.square_invoice_id,
                title: invoiceDisplayName(invoice),
                customerName: (_a = invoice.customer_name) !== null && _a !== void 0 ? _a : null,
                customerEmail: (_b = invoice.customer_email) !== null && _b !== void 0 ? _b : null,
                amountCents: (_c = invoice.amount_cents) !== null && _c !== void 0 ? _c : null,
                dueDate: invoice.due_date,
                daysOverdue: daysBetween(invoice.due_date, ctx.now),
                channel: invoice.customer_email ? "email" : "manual",
            });
        });
        return {
            triggered: reminders.length > 0,
            details: {
                mode: "metadata",
                count: reminders.length,
                reminders,
            },
        };
    },
};
export const autoApplyLateFees = {
    key: "autoApplyLateFees",
    description: "Compute late fee recommendations without writing to the database.",
    async handler(ctx) {
        const overdue = await loadOverdueInvoices(ctx.tenantId, ctx.now);
        const fees = overdue
            .map((invoice) => {
            var _a;
            const days = daysBetween(invoice.due_date, ctx.now);
            if (typeof days !== "number" || days < LATE_FEE_THRESHOLD_DAYS) {
                return null;
            }
            const amountCents = (_a = invoice.amount_cents) !== null && _a !== void 0 ? _a : 0;
            const feeCents = Math.round(amountCents * LATE_FEE_RATE);
            return {
                invoiceId: invoice.id,
                squareInvoiceId: invoice.square_invoice_id,
                title: invoiceDisplayName(invoice),
                amountCents,
                proposedFeeCents: feeCents,
                daysOverdue: days,
                rate: LATE_FEE_RATE,
            };
        })
            .filter((entry) => entry !== null);
        return {
            triggered: fees.length > 0,
            details: {
                mode: "metadata",
                threshold: LATE_FEE_THRESHOLD_DAYS,
                rate: LATE_FEE_RATE,
                count: fees.length,
                fees,
            },
        };
    },
};
export const billingAutoActions = {
    key: "billing",
    description: "Billing and invoice automations.",
    actions: [detectOverdueInvoices, autoSendInvoiceReminders, autoApplyLateFees],
};
