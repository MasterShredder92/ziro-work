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
export function StockList({ stock, emptyMessage = "No stock locations on file.", }) {
    if (stock.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]", children: emptyMessage }));
    }
    return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "border-b border-[var(--z-border)] text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 font-semibold", children: "Location" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Room" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Shelf" }), _jsx("th", { className: "px-4 py-2 font-semibold text-right", children: "On hand" }), _jsx("th", { className: "px-4 py-2 font-semibold text-right", children: "Reserved" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Last count" })] }) }), _jsx("tbody", { children: stock.map((s) => {
                        var _a, _b, _c;
                        return (_jsxs("tr", { className: "border-b border-[var(--z-border)] last:border-b-0", children: [_jsx("td", { className: "px-4 py-2 text-[var(--z-fg)]", children: (_a = s.location_id) !== null && _a !== void 0 ? _a : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: (_b = s.room_id) !== null && _b !== void 0 ? _b : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: (_c = s.shelf_label) !== null && _c !== void 0 ? _c : "—" }), _jsx("td", { className: "px-4 py-2 text-right font-semibold text-[var(--z-fg)]", children: s.quantity_on_hand }), _jsx("td", { className: "px-4 py-2 text-right text-[var(--z-muted)]", children: s.quantity_reserved }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: formatDate(s.last_counted_at) })] }, s.id));
                    }) })] }) }));
}
