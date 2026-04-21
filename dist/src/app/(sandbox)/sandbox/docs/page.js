"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils/cn";
const tiles = [
    { title: "Getting Started", body: "Tenant + operator checklist." },
    { title: "Lifecycle", body: "Stages + signals overview." },
    { title: "Dashboard", body: "Feeds + command palette." },
];
export default function SandboxDocsPage() {
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "Docs (sandbox)" }), _jsx(Link, { className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox", children: "Back" })] }), _jsx(PageHeader, { title: "Layout QA", subtitle: "Mirrors the docs shell without nested routing." }), _jsx(Section, { title: "Card grid", accent: true, spacing: "default", children: _jsx("div", { className: "grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-3", children: tiles.map((t) => (_jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: cn("border-[var(--z-border)]", "hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)]"), children: [_jsx("div", { className: "text-sm font-extrabold", children: t.title }), _jsx("p", { className: "mt-2 text-xs text-[var(--z-muted)]", children: t.body })] }, t.title))) }) })] }));
}
