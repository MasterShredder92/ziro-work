import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatNumber } from "./shared";
export function KPIBlock({ kpi }) {
    const value = formatValue(kpi.value, kpi.format);
    const trend = kpi.deltaPct;
    const isPositive = kpi.direction === "higher_is_better"
        ? (trend !== null && trend !== void 0 ? trend : 0) > 0
        : kpi.direction === "lower_is_better"
            ? (trend !== null && trend !== void 0 ? trend : 0) < 0
            : true;
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: kpi.label }), _jsxs("div", { className: "mt-1 flex items-baseline gap-2", children: [_jsx("div", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: value }), trend !== null && trend !== undefined ? (_jsxs("div", { className: `text-xs font-medium ${isPositive ? "text-emerald-400" : "text-rose-400"}`, children: [trend > 0 ? "+" : "", trend, "%"] })) : null] }), kpi.sublabel ? (_jsx("div", { className: "mt-1 text-[11px] text-[var(--z-muted)]", children: kpi.sublabel })) : null] }));
}
function formatValue(value, format) {
    switch (format) {
        case "currency":
            return `$${formatNumber(value / 100)}`;
        case "percent":
            return `${value}%`;
        case "text":
            return String(value);
        case "number":
        default:
            return formatNumber(value);
    }
}
