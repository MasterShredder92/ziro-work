import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
export function ProgramList({ programs, emptyMessage = "No programs yet.", }) {
    if (programs.length === 0) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: emptyMessage }), _jsx("div", { className: "mt-1 text-xs text-[var(--z-muted)]", children: "Add a program to start mapping levels, units, and lessons." })] }));
    }
    return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3", children: programs.map((program) => {
            var _a, _b;
            return (_jsxs(Link, { href: `/curriculum/${program.id}`, className: "group rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] transition-colors", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: (_a = program.instrument) !== null && _a !== void 0 ? _a : "Program" }), _jsx("div", { className: "mt-1 text-base font-semibold text-[var(--z-fg)] truncate", children: program.name })] }), _jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 border " +
                                    (program.is_active
                                        ? "border-[#00ff88]/40 text-[#00ff88] bg-[#00ff88]/10"
                                        : "border-[var(--z-border)] text-[var(--z-muted)] bg-[var(--z-surface-2)]"), children: program.is_active ? "Active" : "Draft" })] }), program.description ? (_jsx("div", { className: "mt-2 text-xs text-[var(--z-muted)] line-clamp-2", children: program.description })) : null, _jsxs("div", { className: "mt-3 flex items-center gap-3 text-xs text-[var(--z-muted)]", children: [_jsxs("span", { children: [(_b = program.level_count) !== null && _b !== void 0 ? _b : 0, " levels"] }), _jsx("span", { className: "opacity-50", children: "\u00B7" }), _jsx("span", { className: "group-hover:text-[var(--z-accent)]", children: "Open \u2192" })] })] }, program.id));
        }) }));
}
