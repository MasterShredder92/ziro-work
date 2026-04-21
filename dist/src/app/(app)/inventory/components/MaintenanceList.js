import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function formatDate(date) {
    if (!date)
        return "—";
    try {
        return new Date(date).toLocaleDateString();
    }
    catch (_a) {
        return date;
    }
}
function formatCurrency(value) {
    if (value == null)
        return "—";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);
}
export function MaintenanceList({ maintenance, emptyMessage = "No maintenance records yet.", maxRows, showItem, }) {
    if (maintenance.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]", children: emptyMessage }));
    }
    const rows = typeof maxRows === "number" ? maintenance.slice(0, maxRows) : maintenance;
    return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "border-b border-[var(--z-border)] text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [showItem ? (_jsx("th", { className: "px-4 py-2 font-semibold", children: "Item" })) : null, _jsx("th", { className: "px-4 py-2 font-semibold", children: "Summary" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Kind" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Status" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Scheduled" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Completed" }), _jsx("th", { className: "px-4 py-2 font-semibold text-right", children: "Cost" })] }) }), _jsx("tbody", { children: rows.map((m) => (_jsxs("tr", { className: "border-b border-[var(--z-border)] last:border-b-0", children: [showItem ? (_jsx("td", { className: "px-4 py-2 text-[var(--z-fg)]", children: m.item_id })) : null, _jsx("td", { className: "px-4 py-2 text-[var(--z-fg)]", children: m.summary }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: m.kind.replace(/_/g, " ") }), _jsx("td", { className: "px-4 py-2", children: _jsx("span", { className: `rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${m.status === "completed"
                                        ? "text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/30"
                                        : m.status === "in_progress"
                                            ? "text-sky-300 bg-sky-400/10 border-sky-400/30"
                                            : m.status === "cancelled"
                                                ? "text-[var(--z-muted)] bg-white/5 border-[var(--z-border)]"
                                                : "text-amber-300 bg-amber-400/10 border-amber-400/30"}`, children: m.status.replace(/_/g, " ") }) }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: formatDate(m.scheduled_for) }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: formatDate(m.completed_at) }), _jsx("td", { className: "px-4 py-2 text-right text-[var(--z-muted)]", children: formatCurrency(m.cost) })] }, m.id))) })] }) }));
}
