import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
function formatCurrency(value) {
    if (value == null)
        return "—";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);
}
function StatusPill({ status }) {
    const color = status === "available"
        ? "text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/30"
        : status === "in_use"
            ? "text-sky-300 bg-sky-400/10 border-sky-400/30"
            : status === "maintenance"
                ? "text-amber-300 bg-amber-400/10 border-amber-400/30"
                : status === "lost"
                    ? "text-rose-300 bg-rose-400/10 border-rose-400/30"
                    : "text-[var(--z-muted)] bg-white/5 border-[var(--z-border)]";
    return (_jsx("span", { className: `shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${color}`, children: status.replace(/_/g, " ") }));
}
export function InventoryList({ items, emptyMessage = "No inventory items yet.", maxRows, }) {
    if (items.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]", children: emptyMessage }));
    }
    const rows = typeof maxRows === "number" ? items.slice(0, maxRows) : items;
    return (_jsx("div", { className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3", children: rows.map((s) => {
            const item = s.item;
            return (_jsxs(Link, { href: `/inventory/${item.id}`, className: "block rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 hover:border-[#00ff88]/40 hover:bg-[color-mix(in_oklab,var(--z-surface),var(--z-accent)_4%)] transition-colors", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)] truncate", children: item.name }), _jsxs("div", { className: "mt-1 text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: [item.category, " \u00B7 ", item.condition] })] }), _jsx(StatusPill, { status: item.status })] }), item.brand || item.model ? (_jsx("p", { className: "mt-2 line-clamp-1 text-xs text-[var(--z-muted)]", children: [item.brand, item.model].filter(Boolean).join(" · ") })) : null, _jsxs("div", { className: "mt-3 grid grid-cols-4 gap-2 text-[11px] text-[var(--z-muted)]", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase", children: "Qty" }), _jsx("div", { className: "font-semibold text-[var(--z-fg)]", children: s.totalOnHand })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase", children: "Checkouts" }), _jsx("div", { className: "font-semibold text-[var(--z-fg)]", children: s.activeCheckouts })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase", children: "Overdue" }), _jsx("div", { className: `font-semibold ${s.overdueCheckouts > 0
                                            ? "text-rose-300"
                                            : "text-[var(--z-fg)]"}`, children: s.overdueCheckouts })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase", children: "Maint." }), _jsx("div", { className: `font-semibold ${s.openMaintenance > 0
                                            ? "text-amber-300"
                                            : "text-[var(--z-fg)]"}`, children: s.openMaintenance })] })] }), item.purchase_price != null ? (_jsxs("div", { className: "mt-3 flex items-center justify-between text-xs text-[var(--z-muted)]", children: [_jsxs("span", { children: ["Purchase", " ", _jsx("span", { className: "font-semibold text-[var(--z-fg)]", children: formatCurrency(item.purchase_price) })] }), _jsxs("span", { children: ["Current", " ", _jsx("span", { className: "font-semibold text-[var(--z-fg)]", children: formatCurrency(item.current_value) })] })] })) : null] }, item.id));
        }) }));
}
