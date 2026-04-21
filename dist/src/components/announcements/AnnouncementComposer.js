"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn, focusRingClassName } from "@/components/ui/utils";
export function AnnouncementComposer({ draft, onSave }) {
    const [local, setLocal] = React.useState(draft);
    React.useEffect(() => {
        setLocal(draft);
    }, [draft]);
    return (_jsxs("div", { className: "space-y-[var(--z-space-4)]", children: [_jsx(Input, { label: "Title", value: local.title, onChange: (e) => setLocal((d) => (Object.assign(Object.assign({}, d), { title: e.target.value }))) }), _jsxs("div", { className: "flex flex-col gap-[var(--z-space-2)]", children: [_jsx("label", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Body" }), _jsx("textarea", { value: local.body, onChange: (e) => setLocal((d) => (Object.assign(Object.assign({}, d), { body: e.target.value }))), rows: 8, className: cn("min-h-[160px] w-full resize-y rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] py-[var(--z-space-3)] text-sm leading-relaxed text-[var(--z-fg)]", "hover:border-[var(--z-border-2)]", focusRingClassName()) })] }), _jsxs("div", { className: "grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-2", children: [_jsx(Input, { label: "CTA label", value: local.ctaLabel, onChange: (e) => setLocal((d) => (Object.assign(Object.assign({}, d), { ctaLabel: e.target.value }))) }), _jsx(Input, { label: "CTA URL", value: local.ctaUrl, onChange: (e) => setLocal((d) => (Object.assign(Object.assign({}, d), { ctaUrl: e.target.value }))), placeholder: "https://" })] }), _jsx(Button, { type: "button", onClick: () => onSave(local), children: "Save draft" })] }));
}
