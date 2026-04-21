import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
export function LocationList({ locations }) {
    if (locations.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center text-sm text-[var(--z-muted)]", children: "No active locations configured yet." }));
    }
    return (_jsx("ul", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: locations.map((loc) => {
            var _a;
            return (_jsx("li", { children: _jsxs(Link, { href: `/locations/${loc.id}`, className: "group flex h-full flex-col gap-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 transition hover:border-[var(--z-accent)]", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("h3", { className: "truncate text-base font-semibold text-[var(--z-fg)]", children: loc.name }), loc.is_active === false ? (_jsx("span", { className: "rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)]", children: "Inactive" })) : null] }), _jsx("p", { className: "truncate text-xs text-[var(--z-muted)]", children: [loc.address, loc.city, loc.state, loc.zip]
                                .filter(Boolean)
                                .join(", ") }), _jsxs("div", { className: "mt-auto flex items-center justify-between text-xs text-[var(--z-muted)]", children: [_jsxs("span", { children: [(_a = loc.students_enrolled) !== null && _a !== void 0 ? _a : 0, " enrolled"] }), _jsx("span", { className: "text-[var(--z-accent)] group-hover:underline", children: "View dashboard \u2192" })] })] }) }, loc.id));
        }) }));
}
