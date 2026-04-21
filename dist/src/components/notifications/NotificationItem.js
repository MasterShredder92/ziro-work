"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Activity, Bell, ClipboardList, CreditCard, GraduationCap, Sparkles, UserCircle, } from "lucide-react";
import { cn, focusRingClassName } from "@/components/ui/utils";
function prettyEventType(type) {
    return type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
function formatWhen(iso) {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime()))
        return "";
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(d);
}
function summarizePayload(event) {
    const p = event.payload;
    if (!p || typeof p !== "object")
        return "System activity logged.";
    const keys = Object.keys(p);
    if (keys.length === 0)
        return "No additional detail.";
    const preview = keys
        .slice(0, 3)
        .map((k) => `${k}: ${JSON.stringify(p[k])}`)
        .join(" · ");
    return preview.length > 140 ? `${preview.slice(0, 137)}…` : preview;
}
function isLifecycleTransition(event) {
    if (event.entity_type === "lifecycle")
        return true;
    const t = event.event_type.toLowerCase();
    return (t.includes("lifecycle") ||
        t.includes("student_stage") ||
        t.includes("stage_changed"));
}
function pickIcon(event) {
    const t = event.event_type.toLowerCase();
    if (t.includes("invoice") || t.includes("payment") || t.includes("paid")) {
        return CreditCard;
    }
    if (t.includes("enroll") || t.includes("student")) {
        return GraduationCap;
    }
    if (t.includes("lead") || t.includes("trial")) {
        return UserCircle;
    }
    if (t.includes("kpi")) {
        return Sparkles;
    }
    if (t.includes("task") || t.includes("queue")) {
        return ClipboardList;
    }
    if (t.includes("notify") || t.includes("nudge")) {
        return Bell;
    }
    return Activity;
}
export function NotificationItem({ event, read, onActivate }) {
    const lifecycle = isLifecycleTransition(event);
    const IconGlyph = pickIcon(event);
    return (_jsxs("button", { type: "button", onClick: () => onActivate === null || onActivate === void 0 ? void 0 : onActivate(String(event.id)), className: cn("flex w-full items-start gap-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-left transition-colors", "hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:bg-[color-mix(in_oklab,var(--z-surface),white_3%)]", read && "opacity-60", focusRingClassName()), children: [_jsx("div", { className: cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)]", lifecycle &&
                    "border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] text-[var(--z-accent)] shadow-[0_0_12px_-4px_color-mix(in_oklab,var(--z-accent),transparent_40%)]"), children: React.createElement(IconGlyph, { className: "h-4 w-4", "aria-hidden": true }) }), _jsxs("div", { className: "min-w-0 flex-1 space-y-[var(--z-space-2)]", children: [_jsxs("div", { className: "flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1", children: [_jsx("span", { className: "text-sm font-semibold text-[var(--z-fg)]", children: prettyEventType(event.event_type) }), _jsx("time", { className: "text-xs font-medium tabular-nums text-[var(--z-muted)]", dateTime: event.created_at, children: formatWhen(event.created_at) })] }), _jsx("p", { className: "text-xs leading-relaxed text-[var(--z-muted)]", children: summarizePayload(event) })] })] }));
}
