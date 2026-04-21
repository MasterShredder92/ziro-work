"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ChangelogEntry } from "@/components/changelog/ChangelogEntry";
const DRAFT_KEY = "ziro.releaseDraft";
export function ReleaseNotesAdminClient() {
    const [version, setVersion] = React.useState("0.5.0");
    const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
    const [highlightsText, setHighlightsText] = React.useState("First highlight\nSecond highlight");
    const [preview, setPreview] = React.useState(null);
    React.useEffect(() => {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw)
                return;
            const parsed = JSON.parse(raw);
            if (parsed === null || parsed === void 0 ? void 0 : parsed.version)
                setVersion(parsed.version);
            if (parsed === null || parsed === void 0 ? void 0 : parsed.date)
                setDate(parsed.date);
            if (Array.isArray(parsed === null || parsed === void 0 ? void 0 : parsed.highlights))
                setHighlightsText(parsed.highlights.join("\n"));
        }
        catch (_a) {
            /* ignore */
        }
    }, []);
    const onSubmit = React.useCallback(() => {
        const highlights = highlightsText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        const draft = { version, date, highlights };
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        }
        catch (_a) {
            /* ignore */
        }
        setPreview(draft);
    }, [version, date, highlightsText]);
    return (_jsxs(PageShell, { title: "Release notes", children: [_jsx("div", { className: "mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: _jsx(Link, { className: "text-[var(--z-accent)] hover:underline", href: "/settings/permissions", children: "\u2190 Permissions" }) }), _jsx(PageHeader, { title: "Release notes automation", subtitle: "Drafts stay in localStorage\u2014wire to CI when you are ready to publish." }), _jsxs("div", { className: "mt-[var(--z-space-8)] grid grid-cols-1 gap-[var(--z-space-8)] lg:grid-cols-2", children: [_jsx(Section, { title: "Composer", accent: true, spacing: "tight", children: _jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "space-y-[var(--z-space-4)]", children: [_jsx(Input, { label: "Version", value: version, onChange: (e) => setVersion(e.target.value) }), _jsx(Input, { label: "Date", type: "date", value: date, onChange: (e) => setDate(e.target.value) }), _jsxs("div", { className: "flex flex-col gap-[var(--z-space-2)]", children: [_jsx("label", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Highlights (one per line)" }), _jsx("textarea", { className: "min-h-[140px] w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] py-[var(--z-space-3)] text-sm text-[var(--z-fg)]", value: highlightsText, onChange: (e) => setHighlightsText(e.target.value) })] }), _jsx(Button, { type: "button", variant: "primary", size: "md", onClick: onSubmit, children: "Save draft to browser" })] }) }), _jsx(Section, { title: "Preview", spacing: "tight", children: preview ? (_jsx(ChangelogEntry, { version: preview.version, date: preview.date, items: preview.highlights })) : (_jsx(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "text-sm text-[var(--z-muted)]", children: "Submit the form to render a ChangelogEntry from your draft." })) })] })] }));
}
