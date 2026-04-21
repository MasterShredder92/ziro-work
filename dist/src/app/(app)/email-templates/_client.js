"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { HubLink } from "@/components/publishing/HubLink";
import { EmailTemplateCard } from "@/components/email/EmailTemplateCard";
import { EmailEditor } from "@/components/email/EmailEditor";
const SEED = [
    {
        id: "tpl-onb-1",
        title: "Welcome to the studio",
        description: "Warm intro after enrollment with next steps.",
        category: "Onboarding",
        body: "Hi {{studentName}},\n\nWelcome to {{studioName}}. Your first lesson is booked with {{teacherName}}.",
    },
    {
        id: "tpl-life-1",
        title: "Lifecycle nudge",
        description: "Gentle reminder when a student stalls in onboarding.",
        category: "Lifecycle",
        body: "Hi {{studentName}},\n\nWe noticed you have not completed your profile. Tap below to finish in under a minute.",
    },
    {
        id: "tpl-bill-1",
        title: "Invoice issued",
        description: "Sent when a new invoice is created.",
        category: "Billing",
        body: "Hello {{familyName}},\n\nA new invoice for {{invoiceAmount}} is ready. View and pay from your portal.",
    },
    {
        id: "tpl-win-1",
        title: "We miss you",
        description: "Win-back outreach for paused students.",
        category: "Win-back",
        body: "Hi {{studentName}},\n\nIt has been a while since your last lesson at {{studioName}}. Here is a special offer to return.",
    },
    {
        id: "tpl-mkt-1",
        title: "Monthly spotlight",
        description: "Newsletter-style highlight of studio programs.",
        category: "Marketing",
        body: "Hello families,\n\nThis month we are featuring {{teacherName}} and new group classes. Read more inside.",
    },
];
export function EmailTemplatesClient() {
    var _a, _b;
    const [templates, setTemplates] = React.useState(SEED);
    const [selectedId, setSelectedId] = React.useState((_b = (_a = SEED[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "");
    const current = React.useMemo(() => { var _a; return (_a = templates.find((t) => t.id === selectedId)) !== null && _a !== void 0 ? _a : templates[0]; }, [templates, selectedId]);
    return (_jsx(PageShell, { children: _jsxs("div", { className: "flex flex-col gap-[var(--z-space-8)]", children: [_jsxs("div", { className: "flex flex-col gap-[var(--z-space-3)]", children: [_jsx(PageHeader, { title: "Email Templates", subtitle: "Charcoal + neon system emails \u2014 wire to your ESP when ready." }), _jsx(HubLink, { label: "Back to Publishing Hub", href: "/publishing-hub" })] }), _jsxs("div", { className: "grid grid-cols-1 gap-[var(--z-space-6)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]", children: [_jsx("div", { className: "grid grid-cols-1 gap-[var(--z-space-3)] sm:grid-cols-2", children: templates.map((t) => (_jsx(EmailTemplateCard, { title: t.title, description: t.description, category: t.category, selected: t.id === selectedId, onSelect: () => setSelectedId(t.id) }, t.id))) }), current ? (_jsx(EmailEditor, { template: current, onChange: (next) => {
                                setTemplates((prev) => prev.map((x) => (x.id === next.id ? next : x)));
                            } })) : null] })] }) }));
}
