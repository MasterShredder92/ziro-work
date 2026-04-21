"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TransactionalPreview } from "@/components/email/TransactionalPreview";
import { cn, focusRingClassName } from "@/components/ui/utils";
const EVENT_TYPES = [
    "student_enrolled",
    "trial_scheduled",
    "invoice_overdue",
    "lead_followed_up",
    "custom",
];
const SAMPLE_JSON = `{
  "studentName": "Jamie Chen",
  "teacherName": "Riley Park",
  "familyName": "Chen household",
  "invoiceAmount": "$88",
  "studioName": "Harbor Music Lab",
  "trialDate": "Sunday, Apr 20",
  "lessonTime": "3:30 PM"
}`;
export function EmailPreviewClient() {
    const [eventType, setEventType] = React.useState(EVENT_TYPES[0]);
    const [rawPayload, setRawPayload] = React.useState(SAMPLE_JSON);
    const parsed = React.useMemo(() => {
        try {
            const data = JSON.parse(rawPayload);
            if (!data || typeof data !== "object" || Array.isArray(data)) {
                return { ok: false, error: "Payload must be a JSON object.", data: {} };
            }
            return { ok: true, error: null, data: data };
        }
        catch (_a) {
            return { ok: false, error: "Invalid JSON.", data: {} };
        }
    }, [rawPayload]);
    const payload = parsed.data;
    const error = parsed.ok ? null : parsed.error;
    return (_jsx(PageShell, { children: _jsxs("div", { className: "flex flex-col gap-[var(--z-space-8)]", children: [_jsx(PageHeader, { title: "Transactional email preview", subtitle: "Select an event type and merge tokens from sample JSON." }), _jsxs("div", { className: "grid grid-cols-1 gap-[var(--z-space-6)] lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]", children: [_jsxs(Card, { padding: "lg", radius: "md", variant: "elevated", className: "space-y-[var(--z-space-4)] border-[var(--z-border)]", children: [_jsxs("div", { className: "flex flex-col gap-[var(--z-space-2)]", children: [_jsx("label", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Event type" }), _jsx("select", { value: eventType, onChange: (e) => setEventType(e.target.value), className: cn("h-10 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] text-sm text-[var(--z-fg)]", "hover:border-[var(--z-border-2)]", focusRingClassName()), children: EVENT_TYPES.map((t) => (_jsx("option", { value: t, children: t }, t))) })] }), _jsxs("div", { className: "flex flex-col gap-[var(--z-space-2)]", children: [_jsx("label", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Sample payload (JSON)" }), _jsx("textarea", { value: rawPayload, onChange: (e) => setRawPayload(e.target.value), rows: 14, spellCheck: false, className: cn("min-h-[220px] w-full resize-y rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] py-[var(--z-space-3)] font-mono text-xs leading-relaxed text-[var(--z-fg)]", "hover:border-[var(--z-border-2)]", focusRingClassName()) })] }), error ? _jsx("p", { className: "text-xs font-semibold text-[var(--z-danger)]", children: error }) : null] }), _jsx(TransactionalPreview, { eventType: eventType, payload: payload })] })] }) }));
}
