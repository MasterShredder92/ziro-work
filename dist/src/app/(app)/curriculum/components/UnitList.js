import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function UnitList({ units, emptyMessage = "No units yet.", }) {
    if (units.length === 0) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-center text-xs text-[var(--z-muted)]", children: emptyMessage }));
    }
    return (_jsx("ul", { className: "space-y-1.5", children: units.map((unit) => (_jsx("li", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2", children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)] truncate", children: unit.name }), unit.description ? (_jsx("div", { className: "text-xs text-[var(--z-muted)] line-clamp-2", children: unit.description })) : null] }), typeof unit.sort_order === "number" ? (_jsxs("span", { className: "shrink-0 text-[10px] text-[var(--z-muted)]", children: ["#", unit.sort_order] })) : null] }) }, unit.id))) }));
}
