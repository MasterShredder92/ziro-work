"use client";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import Link from "next/link";
import { List } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";
import { ChangelogEntry } from "@/components/changelog/ChangelogEntry";
import { CHANGELOG_ENTRIES } from "@/lib/changelog/entries";
export default function SandboxChangelogPage() {
    const items = CHANGELOG_ENTRIES.map((e) => ({
        id: e.version,
        title: e.version,
        description: e.date,
        action: _jsxs(Badge, { variant: "neutral", children: [e.highlights.length, " items"] }),
    }));
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "Changelog (sandbox)" }), _jsx(Link, { className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox", children: "Back" })] }), _jsx(List, { items: items }), _jsx("div", { className: "space-y-[var(--z-space-4)]", children: CHANGELOG_ENTRIES.map((e) => (_jsx(ChangelogEntry, { version: e.version, date: e.date, items: e.highlights }, e.version))) })] }));
}
