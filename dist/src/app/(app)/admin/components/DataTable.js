import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function DataTable({ columns, rows, getRowKey, emptyLabel = "No records yet.", caption, maxRows, }) {
    const visible = typeof maxRows === "number" ? rows.slice(0, maxRows) : rows;
    return (_jsxs("div", { className: "overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [caption ? (_jsx("div", { className: "border-b border-[var(--z-border)] px-4 py-3 text-sm font-semibold text-[var(--z-fg)]", children: caption })) : null, _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full border-collapse text-sm", children: [_jsx("thead", { className: "bg-[color-mix(in_oklab,var(--z-surface),white_2%)]", children: _jsx("tr", { children: columns.map((c) => (_jsx("th", { scope: "col", style: c.width ? { width: c.width } : undefined, className: `px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)] ${c.align === "right"
                                        ? "text-right"
                                        : c.align === "center"
                                            ? "text-center"
                                            : "text-left"}`, children: c.header }, c.id))) }) }), _jsx("tbody", { children: visible.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, className: "px-4 py-8 text-center text-sm text-[var(--z-muted)]", children: emptyLabel }) })) : (visible.map((row, idx) => (_jsx("tr", { className: "border-t border-[var(--z-border)] hover:bg-white/[0.02]", children: columns.map((c) => (_jsx("td", { className: `px-4 py-3 text-[var(--z-fg)] ${c.align === "right"
                                        ? "text-right"
                                        : c.align === "center"
                                            ? "text-center"
                                            : "text-left"}`, children: c.accessor(row) }, c.id))) }, getRowKey(row, idx))))) })] }) }), typeof maxRows === "number" && rows.length > maxRows ? (_jsxs("div", { className: "border-t border-[var(--z-border)] px-4 py-2 text-xs text-[var(--z-muted)]", children: ["Showing ", maxRows, " of ", rows.length] })) : null] }));
}
