"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { MessagesBadge } from "@/components/messaging/MessagesBadge";
export const ADMIN_NAV_ITEMS = [
    {
        href: "/admin",
        label: "Dashboard",
        icon: "▦",
        match: (p) => p === "/admin",
    },
    {
        href: "/crm",
        label: "CRM",
        icon: "◎",
        match: (p) => p === "/crm" || p.startsWith("/crm/"),
        scope: "crm.read",
    },
    {
        href: "/admin/leads",
        label: "Leads",
        icon: "⎈",
        match: (p) => p.startsWith("/admin/leads"),
        scope: "leads.read",
    },
    {
        href: "/admin/students",
        label: "Students",
        icon: "☺",
        match: (p) => p.startsWith("/admin/students"),
        scope: "students.read",
    },
    {
        href: "/admin/teachers",
        label: "Teachers",
        icon: "♪",
        match: (p) => p.startsWith("/admin/teachers"),
        scope: "students.read",
    },
    {
        href: "/schedule",
        label: "Schedule",
        icon: "⌚",
        match: (p) => p === "/schedule" || p.startsWith("/schedule/"),
        scope: "schedule.read",
    },
    {
        href: "/scheduling",
        label: "Scheduling OS",
        icon: "◫",
        match: (p) => p === "/scheduling" || p.startsWith("/scheduling/"),
        scope: "scheduling.read",
    },
    {
        href: "/admin/billing",
        label: "Billing",
        icon: "$",
        match: (p) => p.startsWith("/admin/billing"),
        scope: "billing.read",
    },
    {
        href: "/attendance",
        label: "Attendance",
        icon: "⏱",
        match: (p) => p.startsWith("/attendance"),
        scope: "attendance.read",
    },
    {
        href: "/content",
        label: "Content Library",
        icon: "▤",
        match: (p) => p.startsWith("/content"),
        scope: "content.read",
    },
    {
        href: "/files",
        label: "Files",
        icon: "📁",
        match: (p) => p === "/files" || p.startsWith("/files/"),
        scope: "files.read",
    },
    {
        href: "/messages",
        label: "Messages",
        icon: "✉",
        match: (p) => p === "/messages" || p.startsWith("/messages/"),
        scope: "messages.read",
    },
    {
        href: "/templates",
        label: "Templates",
        icon: "✎",
        match: (p) => p.startsWith("/templates"),
        scope: "templates.read",
    },
    {
        href: "/automation",
        label: "Automation",
        icon: "◎",
        match: (p) => p.startsWith("/automation"),
        scope: "automation.read",
    },
    {
        href: "/reports",
        label: "Reports",
        icon: "▲",
        match: (p) => p.startsWith("/reports"),
        scope: "reports.read",
    },
    {
        href: "/admin/branding",
        label: "Branding",
        icon: "◐",
        match: (p) => p === "/admin/branding" || p.startsWith("/admin/branding/"),
        scope: "admin.branding.read",
    },
    {
        href: "/admin/settings",
        label: "Settings",
        icon: "⚙",
        match: (p) => p === "/admin/settings" || p.startsWith("/admin/settings/"),
        scope: "admin.settings.read",
    },
    {
        href: "/admin/branding",
        label: "Branding",
        icon: "◐",
        match: (p) => p === "/admin/branding" || p.startsWith("/admin/branding/"),
        scope: "admin.branding.read",
    },
    {
        href: "/admin/roles",
        label: "Roles",
        icon: "◈",
        match: (p) => p.startsWith("/admin/roles"),
        scope: "admin.roles.read",
    },
    {
        href: "/admin/permissions",
        label: "Permissions",
        icon: "◊",
        match: (p) => p.startsWith("/admin/permissions"),
        scope: "admin.permissions.read",
    },
    {
        href: "/admin/feature-flags",
        label: "Feature flags",
        icon: "⚑",
        match: (p) => p.startsWith("/admin/feature-flags"),
        scope: "admin.feature_flags.read",
    },
    {
        href: "/admin/audit",
        label: "Audit log",
        icon: "⟳",
        match: (p) => p.startsWith("/admin/audit"),
        scope: "admin.audit.read",
    },
    {
        href: "/admin/system-health",
        label: "System health",
        icon: "♥",
        match: (p) => p.startsWith("/admin/system-health"),
        scope: "admin.system_health.read",
    },
];
export function AdminShell({ tenantId, tenants, locations, children, allowedNavHrefs, headerExtras, }) {
    var _a, _b;
    const pathname = (_a = usePathname()) !== null && _a !== void 0 ? _a : "/admin";
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [, startTransition] = useTransition();
    const hrefWithTenant = useCallback((href) => {
        const qs = new URLSearchParams();
        if (tenantId)
            qs.set("tenantId", tenantId);
        const locationId = searchParams === null || searchParams === void 0 ? void 0 : searchParams.get("locationId");
        if (locationId)
            qs.set("locationId", locationId);
        const suffix = qs.toString();
        return suffix ? `${href}?${suffix}` : href;
    }, [tenantId, searchParams]);
    const onTenantChange = (nextTenantId) => {
        var _a;
        const qs = new URLSearchParams((_a = searchParams === null || searchParams === void 0 ? void 0 : searchParams.toString()) !== null && _a !== void 0 ? _a : "");
        qs.set("tenantId", nextTenantId);
        qs.delete("locationId");
        startTransition(() => {
            router.push(`${pathname}?${qs.toString()}`);
            router.refresh();
        });
    };
    const onLocationChange = (nextLocationId) => {
        var _a;
        const qs = new URLSearchParams((_a = searchParams === null || searchParams === void 0 ? void 0 : searchParams.toString()) !== null && _a !== void 0 ? _a : "");
        if (nextLocationId)
            qs.set("locationId", nextLocationId);
        else
            qs.delete("locationId");
        startTransition(() => {
            router.push(`${pathname}?${qs.toString()}`);
            router.refresh();
        });
    };
    const currentLocationId = (_b = searchParams === null || searchParams === void 0 ? void 0 : searchParams.get("locationId")) !== null && _b !== void 0 ? _b : "";
    return (_jsxs("div", { className: "flex h-full min-h-0 flex-col bg-[var(--z-bg)]", children: [_jsxs("header", { className: "sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-[var(--z-border)] bg-[var(--z-surface)] px-4", children: [_jsx("button", { type: "button", onClick: () => setMobileOpen((v) => !v), className: "inline-flex h-9 w-9 items-center justify-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] text-[var(--z-fg)] lg:hidden", "aria-label": "Toggle navigation", children: "\u2630" }), _jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsx("span", { className: "inline-flex h-7 w-7 items-center justify-center rounded-[var(--z-radius-sm)] font-bold text-black", style: { backgroundColor: "var(--z-accent)" }, children: "Z" }), _jsx("div", { className: "truncate text-sm font-semibold text-[var(--z-fg)]", children: "ZiroWork OS \u00B7 Admin" })] }), _jsxs("div", { className: "ml-auto flex items-center gap-2", children: [_jsx("label", { className: "sr-only", htmlFor: "admin-tenant-switcher", children: "Tenant" }), _jsx("select", { id: "admin-tenant-switcher", value: tenantId, onChange: (e) => onTenantChange(e.target.value), className: "h-9 min-w-[160px] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)]", children: tenants.map((t) => (_jsx("option", { value: t.id, children: t.name }, t.id))) }), locations.length > 0 ? (_jsxs("select", { value: currentLocationId, onChange: (e) => onLocationChange(e.target.value), className: "hidden h-9 min-w-[160px] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)] md:block", "aria-label": "Location", children: [_jsx("option", { value: "", children: "All locations" }), locations.map((l) => (_jsx("option", { value: l.id, children: l.name }, l.id)))] })) : null, headerExtras] })] }), _jsxs("div", { className: "flex min-h-0 flex-1", children: [_jsx("aside", { className: `${mobileOpen ? "absolute inset-y-0 left-0 z-30 w-64" : "hidden"} shrink-0 border-r border-[var(--z-border)] bg-[var(--z-surface)] lg:static lg:block lg:w-60`, children: _jsxs("nav", { className: "flex h-full flex-col gap-1 p-3", children: [_jsx("div", { className: "px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Navigation" }), ADMIN_NAV_ITEMS.filter((item) => !allowedNavHrefs || allowedNavHrefs.includes(item.href)).map((item) => {
                                    const active = item.match(pathname);
                                    return (_jsxs(Link, { href: hrefWithTenant(item.href), onClick: () => setMobileOpen(false), className: `flex items-center gap-2 rounded-[var(--z-radius-md)] px-3 py-2 text-sm transition-colors ${active
                                            ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_80%)] text-[var(--z-fg)]"
                                            : "text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)]"}`, children: [_jsx("span", { className: "inline-flex w-4 justify-center text-sm", children: item.icon }), _jsx("span", { children: item.label }), item.href === "/messages" ? _jsx(MessagesBadge, {}) : null] }, item.href));
                                })] }) }), mobileOpen ? (_jsx("div", { className: "absolute inset-0 z-20 bg-black/50 lg:hidden", onClick: () => setMobileOpen(false), "aria-hidden": true })) : null, _jsx("div", { className: "flex min-h-0 min-w-0 flex-1 flex-col overflow-auto", children: children })] })] }));
}
