import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
function formatCents(cents) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format((cents !== null && cents !== void 0 ? cents : 0) / 100);
}
export function BillingSummary({ billing }) {
    const collectionRate = billing.totalOutstandingCents + billing.totalPaidCents > 0
        ? Math.round((billing.totalPaidCents /
            (billing.totalOutstandingCents + billing.totalPaidCents)) *
            100)
        : 100;
    const rows = [
        {
            label: "Month-to-date revenue",
            value: formatCents(billing.monthToDateRevenueCents),
            tone: "success",
        },
        {
            label: "Outstanding",
            value: formatCents(billing.totalOutstandingCents),
            tone: billing.totalOutstandingCents > 0 ? "warning" : undefined,
        },
        {
            label: "Overdue",
            value: `${billing.overdueCount} · ${formatCents(billing.overdueAmountCents)}`,
            tone: billing.overdueCount > 0 ? "danger" : undefined,
        },
        {
            label: "Paid (lifetime)",
            value: formatCents(billing.totalPaidCents),
        },
        {
            label: "Average invoice",
            value: formatCents(billing.averageInvoiceCents),
        },
        {
            label: "Collection rate",
            value: `${collectionRate}%`,
            tone: collectionRate >= 90
                ? "success"
                : collectionRate >= 70
                    ? "warning"
                    : "danger",
        },
    ];
    const toneClass = {
        success: "text-emerald-400",
        warning: "text-amber-400",
        danger: "text-red-400",
    };
    return (_jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Billing summary" }), _jsx("div", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Revenue & collections" })] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [billing.invoices.length, " invoices \u00B7 ", billing.payments.length, " payments"] })] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: rows.map((row) => (_jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_1.5%)] p-3", children: [_jsx("div", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: row.label }), _jsx("div", { className: `mt-1 text-xl font-semibold tabular-nums ${row.tone ? toneClass[row.tone] : "text-[var(--z-fg)]"}`, children: row.value })] }, row.label))) })] }));
}
