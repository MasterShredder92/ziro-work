import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function LevelList({ levels, emptyMessage = "No levels yet.", }) {
    if (levels.length === 0) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center text-xs text-[var(--z-muted)]", children: emptyMessage }));
    }
    return (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: levels.map((level) => (_jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2.5", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [level.code ? (_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: level.code })) : null, _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)] truncate", children: level.name })] }), _jsx("span", { className: "text-[10px] rounded-full px-1.5 py-0.5 border " +
                                (level.is_active
                                    ? "border-[#00ff88]/30 text-[#00ff88]"
                                    : "border-[var(--z-border)] text-[var(--z-muted)]"), children: level.is_active ? "active" : "draft" })] }), level.description ? (_jsx("div", { className: "mt-1 text-xs text-[var(--z-muted)] line-clamp-2", children: level.description })) : null] }, level.id))) }));
}
