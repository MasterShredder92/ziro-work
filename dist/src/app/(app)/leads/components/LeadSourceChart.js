import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/components/ui/utils/cn";
export function LeadSourceChart({ stats, maxRows = 10 }) {
    const rows = stats.bySource.slice(0, maxRows);
    const maxTotal = rows.reduce((acc, r) => Math.max(acc, r.total), 1);
    return (_jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-4", children: [_jsxs("header", { className: "flex items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Lead sources" }), _jsx("h3", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Channel performance" })] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [stats.total.toLocaleString(), " leads total"] })] }), rows.length === 0 ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface-2)] px-4 py-6 text-center text-sm text-[var(--z-muted)]", children: "No source data yet." })) : (_jsx("ul", { className: "space-y-2", children: rows.map((row) => {
                    const pct = Math.round((row.total / maxTotal) * 100);
                    return (_jsxs("li", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-baseline justify-between text-xs", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("span", { className: "font-medium text-[var(--z-fg)] truncate", children: row.source }), _jsx("span", { className: "text-[var(--z-muted)]", children: row.total })] }), _jsxs("div", { className: "flex items-center gap-3 text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: [_jsxs("span", { children: ["open ", row.open] }), _jsxs("span", { className: "text-emerald-300", children: [row.conversionRate, "% conv."] })] })] }), _jsx("div", { className: "h-2 rounded-full bg-white/5 overflow-hidden", children: _jsx("div", { className: cn("h-full transition-all", row.conversionRate >= 30
                                        ? "bg-emerald-400"
                                        : row.conversionRate >= 15
                                            ? "bg-amber-400"
                                            : "bg-sky-400"), style: { width: `${pct}%` } }) })] }, row.source));
                }) }))] }));
}
