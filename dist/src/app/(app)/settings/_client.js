"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils/cn";
const categories = [
    { href: "/settings/studio-info", label: "Studio Info", description: "Identity, timezone, and billing cadence." },
    { href: "/billing", label: "Subscription & usage", description: "Plan, metering, Stripe portal, and invoice history." },
    { href: "/settings/billing", label: "Billing defaults", description: "Defaults for invoices, payouts, and penalties." },
    { href: "/settings/teachers", label: "Teachers", description: "Capacity defaults and onboarding scaffolding." },
    { href: "/settings/automations", label: "Automations", description: "Lifecycle intelligence toggles." },
    { href: "/settings/theme", label: "Theme", description: "Neon intensity, accent, and density." },
    { href: "/settings/permissions", label: "Permissions", description: "Roles and surface-level access maps." },
    { href: "/settings/integrations", label: "Integrations", description: "QUO, Gmail, Twilio, Stripe — connect external services." },
];
export function SettingsClient() {
    return (_jsx(PageShell, { title: "Settings", children: _jsxs("div", { className: "space-y-[var(--z-space-8)]", children: [_jsx(PageHeader, { title: "Studio settings", subtitle: "Charcoal shell, neon accents\u2014tune operations without leaving ZiroWork." }), _jsx("div", { className: "grid grid-cols-1 gap-[var(--z-space-4)] md:grid-cols-2 xl:grid-cols-3", children: categories.map((c) => (_jsx(Link, { href: c.href, className: "group block min-w-0", children: _jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: cn("h-full transition-colors", "border-[var(--z-border)] hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)]", "hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_78%),0_0_28px_color-mix(in_oklab,var(--z-accent),transparent_88%)]"), children: [_jsx("div", { className: "text-sm font-extrabold tracking-tight text-[var(--z-fg)] group-hover:text-[var(--z-accent)]", children: c.label }), _jsx("div", { className: "mt-2 text-xs leading-relaxed text-[var(--z-muted)]", children: c.description }), _jsx("div", { className: "mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--z-muted)]", children: "Open \u2192" })] }) }, c.href))) })] }) }));
}
