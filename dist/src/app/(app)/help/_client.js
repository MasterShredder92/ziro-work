"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { List } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";
const faq = [
    {
        id: "faq-1",
        title: "Where do announcements pull from?",
        description: "They read the latest static changelog entry and respect a dismiss flag in localStorage.",
        action: _jsx(Badge, { variant: "neutral", children: "Announcements" }),
    },
    {
        id: "faq-2",
        title: "How do I ship release notes?",
        description: "Owners can draft UI-only payloads under Admin → Release notes (local preview + storage).",
        action: _jsx(Badge, { variant: "success", children: "Owner" }),
    },
];
const shortcuts = [
    { id: "sc-1", title: "⌘K", description: "Command palette", action: _jsx(Badge, { variant: "neutral", children: "Global" }) },
    { id: "sc-2", title: "Esc", description: "Close modals / dialogs", action: _jsx(Badge, { variant: "neutral", children: "Global" }) },
];
const support = [
    {
        id: "su-1",
        title: "Email the team",
        description: "support@zirowork.example",
        action: _jsx(Badge, { variant: "warning", children: "Human" }),
    },
];
const docLinks = [
    {
        id: "dl-1",
        title: "Documentation home",
        description: "/docs",
        action: (_jsx(Link, { href: "/docs", className: "text-xs font-semibold text-[var(--z-accent)] hover:underline", children: "Open" })),
    },
    {
        id: "dl-2",
        title: "Changelog",
        description: "/docs/changelog",
        action: (_jsx(Link, { href: "/docs/changelog", className: "text-xs font-semibold text-[var(--z-accent)] hover:underline", children: "Open" })),
    },
];
export function HelpClient() {
    return (_jsx(PageShell, { title: "Help", children: _jsxs("div", { className: "space-y-[var(--z-space-10)]", children: [_jsx(PageHeader, { title: "Help hub", subtitle: "Answers, shortcuts, and docs\u2014same neon language as the product." }), _jsx(Section, { title: "FAQ", accent: true, spacing: "default", children: _jsx(List, { items: faq }) }), _jsx(Section, { title: "Keyboard shortcuts", spacing: "default", children: _jsx(List, { items: shortcuts }) }), _jsx(Section, { title: "Contact support", spacing: "default", children: _jsx(List, { items: support }) }), _jsx(Section, { title: "Documentation", spacing: "default", children: _jsx(List, { items: docLinks }) })] }) }));
}
