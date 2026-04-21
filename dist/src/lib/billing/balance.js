import "server-only";
import { listInvoices } from "@data/invoices";
import { listPayments } from "@data/payments";
import { listCredits } from "@data/credits";
const DAY_MS = 1000 * 60 * 60 * 24;
export async function computeFamilyBalance(tenantId, familyId) {
    const [invoices, payments, credits] = await Promise.all([
        listInvoices(tenantId, { family_id: familyId }, { limit: 500 }),
        listPayments(tenantId, { family_id: familyId }, { limit: 500 }),
        listCredits(tenantId, { family_id: familyId, status: "active" }, {
            limit: 200,
        }),
    ]);
    const outstandingCents = invoices
        .filter((i) => i.status !== "void" && i.status !== "paid")
        .reduce((s, i) => { var _a; return s + ((_a = i.balance_cents) !== null && _a !== void 0 ? _a : 0); }, 0);
    const paidCents = payments
        .filter((p) => p.status === "succeeded")
        .reduce((s, p) => { var _a; return s + Math.max(0, p.amount_cents - ((_a = p.refunded_cents) !== null && _a !== void 0 ? _a : 0)); }, 0);
    const creditBalanceCents = credits.reduce((s, c) => { var _a; return s + Math.max(0, c.amount_cents - ((_a = c.applied_cents) !== null && _a !== void 0 ? _a : 0)); }, 0);
    const now = Date.now();
    const overdueInvoices = invoices.filter((i) => i.status !== "void" &&
        i.status !== "paid" &&
        i.due_at &&
        new Date(i.due_at).getTime() < now).length;
    const openInvoices = invoices.filter((i) => i.status !== "void" && i.status !== "paid").length;
    return {
        familyId,
        tenantId,
        outstandingCents,
        paidCents,
        creditBalanceCents,
        openInvoices,
        overdueInvoices,
    };
}
const AGING_SPECS = [
    { id: "current", label: "Current", minDays: -Infinity, maxDays: 0 },
    { id: "0-30", label: "1 – 30 days", minDays: 1, maxDays: 30 },
    { id: "31-60", label: "31 – 60 days", minDays: 31, maxDays: 60 },
    { id: "61-90", label: "61 – 90 days", minDays: 61, maxDays: 90 },
    { id: "90+", label: "90+ days", minDays: 91, maxDays: null },
];
export async function computeTenantAging(tenantId) {
    var _a, _b;
    const invoices = await listInvoices(tenantId, undefined, { limit: 1000 });
    const now = Date.now();
    const buckets = new Map();
    for (const spec of AGING_SPECS) {
        buckets.set(spec.id, {
            id: spec.id,
            label: spec.label,
            minDays: Number.isFinite(spec.minDays) ? spec.minDays : 0,
            maxDays: spec.maxDays,
            invoiceCount: 0,
            outstandingCents: 0,
        });
    }
    for (const inv of invoices) {
        if (inv.status === "void" || inv.status === "paid")
            continue;
        const outstanding = (_a = inv.balance_cents) !== null && _a !== void 0 ? _a : 0;
        if (outstanding <= 0)
            continue;
        const due = inv.due_at ? new Date(inv.due_at).getTime() : now;
        const days = Math.floor((now - due) / DAY_MS);
        const spec = (_b = AGING_SPECS.find((s) => days >= s.minDays && (s.maxDays === null || days <= s.maxDays))) !== null && _b !== void 0 ? _b : AGING_SPECS[0];
        const bucket = buckets.get(spec.id);
        bucket.invoiceCount += 1;
        bucket.outstandingCents += outstanding;
    }
    return AGING_SPECS.map((s) => buckets.get(s.id));
}
