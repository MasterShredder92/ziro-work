"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import * as React from "react";
import { EmailTemplateCard } from "@/components/email/EmailTemplateCard";
import { EmailEditor } from "@/components/email/EmailEditor";
import { TransactionalPreview } from "@/components/email/TransactionalPreview";
const DEMO = {
    id: "sandbox",
    title: "Sandbox transactional",
    description: "Visual QA for editor + preview.",
    category: "Marketing",
    body: "Hi {{studentName}},\n\nThis is a sandbox email for {{studioName}}.",
};
export default function SandboxEmailPage() {
    const [tpl, setTpl] = React.useState(DEMO);
    const payload = {
        studentName: "Taylor Kim",
        studioName: "Neon Row Music",
    };
    return (_jsxs("div", { className: "space-y-[var(--z-space-8)]", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "Email sandbox" }), _jsx(Link, { className: "text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox", children: "Back" })] }), _jsxs("section", { className: "grid grid-cols-1 gap-[var(--z-space-4)] lg:grid-cols-2", children: [_jsx(EmailTemplateCard, { title: tpl.title, description: tpl.description, category: tpl.category, selected: true }), _jsx(EmailEditor, { template: tpl, onChange: setTpl })] }), _jsxs("section", { className: "space-y-[var(--z-space-3)]", children: [_jsx("h2", { className: "text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Transactional preview" }), _jsx(TransactionalPreview, { eventType: "student_enrolled", payload: payload })] })] }));
}
