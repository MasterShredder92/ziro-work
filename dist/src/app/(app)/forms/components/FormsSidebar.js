"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { usePathname } from "next/navigation";
export const FORMS_NAV_ITEMS = [
    {
        id: "overview",
        label: "Overview",
        href: "/forms",
        icon: "▦",
        scope: "forms.read",
    },
    {
        id: "library",
        label: "Form Library",
        href: "/forms#library",
        icon: "📄",
        scope: "forms.read",
    },
    {
        id: "submissions",
        label: "Submissions",
        href: "/forms#submissions",
        icon: "✉",
        scope: "forms.read",
    },
];
export function FormsSidebar({ allowedNavIds, activeFormName, }) {
    const pathname = usePathname();
    const items = allowedNavIds
        ? FORMS_NAV_ITEMS.filter((i) => allowedNavIds.includes(i.id))
        : FORMS_NAV_ITEMS;
    return (_jsxs("nav", { className: "flex flex-col gap-1 px-4 py-5", children: [_jsx("div", { className: "mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Forms OS" }), items.map((item) => {
                const base = item.href.split("#")[0];
                const isActive = base === "/forms"
                    ? pathname === "/forms"
                    : pathname.startsWith(base);
                return (_jsxs(Link, { href: item.href, className: `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                        ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] text-[var(--z-accent)]"
                        : "text-[var(--z-fg)]/80 hover:bg-white/[0.04] hover:text-[var(--z-fg)]"}`, children: [_jsx("span", { className: "text-xs text-[var(--z-muted)]", children: item.icon }), _jsx("span", { children: item.label })] }, item.id));
            }), activeFormName ? (_jsxs("div", { className: "mt-4 border-t border-[var(--z-border)] pt-4 text-xs text-[var(--z-muted)]", children: [_jsx("div", { className: "font-semibold uppercase tracking-wider", children: "Editing" }), _jsx("div", { className: "mt-1 truncate text-sm text-[var(--z-fg)]", children: activeFormName })] })) : null] }));
}
