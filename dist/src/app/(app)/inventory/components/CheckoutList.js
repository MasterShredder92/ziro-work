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
function isOverdue(c) {
    if (c.returned_at)
        return false;
    if (!c.due_date)
        return false;
    try {
        return new Date(c.due_date).getTime() < Date.now();
    }
    catch (_a) {
        return false;
    }
}
export function CheckoutList({ checkouts, emptyMessage = "No checkouts recorded yet.", maxRows, showItem, }) {
    if (checkouts.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]", children: emptyMessage }));
    }
    const rows = typeof maxRows === "number" ? checkouts.slice(0, maxRows) : checkouts;
    return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "border-b border-[var(--z-border)] text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [showItem ? (_jsx("th", { className: "px-4 py-2 font-semibold", children: "Item" })) : null, _jsx("th", { className: "px-4 py-2 font-semibold", children: "Profile" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Checked out" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Due" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Returned" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Status" })] }) }), _jsx("tbody", { children: rows.map((c) => {
                        const overdue = isOverdue(c);
                        return (_jsxs("tr", { className: "border-b border-[var(--z-border)] last:border-b-0", children: [showItem ? (_jsx("td", { className: "px-4 py-2 text-[var(--z-fg)]", children: c.item_id })) : null, _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: c.profile_id }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: formatDate(c.checked_out_at) }), _jsx("td", { className: `px-4 py-2 ${overdue ? "text-rose-300" : "text-[var(--z-muted)]"}`, children: formatDate(c.due_date) }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: formatDate(c.returned_at) }), _jsx("td", { className: "px-4 py-2", children: _jsx("span", { className: `rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${overdue
                                            ? "text-rose-300 bg-rose-400/10 border-rose-400/30"
                                            : c.returned_at
                                                ? "text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/30"
                                                : "text-sky-300 bg-sky-400/10 border-sky-400/30"}`, children: overdue ? "overdue" : c.status }) })] }, c.id));
                    }) })] }) }));
}
