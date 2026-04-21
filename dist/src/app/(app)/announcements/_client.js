"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { HubLink } from "@/components/publishing/HubLink";
import { Card } from "@/components/ui/Card";
import { AnnouncementComposer } from "@/components/announcements/AnnouncementComposer";
import { cn, focusRingClassName } from "@/components/ui/utils";
const STORAGE_KEY = "ziro.announcementDraft.v1";
const EMPTY = {
    title: "",
    body: "",
    ctaLabel: "",
    ctaUrl: "",
};
function loadDraft() {
    if (typeof window === "undefined")
        return EMPTY;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return EMPTY;
        const parsed = JSON.parse(raw);
        return {
            title: typeof parsed.title === "string" ? parsed.title : "",
            body: typeof parsed.body === "string" ? parsed.body : "",
            ctaLabel: typeof parsed.ctaLabel === "string" ? parsed.ctaLabel : "",
            ctaUrl: typeof parsed.ctaUrl === "string" ? parsed.ctaUrl : "",
        };
    }
    catch (_a) {
        return EMPTY;
    }
}
export function AnnouncementsClient() {
    const [draft, setDraft] = React.useState(EMPTY);
    React.useEffect(() => {
        queueMicrotask(() => setDraft(loadDraft()));
    }, []);
    const persist = React.useCallback((next) => {
        setDraft(next);
        if (typeof window === "undefined")
            return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }, []);
    return (_jsx(PageShell, { children: _jsxs("div", { className: "flex flex-col gap-[var(--z-space-8)]", children: [_jsxs("div", { className: "flex flex-col gap-[var(--z-space-3)]", children: [_jsx(PageHeader, { title: "Announcements", subtitle: "Compose in-app announcements \u2014 drafts stay on this device." }), _jsx(HubLink, { label: "Back to Publishing Hub", href: "/publishing-hub" })] }), _jsxs("div", { className: "grid grid-cols-1 gap-[var(--z-space-6)] xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]", children: [_jsx(AnnouncementComposer, { draft: draft, onSave: persist }), _jsxs(Card, { padding: "lg", radius: "md", variant: "elevated", className: "border-[color-mix(in_oklab,var(--z-accent),transparent_78%)]", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Preview" }), _jsx("h3", { className: "mt-[var(--z-space-3)] text-lg font-extrabold tracking-tight text-[var(--z-fg)]", children: draft.title || "Untitled announcement" }), _jsx("p", { className: "mt-[var(--z-space-3)] whitespace-pre-wrap text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_18%)]", children: draft.body || "Start typing to preview your message." }), draft.ctaLabel && draft.ctaUrl ? (_jsx("div", { className: "mt-[var(--z-space-5)]", children: _jsx(Link, { href: draft.ctaUrl, className: cn("inline-flex h-8 items-center justify-center rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-3 text-xs font-semibold text-black", "hover:bg-[color-mix(in_oklab,var(--z-accent),white_10%)]", focusRingClassName()), children: draft.ctaLabel }) })) : null] })] })] }) }));
}
