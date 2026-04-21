"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
const SCROLLER = "flex gap-2 overflow-x-auto overscroll-x-contain py-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";
const ACTION_CLASS = "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md bg-[var(--z-surface-2)] px-3 py-1.5 text-sm font-medium text-[var(--z-fg)] transition-colors hover:bg-[color-mix(in_oklab,var(--z-surface-2),white_8%)] active:bg-[color-mix(in_oklab,var(--z-surface-2),white_12%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] sm:min-h-0";
export function PortalQuickActionStrip({ actions, allowedNavIds, ariaLabel, }) {
    const visible = actions.filter((a) => allowedNavIds == null || allowedNavIds.includes(a.id));
    if (visible.length === 0)
        return null;
    return (_jsx("nav", { "aria-label": ariaLabel, className: "shrink-0 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),transparent_8%)]", children: _jsx("div", { className: SCROLLER, children: visible.map((a) => (_jsxs(Link, { href: a.href, className: ACTION_CLASS, children: [_jsx("span", { className: "text-base leading-none opacity-90", "aria-hidden": true, children: a.icon }), _jsx("span", { children: a.label })] }, a.id))) }) }));
}
