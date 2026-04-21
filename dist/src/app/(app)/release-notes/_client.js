"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { HubLink } from "@/components/publishing/HubLink";
import { ReleaseEditor } from "@/components/release/ReleaseEditor";
import { ChangelogEntry } from "@/components/changelog/ChangelogEntry";
const STORAGE_KEY = "ziro.releaseNotesDraft.v1";
const DEFAULT_DRAFT = {
    version: "0.9.0",
    date: "Apr 17, 2026",
    items: ["Polished studio map interactions.", "Faster agent handoffs for enrollment tasks.", "Neon-tuned command palette."],
};
function loadDraft() {
    if (typeof window === "undefined")
        return DEFAULT_DRAFT;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return DEFAULT_DRAFT;
        const parsed = JSON.parse(raw);
        return {
            version: typeof parsed.version === "string" ? parsed.version : DEFAULT_DRAFT.version,
            date: typeof parsed.date === "string" ? parsed.date : DEFAULT_DRAFT.date,
            items: Array.isArray(parsed.items) ? parsed.items.filter((x) => typeof x === "string") : DEFAULT_DRAFT.items,
        };
    }
    catch (_a) {
        return DEFAULT_DRAFT;
    }
}
export function ReleaseNotesClient() {
    const [draft, setDraft] = React.useState(DEFAULT_DRAFT);
    React.useEffect(() => {
        queueMicrotask(() => setDraft(loadDraft()));
    }, []);
    const persist = React.useCallback((next) => {
        setDraft(next);
        if (typeof window === "undefined")
            return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }, []);
    return (_jsx(PageShell, { children: _jsxs("div", { className: "flex flex-col gap-[var(--z-space-8)]", children: [_jsxs("div", { className: "flex flex-col gap-[var(--z-space-3)]", children: [_jsx(PageHeader, { title: "Release Notes", subtitle: "Draft changelog entries locally \u2014 export to git when ready." }), _jsx(HubLink, { label: "Back to Publishing Hub", href: "/publishing-hub" })] }), _jsx(ReleaseEditor, { version: draft.version, date: draft.date, items: draft.items, onChange: (next) => persist(next) }), _jsx(ChangelogEntry, { version: draft.version, date: draft.date, items: draft.items })] }) }));
}
