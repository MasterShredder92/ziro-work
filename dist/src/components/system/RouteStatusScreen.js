"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
export function RouteStatusScreen({ code, title, message, actions = [] }) {
    return (_jsx("section", { className: "mx-auto flex min-h-[60vh] w-full max-w-xl items-center justify-center px-4 py-10 sm:px-6", "aria-labelledby": "route-status-title", "aria-live": "polite", children: _jsxs("div", { className: "w-full rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-6 shadow-sm sm:p-8", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-[var(--z-muted)]", children: code }), _jsx("h1", { id: "route-status-title", className: "mt-2 text-2xl font-extrabold text-[var(--z-fg)]", children: title }), _jsx("p", { className: "mt-3 text-sm leading-relaxed text-[var(--z-muted)]", children: message }), actions.length > 0 ? (_jsx("div", { className: "mt-6 flex flex-wrap gap-3", children: actions.map((action) => {
                        const primary = action.kind !== "secondary";
                        return (_jsx(Link, { href: action.href, className: primary
                                ? "inline-flex items-center rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-4 py-2 text-sm font-semibold text-[var(--z-on-accent,white)] transition hover:opacity-90"
                                : "inline-flex items-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-4 py-2 text-sm font-semibold text-[var(--z-fg)] transition hover:bg-white/5", children: action.label }, `${action.href}:${action.label}`));
                    }) })) : null] }) }));
}
