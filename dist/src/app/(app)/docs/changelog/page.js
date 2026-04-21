import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
export const dynamic = "force-dynamic";
const CHANGELOG = [
    {
        version: "1.4.0",
        date: "April 20, 2026",
        notes: [
            "Agents now execute actions directly — Sid can update student records, Star can update leads and send emails, Bub can query invoices.",
            "Event bus wired: lead.created, student.enrolled, agreement.signed, and invoice.created now emit to the events table.",
            "Cancel Session added to mobile schedule view.",
            "Agent page assignments locked — each agent now lives only on pages relevant to their role.",
            "Mobile keyboard layout fixed in agent chat panel.",
            "Dead dashboard Ask buttons fixed — all 7 agents now respond correctly.",
        ],
    },
    {
        version: "1.3.0",
        date: "April 18, 2026",
        notes: [
            "Agent OS launched — Ziro, Ruby, Sid, Stewie, Star, Vader, and Bub are live.",
            "Multi-location schedule grid with teacher columns.",
            "Lifecycle pipeline with auto-advance logic.",
            "Billing integration with Square.",
        ],
    },
];
export default function ChangelogPage() {
    return (_jsxs("div", { className: "mx-auto max-w-3xl space-y-8 py-10 px-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Link, { href: "/docs", className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "\u2190 Docs" }), _jsx("h1", { className: "text-2xl font-bold text-[var(--z-fg)]", children: "Changelog" })] }), _jsx("div", { className: "space-y-10", children: CHANGELOG.map((release) => (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-baseline gap-3", children: [_jsxs("span", { className: "text-base font-bold text-[var(--z-fg)]", children: ["v", release.version] }), _jsx("span", { className: "text-xs text-[var(--z-muted)]", children: release.date })] }), _jsx("ul", { className: "space-y-2", children: release.notes.map((note, i) => (_jsxs("li", { className: "flex gap-2 text-sm text-[var(--z-fg-muted)]", children: [_jsx("span", { className: "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--z-accent)]" }), note] }, i))) })] }, release.version))) })] }));
}
