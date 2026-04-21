"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { RoleCard } from "@/components/settings/RoleCard";
import { Card } from "@/components/ui/Card";
const ROLES = [
    {
        name: "Owner",
        permissions: [
            { id: "o-1", kind: "page", label: "Dashboard" },
            { id: "o-2", kind: "page", label: "Studio Map" },
            { id: "o-3", kind: "page", label: "Lifecycle" },
            { id: "o-4", kind: "page", label: "Operations" },
            { id: "o-5", kind: "page", label: "Settings" },
            { id: "o-6", kind: "action", label: "Manage billing" },
            { id: "o-7", kind: "action", label: "Invite users" },
            { id: "o-8", kind: "action", label: "Destroy tenant (simulated)" },
        ],
    },
    {
        name: "Admin",
        permissions: [
            { id: "a-1", kind: "page", label: "Dashboard" },
            { id: "a-2", kind: "page", label: "Studio Map" },
            { id: "a-3", kind: "page", label: "Lifecycle" },
            { id: "a-4", kind: "page", label: "Operations" },
            { id: "a-5", kind: "page", label: "Settings" },
            { id: "a-6", kind: "action", label: "Edit teachers" },
            { id: "a-7", kind: "action", label: "Issue refunds" },
        ],
    },
    {
        name: "Coordinator",
        permissions: [
            { id: "c-1", kind: "page", label: "Dashboard" },
            { id: "c-2", kind: "page", label: "Lifecycle" },
            { id: "c-3", kind: "page", label: "Students" },
            { id: "c-4", kind: "page", label: "Families" },
            { id: "c-5", kind: "action", label: "Reschedule lessons" },
            { id: "c-6", kind: "action", label: "Send nudges" },
        ],
    },
    {
        name: "Teacher",
        permissions: [
            { id: "t-1", kind: "page", label: "Dashboard" },
            { id: "t-2", kind: "page", label: "Students (assigned)" },
            { id: "t-3", kind: "action", label: "Log attendance" },
            { id: "t-4", kind: "action", label: "Add lesson notes" },
        ],
    },
];
export function PermissionsSettingsClient() {
    return (_jsxs(PageShell, { title: "Permissions", children: [_jsx("div", { className: "mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: _jsx(Link, { className: "text-[var(--z-accent)] hover:underline", href: "/settings", children: "\u2190 All settings" }) }), _jsx(SettingsSection, { title: "Roles & coverage", description: "Static matrix for UX review\u2014wire to your auth provider when policies land.", children: _jsx("div", { className: "space-y-[var(--z-space-5)]", children: ROLES.map((r) => (_jsxs("div", { className: "space-y-[var(--z-space-4)]", children: [_jsx(RoleCard, { role: r.name, permissions: r.permissions }), r.name === "Owner" ? (_jsxs(SettingsSection, { title: "Go-to-market (Owner only)", description: "Studio owner tools for email, automations, announcements, and release notes.", children: [_jsx(Link, { className: "mb-[var(--z-space-3)] block rounded-[var(--z-radius-md)] border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-extrabold text-[var(--z-fg)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_70%)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_35%)] hover:text-[var(--z-accent)]", href: "/publishing-hub", children: "Publishing Hub" }), _jsx(Link, { className: "mb-[var(--z-space-3)] block rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-extrabold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:text-[var(--z-accent)]", href: "/marketing-insights", children: "Marketing Insights" }), _jsxs("div", { className: "grid grid-cols-1 gap-[var(--z-space-3)] sm:grid-cols-2", children: [_jsx(Link, { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:text-[var(--z-accent)]", href: "/email-templates", children: "Email templates" }), _jsx(Link, { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:text-[var(--z-accent)]", href: "/email-preview", children: "Email preview" }), _jsx(Link, { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:text-[var(--z-accent)]", href: "/automations", children: "Automations" }), _jsx(Link, { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:text-[var(--z-accent)]", href: "/announcements", children: "Announcements" }), _jsx(Link, { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:text-[var(--z-accent)] sm:col-span-2", href: "/release-notes", children: "Release notes" })] })] })) : null] }, r.name))) }) }), _jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "mt-[var(--z-space-8)] border-[color-mix(in_oklab,var(--z-accent),transparent_65%)]", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Owner workspace" }), _jsx("p", { className: "mt-2 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]", children: "Draft release notes locally, preview the neon changelog card, and iterate before publishing." }), _jsx("div", { className: "mt-[var(--z-space-4)]", children: _jsx(Link, { href: "/admin/release-notes", className: "text-sm font-semibold text-[var(--z-accent)] hover:underline", children: "Open release notes automation \u2192" }) }), _jsx("p", { className: "mt-2 text-[0.65rem] text-[var(--z-muted)]", children: "In production, show this card only when the signed-in role is Owner." })] })] }));
}
