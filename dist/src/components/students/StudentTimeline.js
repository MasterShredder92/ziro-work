"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle, Bot, CalendarDays, GitBranch, Receipt } from "lucide-react";
import { Timeline } from "@/components/ui/Timeline";
import { cn } from "@/components/ui/utils";
function classifyEvent(type) {
    const t = type.toLowerCase();
    if (t === "stage_transition" || t === "student_stage_changed")
        return "stage";
    if (t.includes("invoice") || t === "invoice")
        return "invoice";
    if (t.includes("attendance") || t.includes("lesson") || t.includes("present"))
        return "attendance";
    if (t.includes("risk") || t.includes("churn") || t.includes("at_risk"))
        return "risk";
    if (t.includes("agent") || t.includes("tool") || t.includes("emit"))
        return "agent";
    return "neutral";
}
function iconFor(kind) {
    const base = "h-4 w-4";
    switch (kind) {
        case "stage":
            return _jsx(GitBranch, { className: cn(base, "text-[var(--z-accent)]"), "aria-hidden": true });
        case "invoice":
            return _jsx(Receipt, { className: cn(base, "text-[var(--z-accent)]"), "aria-hidden": true });
        case "attendance":
            return _jsx(CalendarDays, { className: cn(base, "text-[var(--z-accent)]"), "aria-hidden": true });
        case "risk":
            return _jsx(AlertTriangle, { className: cn(base, "text-[var(--z-warning)]"), "aria-hidden": true });
        case "agent":
            return _jsx(Bot, { className: cn(base, "text-[var(--z-accent)]"), "aria-hidden": true });
        default:
            return _jsx("div", { className: cn(base, "rounded-full bg-[var(--z-border)]"), "aria-hidden": true });
    }
}
function formatWhen(iso) {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime()))
        return iso;
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
}
export function StudentTimeline({ events, className }) {
    const items = events.map((e, idx) => {
        const kind = classifyEvent(e.type);
        const payload = e.payload ? JSON.stringify(e.payload) : undefined;
        return {
            id: `${e.occurredAt}-${e.type}-${idx}`,
            icon: iconFor(kind),
            title: e.title,
            meta: formatWhen(e.occurredAt),
            description: (_jsxs("span", { className: "block space-y-1", children: [_jsx("span", { className: "font-mono text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: e.type }), payload && payload !== "{}" ? (_jsx("span", { className: "block font-mono text-[10px] text-[color-mix(in_oklab,var(--z-fg),transparent_35%)]", children: payload.length > 220 ? `${payload.slice(0, 220)}…` : payload })) : null] })),
            accent: kind === "stage" || kind === "risk",
        };
    });
    return (_jsx("div", { className: cn("min-w-0", className), children: _jsx(Timeline, { items: items }) }));
}
