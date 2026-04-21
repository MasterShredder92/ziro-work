import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function PivotTable({ columns, rows, title, maxRows = 200, }) {
    const displayed = rows.slice(0, maxRows);
    const truncated = rows.length > maxRows;
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [title ? (_jsx("div", { className: "border-b border-[var(--z-border)] px-4 py-2 text-xs font-semibold text-[var(--z-fg)]", children: title })) : null, _jsx("div", { className: "max-h-[480px] overflow-auto", children: _jsxs("table", { className: "w-full text-left text-xs", children: [_jsx("thead", { className: "sticky top-0 bg-[var(--z-surface)] text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: _jsx("tr", { children: columns.map((col) => {
                                    var _a, _b;
                                    return (_jsx("th", { className: "border-b border-[var(--z-border)] px-3 py-2 font-semibold", style: {
                                            textAlign: (_a = col.align) !== null && _a !== void 0 ? _a : "left",
                                            width: col.width,
                                        }, children: (_b = col.label) !== null && _b !== void 0 ? _b : col.key }, col.key));
                                }) }) }), _jsx("tbody", { children: displayed.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length || 1, className: "px-3 py-6 text-center text-[var(--z-muted)]", children: "No rows." }) })) : (displayed.map((row, i) => (_jsx("tr", { className: "border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/5", children: columns.map((col) => {
                                    var _a;
                                    return (_jsx("td", { className: "px-3 py-2 text-[var(--z-fg)]", style: { textAlign: (_a = col.align) !== null && _a !== void 0 ? _a : "left" }, children: formatCell(row[col.key], col) }, col.key));
                                }) }, i)))) })] }) }), truncated ? (_jsxs("div", { className: "border-t border-[var(--z-border)] px-3 py-2 text-[11px] text-[var(--z-muted)]", children: ["Showing first ", maxRows, " of ", rows.length, " rows."] })) : null] }));
}
function formatCell(value, col) {
    if (value === null || value === undefined)
        return "—";
    if (typeof value === "number") {
        if (col.format === "currency") {
            return `$${(value / 100).toFixed(2)}`;
        }
        if (col.format === "percent") {
            return `${value}%`;
        }
        return String(value);
    }
    if (typeof value === "boolean")
        return value ? "Yes" : "No";
    if (typeof value === "object")
        return JSON.stringify(value);
    return String(value);
}
