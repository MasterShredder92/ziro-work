import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { redirect } from "next/navigation";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { getBillingDashboard, getBillingOverview, } from "@/lib/billing/service";
import { listSubscriptions } from "@/lib/billing/subscriptionEngine";
import { Card } from "@/components/ui/Card";
import { AgingReport, InvoiceTable, PaymentTable, PlanSelector, SubscriptionOverview, UsageBreakdown, } from "./components";
import { formatCents, formatDate } from "./components/format";
import { getUsageBreakdown, listPlans, listTenantSubscriptions, } from "@/lib/billing/billingOps";
export const dynamic = "force-dynamic";
async function resolveSession() {
    try {
        return await requirePermission("billing.read")();
    }
    catch (_a) {
        redirect("/dashboard");
    }
}
export default async function BillingPage() {
    var _a, _b;
    const session = await resolveSession();
    await assertTenantAccess(session.tenantId);
    const [data, overview, subscriptions] = await Promise.all([
        getBillingDashboard(session.tenantId),
        getBillingOverview(session.tenantId),
        listSubscriptions(session.tenantId, { status: "active" }, { limit: 50 }),
    ]);
    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
        .toISOString();
    const periodEnd = now.toISOString();
    const [plans, osSubscriptions, usage] = await Promise.all([
        listPlans(session.tenantId),
        listTenantSubscriptions(session.tenantId),
        getUsageBreakdown(session.tenantId, { start: periodStart, end: periodEnd }),
    ]);
    const { totals, invoices, payments, aging } = data;
    const upcomingRenewals = subscriptions
        .filter((s) => s.next_invoice_at)
        .sort((a, b) => { var _a, _b; return ((_a = a.next_invoice_at) !== null && _a !== void 0 ? _a : "") > ((_b = b.next_invoice_at) !== null && _b !== void 0 ? _b : "") ? 1 : -1; })
        .slice(0, 5);
    void overview;
    const kpis = [
        {
            label: "Month-to-date revenue",
            value: formatCents(totals.monthToDateRevenueCents),
            tone: "success",
        },
        {
            label: "Outstanding",
            value: formatCents(totals.totalOutstandingCents),
            tone: totals.totalOutstandingCents > 0 ? "warning" : undefined,
        },
        {
            label: "Overdue",
            value: `${totals.overdueCount} · ${formatCents(totals.overdueAmountCents)}`,
            tone: totals.overdueCount > 0 ? "danger" : undefined,
        },
        {
            label: "Paid (lifetime)",
            value: formatCents(totals.totalPaidCents),
        },
        {
            label: "Average invoice",
            value: formatCents(totals.averageInvoiceCents),
        },
        {
            label: "Collection rate",
            value: `${totals.collectionRatePct}%`,
            tone: totals.collectionRatePct >= 90
                ? "success"
                : totals.collectionRatePct >= 70
                    ? "warning"
                    : "danger",
        },
    ];
    const toneClass = {
        success: "text-emerald-400",
        warning: "text-amber-400",
        danger: "text-red-400",
    };
    return (_jsxs(_Fragment, { children: [_jsxs("section", { id: "overview", className: "scroll-mt-24 space-y-3", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "Billing Overview" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Unified revenue, invoices, and receivables across your tenant." })] }), _jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Billing summary" }), _jsx("div", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Revenue & collections" })] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [totals.invoiceCount, " invoices \u00B7 ", totals.paymentCount, " payments"] })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: kpis.map((row) => (_jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_1.5%)] p-3", children: [_jsx("div", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: row.label }), _jsx("div", { className: `mt-1 text-xl font-semibold tabular-nums ${row.tone ? toneClass[row.tone] : "text-[var(--z-fg)]"}`, children: row.value })] }, row.label))) })] })] }), _jsx("section", { id: "aging", className: "scroll-mt-24", children: _jsx(AgingReport, { buckets: aging }) }), _jsx("section", { id: "plans", className: "scroll-mt-24", children: _jsx(PlanSelector, { plans: plans, activePlanId: (_b = (_a = osSubscriptions[0]) === null || _a === void 0 ? void 0 : _a.planId) !== null && _b !== void 0 ? _b : null }) }), _jsx("section", { id: "subscriptions", className: "scroll-mt-24", children: _jsx(SubscriptionOverview, { subscriptions: osSubscriptions }) }), _jsx("section", { id: "usage", className: "scroll-mt-24", children: _jsx(UsageBreakdown, { usage: usage, period: { start: periodStart.slice(0, 10), end: periodEnd.slice(0, 10) } }) }), _jsxs("section", { id: "invoices", className: "scroll-mt-24 space-y-3", children: [_jsxs("header", { children: [_jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Invoices" }), _jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "Most recent first. Outstanding balances highlighted." })] }), _jsx(InvoiceTable, { invoices: invoices })] }), _jsxs("section", { id: "payments", className: "scroll-mt-24 space-y-3", children: [_jsxs("header", { children: [_jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Payments" }), _jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "Settlement activity synced from Square." })] }), _jsx(PaymentTable, { payments: payments })] }), _jsxs("section", { id: "renewals", className: "scroll-mt-24 space-y-3", children: [_jsxs("header", { children: [_jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Upcoming renewals" }), _jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "Next five active subscriptions to be invoiced." })] }), _jsx("div", { className: "overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: upcomingRenewals.length === 0 ? (_jsx("div", { className: "px-4 py-6 text-sm text-[var(--z-muted)]", children: "No active subscriptions." })) : (upcomingRenewals.map((s) => (_jsxs("div", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3 last:border-b-0", children: [_jsxs("div", { children: [_jsxs("div", { className: "text-sm font-medium text-[var(--z-fg)]", children: ["Subscription ", s.id.slice(0, 8)] }), _jsxs("div", { className: "text-[11px] text-[var(--z-muted)]", children: [s.billing_plan_id ? `Plan ${s.billing_plan_id.slice(0, 8)}` : "No plan", s.price_override_cents
                                                    ? ` · ${formatCents(s.price_override_cents)}`
                                                    : ""] })] }), _jsx("div", { className: "text-sm text-[var(--z-muted)]", children: formatDate(s.next_invoice_at) })] }, s.id)))) })] }), _jsxs("div", { className: "text-[11px] text-[var(--z-muted)] pt-2", children: ["Generated at ", _jsx("span", { suppressHydrationWarning: true, children: new Date(data.generatedAt).toLocaleString() })] })] }));
}
