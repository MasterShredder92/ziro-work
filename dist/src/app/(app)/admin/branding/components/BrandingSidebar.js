"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { usePathname } from "next/navigation";
export const BRANDING_NAV = [
    {
        id: "dashboard",
        label: "Dashboard",
        href: "/admin/branding",
        description: "Overview of logo, colors, domain, identity.",
        icon: "▦",
        match: (p) => p === "/admin/branding",
    },
    {
        id: "theme",
        label: "Theme",
        href: "/admin/branding/theme",
        description: "Colors, typography, component tokens.",
        icon: "◎",
        match: (p) => p.startsWith("/admin/branding/theme"),
    },
    {
        id: "domain",
        label: "Domain",
        href: "/admin/branding/domain",
        description: "Custom domains & CNAME verification.",
        icon: "✱",
        match: (p) => p.startsWith("/admin/branding/domain"),
    },
    {
        id: "email",
        label: "Email identity",
        href: "/admin/branding/email",
        description: "From address, reply-to, test send.",
        icon: "✉",
        match: (p) => p.startsWith("/admin/branding/email"),
    },
    {
        id: "layouts",
        label: "Portal layouts",
        href: "/admin/branding/layouts",
        description: "Presets, sidebar, dashboards.",
        icon: "▤",
        match: (p) => p.startsWith("/admin/branding/layouts"),
    },
    {
        id: "preview",
        label: "Preview",
        href: "/admin/branding/preview",
        description: "Live preview of tenant theme.",
        icon: "◉",
        match: (p) => p.startsWith("/admin/branding/preview"),
    },
];
export function BrandingSidebar({ tenantLabel, canWrite, }) {
    var _a;
    const pathname = (_a = usePathname()) !== null && _a !== void 0 ? _a : "/admin/branding";
    return (_jsxs("aside", { className: "md:sticky md:top-0 md:h-[calc(100vh-52px)] w-full md:w-[260px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_10%)]", children: [_jsxs("div", { className: "px-5 py-4 border-b border-[var(--z-border)]", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Branding OS" }), _jsx("div", { className: "mt-1 text-base font-semibold text-[var(--z-fg)] truncate", children: tenantLabel }), _jsx("div", { className: "mt-1 text-[11px] text-[var(--z-muted)]", children: canWrite ? "Admin · write enabled" : "Director · read only" })] }), _jsx("nav", { className: "flex md:block overflow-x-auto md:overflow-visible px-2 py-3 gap-1 md:gap-0 md:space-y-0.5", children: BRANDING_NAV.map((item) => {
                    const isActive = item.match(pathname);
                    return (_jsxs(Link, { href: item.href, className: `block shrink-0 md:shrink md:w-full px-3 py-2 rounded-[var(--z-radius-md)] text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal ${isActive
                            ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_80%)] text-[var(--z-fg)]"
                            : "text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)]"}`, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "inline-flex w-4 justify-center text-sm", children: item.icon }), _jsx("span", { children: item.label })] }), _jsx("div", { className: "hidden md:block text-[11px] mt-0.5 text-[var(--z-muted)]", children: item.description })] }, item.id));
                }) })] }));
}
