import { buildAgingReport, getTenantInvoices, getTenantPayments, } from "./queries";
import { listInvoices as listInvoicesData } from "@data/invoices";
import { listPayments as listPaymentsData } from "@data/payments";
import { listSubscriptions as listSubscriptionsData } from "@data/subscriptions";
import { computeTenantAging } from "./balance";
function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function computeTotals(invoices, payments) {
    var _a, _b;
    const now = new Date();
    const monthStart = startOfMonth(now);
    let totalInvoicedCents = 0;
    let totalOutstandingCents = 0;
    let totalPaidCents = 0;
    let overdueCount = 0;
    let overdueAmountCents = 0;
    for (const invoice of invoices) {
        const amount = (_a = invoice.amount_cents) !== null && _a !== void 0 ? _a : 0;
        const paid = (_b = invoice.amount_paid) !== null && _b !== void 0 ? _b : 0;
        totalInvoicedCents += amount;
        totalPaidCents += paid;
        totalOutstandingCents += invoice.outstanding_cents;
        if (invoice.is_overdue) {
            overdueCount += 1;
            overdueAmountCents += invoice.outstanding_cents;
        }
    }
    let monthToDateRevenueCents = 0;
    for (const payment of payments) {
        const refDate = payment.reporting_date
            ? new Date(payment.reporting_date)
            : null;
        if (refDate && refDate.getTime() >= monthStart.getTime()) {
            monthToDateRevenueCents += payment.net_cents;
        }
    }
    const invoiceCount = invoices.length;
    const averageInvoiceCents = invoiceCount > 0 ? Math.round(totalInvoicedCents / invoiceCount) : 0;
    const denominator = totalPaidCents + totalOutstandingCents;
    const collectionRatePct = denominator > 0 ? Math.round((totalPaidCents / denominator) * 100) : 100;
    return {
        invoiceCount,
        paymentCount: payments.length,
        totalInvoicedCents,
        totalOutstandingCents,
        totalPaidCents,
        overdueCount,
        overdueAmountCents,
        monthToDateRevenueCents,
        averageInvoiceCents,
        collectionRatePct,
    };
}
export async function getBillingDashboard(tenantId) {
    const [invoices, payments] = await Promise.all([
        getTenantInvoices(tenantId),
        getTenantPayments(tenantId),
    ]);
    const aging = buildAgingReport(invoices);
    const totals = computeTotals(invoices, payments);
    return {
        tenantId,
        invoices,
        payments,
        aging,
        totals,
        generatedAt: new Date().toISOString(),
    };
}
export async function getBillingOverview(tenantId) {
    var _a, _b, _c;
    const [invoices, payments, subs, aging] = await Promise.all([
        listInvoicesData(tenantId, undefined, { limit: 1000 }),
        listPaymentsData(tenantId, undefined, { limit: 1000 }),
        listSubscriptionsData(tenantId, undefined, { limit: 500 }),
        computeTenantAging(tenantId),
    ]);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const in30 = now.getTime() + 30 * 24 * 60 * 60 * 1000;
    let outstanding = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let openCount = 0;
    for (const inv of invoices) {
        if (inv.status === "void" || inv.status === "paid")
            continue;
        outstanding += (_a = inv.balance_cents) !== null && _a !== void 0 ? _a : 0;
        openCount += 1;
        if (inv.due_at && new Date(inv.due_at).getTime() < now.getTime()) {
            overdueCount += 1;
            overdueAmount += (_b = inv.balance_cents) !== null && _b !== void 0 ? _b : 0;
        }
    }
    let paidMTD = 0;
    for (const p of payments) {
        if (p.status !== "succeeded")
            continue;
        const ts = p.paid_at ? new Date(p.paid_at).getTime() : 0;
        if (ts >= monthStart) {
            paidMTD += Math.max(0, p.amount_cents - ((_c = p.refunded_cents) !== null && _c !== void 0 ? _c : 0));
        }
    }
    const active = subs.filter((s) => s.status === "active");
    const renewals30 = active.filter((s) => {
        if (!s.next_invoice_at)
            return false;
        const t = new Date(s.next_invoice_at).getTime();
        return t >= now.getTime() && t <= in30;
    }).length;
    return {
        tenantId,
        generatedAt: new Date().toISOString(),
        totals: {
            outstandingCents: outstanding,
            paidMTDCents: paidMTD,
            overdueCount,
            overdueAmountCents: overdueAmount,
            openInvoiceCount: openCount,
            activeSubscriptions: active.length,
            renewalsNext30: renewals30,
        },
        aging,
    };
}
