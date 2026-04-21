import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const accentColor = {
    default: "var(--z-accent)",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
};
const trendColor = {
    up: "#22c55e",
    down: "#ef4444",
    flat: "var(--z-muted)",
};
const trendArrow = {
    up: "▲",
    down: "▼",
    flat: "—",
};
export function KpiCard({ label, value, sublabel, trend, icon, accent = "default", }) {
    return (_jsxs("div", { className: "relative rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 transition-colors hover:border-[var(--z-border-2)]", style: { borderTopColor: accentColor[accent], borderTopWidth: 2 }, children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: "mt-2 truncate text-2xl font-bold text-[var(--z-fg)] sm:text-3xl", children: value }), sublabel ? (_jsx("div", { className: "mt-1 text-xs text-[var(--z-muted)]", children: sublabel })) : null] }), icon ? (_jsx("div", { className: "shrink-0 text-[var(--z-muted)]", children: icon })) : null] }), trend ? (_jsxs("div", { className: "mt-3 inline-flex items-center gap-1 text-xs font-semibold", style: { color: trendColor[trend.direction] }, children: [_jsx("span", { children: trendArrow[trend.direction] }), _jsx("span", { children: trend.value })] })) : null] }));
}
