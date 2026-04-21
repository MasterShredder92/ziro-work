"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
const TOKEN_DEFAULTS = {
    studentName: "Alex Rivera",
    teacherName: "Jordan Lee",
    familyName: "Rivera household",
    invoiceAmount: "$120",
    studioName: "ZiroWork Studio",
    trialDate: "Saturday, Apr 19",
    lessonTime: "4:00 PM",
};
const SUBJECT_BY_EVENT = {
    student_enrolled: "Welcome {{studentName}} — you're in at {{studioName}}",
    trial_scheduled: "{{studentName}}, your trial is confirmed for {{trialDate}}",
    invoice_overdue: "Payment reminder: {{invoiceAmount}} for {{familyName}}",
    lead_followed_up: "{{teacherName}} followed up with {{studentName}}",
    default: "Update from {{studioName}}",
};
const BODY_BY_EVENT = {
    student_enrolled: "Hi {{studentName}},\n\nWe're thrilled to have you at {{studioName}}. Your teacher {{teacherName}} will see you at {{lessonTime}}.\n\n— The team",
    trial_scheduled: "Hi {{studentName}},\n\nThis confirms your trial on {{trialDate}}. Reply if you need to reschedule.\n\n{{studioName}}",
    invoice_overdue: "Hello {{familyName}},\n\nInvoice {{invoiceAmount}} is past due. Pay anytime from your portal.\n\nThanks,\n{{studioName}}",
    lead_followed_up: "Team note: {{teacherName}} reached out to {{studentName}}.\n\nNext steps will appear in your inbox.\n\n— {{studioName}}",
    default: "Hello {{studentName}},\n\nThere is an update for your account at {{studioName}}.\n\n— {{teacherName}}",
};
function pickTemplate(map, key, fallbackKey = "default") {
    var _a;
    return (_a = map[key]) !== null && _a !== void 0 ? _a : map[fallbackKey];
}
function tokenValue(key, payload) {
    const v = payload[key];
    if (typeof v === "string" && v.trim())
        return v;
    if (typeof v === "number")
        return String(v);
    return undefined;
}
export function applyMergeTokens(template, payload) {
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, rawKey) => {
        var _a;
        const key = String(rawKey).trim();
        const fromPayload = tokenValue(key, payload);
        if (fromPayload != null)
            return fromPayload;
        return (_a = TOKEN_DEFAULTS[key]) !== null && _a !== void 0 ? _a : `{{${key}}}`;
    });
}
export function TransactionalPreview({ eventType, payload }) {
    const subjectTpl = pickTemplate(SUBJECT_BY_EVENT, eventType);
    const bodyTpl = pickTemplate(BODY_BY_EVENT, eventType);
    const subject = React.useMemo(() => applyMergeTokens(subjectTpl, payload), [subjectTpl, payload]);
    const body = React.useMemo(() => applyMergeTokens(bodyTpl, payload), [bodyTpl, payload]);
    const usedKeys = React.useMemo(() => {
        const keys = new Set();
        const re = /\{\{\s*([\w.]+)\s*\}\}/g;
        let m;
        const scan = (s) => {
            re.lastIndex = 0;
            while ((m = re.exec(s)) !== null)
                keys.add(m[1]);
        };
        scan(subjectTpl);
        scan(bodyTpl);
        return [...keys];
    }, [subjectTpl, bodyTpl]);
    return (_jsxs("div", { className: "space-y-[var(--z-space-4)]", children: [_jsxs(Card, { padding: "md", radius: "md", variant: "default", className: "border-[color-mix(in_oklab,var(--z-accent),transparent_78%)]", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Subject" }), _jsx("p", { className: "mt-1 text-sm font-semibold text-[var(--z-fg)]", children: subject })] }), _jsxs(Card, { padding: "md", radius: "md", variant: "elevated", className: "border-[var(--z-border)]", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Body preview" }), _jsx("div", { className: "mt-[var(--z-space-3)] whitespace-pre-wrap text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_14%)]", children: body })] }), _jsx("div", { className: "flex max-h-24 flex-wrap gap-2 overflow-y-auto", children: usedKeys.map((k) => (_jsxs(Badge, { variant: "neutral", className: "max-w-[220px] truncate", children: [`{{${k}}}`, " \u2192 ", applyMergeTokens(`{{${k}}}`, payload)] }, k))) })] }));
}
