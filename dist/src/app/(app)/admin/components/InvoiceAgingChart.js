import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function formatMoney(cents, currency = "USD") {
    const dollars = cents / 100;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(dollars);
}
const bucketColor = [
    "#22c55e",
    "#eab308",
    "#f97316",
    "#ef4444",
    "#b91c1c",
];
export function InvoiceAgingChart({ buckets, currency = "USD", }) {
    const max = buckets.reduce((m, b) => (b.totalAmountCents > m ? b.totalAmountCents : m), 0);
    const total = buckets.reduce((sum, b) => sum + b.totalAmountCents, 0);
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Invoice aging" }), _jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "Outstanding receivables by bucket" })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "Total outstanding" }), _jsx("div", { className: "text-lg font-bold text-[var(--z-fg)]", children: formatMoney(total, currency) })] })] }), _jsx("div", { className: "mt-5 space-y-3", children: buckets.map((b, i) => {
                    const pct = max > 0 ? (b.totalAmountCents / max) * 100 : 0;
                    const color = bucketColor[i % bucketColor.length];
                    return (_jsxs("div", { children: [_jsxs("div", { className: "mb-1 flex items-center justify-between text-xs", children: [_jsxs("span", { className: "font-medium text-[var(--z-fg)]", children: [b.label, " ", _jsxs("span", { className: "text-[var(--z-muted)]", children: ["(", b.count, " inv)"] })] }), _jsx("span", { className: "font-semibold text-[var(--z-fg)]", children: formatMoney(b.totalAmountCents, currency) })] }), _jsx("div", { className: "h-2 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--z-surface),white_4%)]", children: _jsx("div", { className: "h-full rounded-full transition-all", style: {
                                        width: `${pct}%`,
                                        backgroundColor: color,
                                    } }) })] }, b.label));
                }) })] }));
}
