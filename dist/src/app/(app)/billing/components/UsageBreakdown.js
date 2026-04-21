import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function displayValue(metric, total) {
    if (metric === "storage") {
        const mb = total / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    }
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(total);
}
export function UsageBreakdown({ usage, period }) {
    return (_jsxs("section", { className: "space-y-3", children: [_jsxs("header", { children: [_jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Usage metering" }), _jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: ["Metered activity from ", period.start, " to ", period.end, "."] })] }), _jsx("div", { className: "overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: usage.length === 0 ? (_jsx("div", { className: "px-4 py-6 text-sm text-[var(--z-muted)]", children: "No usage recorded for this period." })) : (usage.map((row) => (_jsxs("div", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3 last:border-b-0", children: [_jsx("div", { className: "text-sm font-medium text-[var(--z-fg)]", children: row.metric }), _jsx("div", { className: "text-sm tabular-nums text-[var(--z-muted)]", children: displayValue(row.metric, row.total) })] }, row.metric)))) })] }));
}
