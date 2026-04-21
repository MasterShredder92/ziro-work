"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
const demos = [
    { href: "/sandbox/settings/studio-info", label: "Studio Info", description: "Tenant form shell without Supabase." },
    { href: "/sandbox/settings/theme", label: "Theme", description: "Accent, neon strength, density preview." },
    { href: "/sandbox/settings/permissions", label: "Permissions", description: "Role cards with static grants." },
];
export default function SandboxSettingsIndexPage() {
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "Settings sandbox" }), _jsx(Link, { className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox", children: "Back" })] }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Visual QA for the ZiroWork settings stack." }), _jsx("div", { className: "grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-2", children: demos.map((d) => (_jsxs(Link, { href: d.href, className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-[var(--z-space-5)] py-[var(--z-space-4)] hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_78%),0_0_24px_color-mix(in_oklab,var(--z-accent),transparent_88%)] transition-colors", children: [_jsx("div", { className: "text-sm font-extrabold", children: d.label }), _jsx("div", { className: "mt-1 text-xs text-[var(--z-muted)]", children: d.description }), _jsx("div", { className: "mt-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--z-muted)]", children: d.href })] }, d.href))) })] }));
}
