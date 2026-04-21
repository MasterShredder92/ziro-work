import { hasKeyword, parseTokens } from "./parse";
function baseMeta(args, extra = {}) {
    return Object.assign({ tenantId: args.tenantId, profileId: args.profileId, conversationId: args.conversationId }, extra);
}
const generateInvoice = {
    title: "Generate Invoice",
    description: "Create an invoice from a natural-language request.",
    async handler(args) {
        const tokens = parseTokens(args.input);
        const ready = !!tokens.amount && (!!tokens.id || !!tokens.name || !!tokens.email);
        const today = new Date();
        const due = new Date(today);
        due.setDate(due.getDate() + 14);
        return {
            result: {
                action: "generate_invoice",
                status: ready ? "ready" : "needs_info",
                invoice: {
                    tenantId: args.tenantId,
                    familyId: tokens.id,
                    customerName: tokens.name,
                    customerEmail: tokens.email,
                    amount: tokens.amount,
                    amountRaw: tokens.amountRaw,
                    currency: "USD",
                    issuedAt: today.toISOString().slice(0, 10),
                    dueAt: due.toISOString().slice(0, 10),
                    createdBy: args.profileId,
                    memo: tokens.raw,
                },
            },
            metadata: baseMeta(args, { tokens }),
        };
    },
};
const listOutstanding = {
    title: "List Outstanding Invoices",
    description: "List invoices that are open, overdue, or partially paid.",
    async handler(args) {
        var _a;
        const tokens = parseTokens(args.input);
        return {
            result: {
                action: "list_outstanding_invoices",
                filters: {
                    tenantId: args.tenantId,
                    familyId: tokens.id,
                    statuses: ["open", "overdue", "partial"],
                    minAmount: (_a = tokens.amount) !== null && _a !== void 0 ? _a : 0,
                },
                ordering: [
                    { field: "due_at", direction: "asc" },
                    { field: "amount", direction: "desc" },
                ],
            },
            metadata: baseMeta(args, { tokens }),
        };
    },
};
const recordPayment = {
    title: "Record Payment",
    description: "Attach a payment to an invoice or family account.",
    async handler(args) {
        var _a;
        const tokens = parseTokens(args.input);
        const method = hasKeyword(tokens.raw, ["square"]) ? "square"
            : hasKeyword(tokens.raw, ["card"]) ? "card"
                : hasKeyword(tokens.raw, ["cash"]) ? "cash"
                    : hasKeyword(tokens.raw, ["check", "cheque"]) ? "check"
                        : hasKeyword(tokens.raw, ["ach", "transfer"]) ? "ach"
                            : "unspecified";
        const ready = !!tokens.amount;
        return {
            result: {
                action: "record_payment",
                status: ready ? "ready" : "needs_amount",
                payment: {
                    tenantId: args.tenantId,
                    invoiceId: tokens.id,
                    amount: tokens.amount,
                    currency: "USD",
                    method,
                    occurredAt: (_a = tokens.date) !== null && _a !== void 0 ? _a : new Date().toISOString().slice(0, 10),
                    recordedBy: args.profileId,
                },
            },
            metadata: baseMeta(args, { tokens }),
        };
    },
};
const invoiceAgingReport = {
    title: "Invoice Aging Report",
    description: "Bucket outstanding invoices by age for collections review.",
    async handler(args) {
        const tokens = parseTokens(args.input);
        return {
            result: {
                action: "invoice_aging_report",
                scope: { tenantId: args.tenantId, familyId: tokens.id },
                buckets: [
                    { label: "current", fromDays: 0, toDays: 0 },
                    { label: "1_30", fromDays: 1, toDays: 30 },
                    { label: "31_60", fromDays: 31, toDays: 60 },
                    { label: "61_90", fromDays: 61, toDays: 90 },
                    { label: "90_plus", fromDays: 91, toDays: null },
                ],
                metrics: ["count", "sum_amount", "sum_remaining"],
            },
            metadata: baseMeta(args, { tokens }),
        };
    },
};
const reconcileSquare = {
    title: "Reconcile Square",
    description: "Match Square settlement items to internal invoices and flag variances.",
    async handler(args) {
        const tokens = parseTokens(args.input);
        return {
            result: {
                action: "reconcile_square",
                window: {
                    tenantId: args.tenantId,
                    startDate: tokens.date,
                    days: 30,
                },
                strategy: [
                    { step: "fetch_settlements", provider: "square" },
                    { step: "match_by_reference", field: "reference_id" },
                    { step: "match_by_amount_date", tolerancePct: 0.5 },
                    { step: "flag_unmatched" },
                ],
                outputs: ["matched", "unmatched_in_square", "unmatched_in_ledger", "variances"],
            },
            metadata: baseMeta(args, { tokens }),
        };
    },
};
export const bub = {
    generateInvoice,
    listOutstanding,
    recordPayment,
    invoiceAgingReport,
    reconcileSquare,
};
export default bub;
