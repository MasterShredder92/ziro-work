"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessagesBadge } from "@/components/messaging/MessagesBadge";
function normalizeHrefBase(href) {
    var _a;
    return (_a = href.split("#")[0]) !== null && _a !== void 0 ? _a : href;
}
function isActive(pathname, item) {
    if (item.match)
        return item.match(pathname);
    const base = normalizeHrefBase(item.href);
    if (!base || base === "/")
        return pathname === "/";
    // Hash links target sections on the same page and should not auto-highlight
    // unrelated routes just because they share the same pathname.
    if (item.href.includes("#"))
        return false;
    return pathname === base || pathname.startsWith(`${base}/`);
}
export function PortalSidebarNav({ label, items, allowedNavIds, onNavigate, className, }) {
    var _a;
    const pathname = (_a = usePathname()) !== null && _a !== void 0 ? _a : "/";
    const visible = allowedNavIds
        ? items.filter((item) => allowedNavIds.includes(item.id))
        : items;
    return (_jsxs("nav", { className: `flex h-full flex-col gap-1 p-3 ${className !== null && className !== void 0 ? className : ""}`, "aria-label": label, children: [_jsx("div", { className: "px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), visible.map((item) => (_jsxs(Link, { href: item.href, onClick: onNavigate, className: `flex items-center gap-2 rounded-[var(--z-radius-md)] px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] ${isActive(pathname, item)
                    ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_80%)] text-[var(--z-fg)]"
                    : "text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)]"}`, children: [item.icon ? (_jsx("span", { className: "inline-flex w-4 justify-center text-sm", children: item.icon })) : null, _jsx("span", { children: item.label }), item.id === "messages" ? _jsx(MessagesBadge, {}) : null] }, item.id)))] }));
}
