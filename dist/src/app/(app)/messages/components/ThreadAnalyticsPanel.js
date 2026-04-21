"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from "lucide-react";
import { useMemo } from "react";
import { deriveThreadAnalytics, } from "./deriveThreadAnalytics";
function formatDuration(ms) {
    if (ms == null)
        return "—";
    if (ms < 60000)
        return "<1m";
    const totalMinutes = Math.round(ms / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0)
        return `${days}d ${hours}h`;
    if (hours > 0)
        return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
function formatDateTime(iso) {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime()))
        return "Unknown";
    return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
function formatRate(value) {
    return value.toFixed(value < 10 ? 1 : 0);
}
function MetricCard({ label, value }) {
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] p-4", children: [_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: label }), _jsx("div", { className: "text-xl font-semibold text-[var(--z-fg)]", children: value })] }));
}
function MilestoneRow({ milestone }) {
    return (_jsxs("li", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2", children: [_jsx("p", { className: "text-sm font-medium text-[var(--z-fg)]", children: milestone.label }), _jsx("p", { className: "text-xs text-[var(--z-muted)]", children: formatDateTime(milestone.timestamp) })] }));
}
export function ThreadAnalyticsPanel({ open, onClose, messages, currentProfileId, }) {
    const analytics = useMemo(() => deriveThreadAnalytics(messages, currentProfileId), [messages, currentProfileId]);
    return (_jsx("aside", { className: `pointer-events-none absolute inset-y-0 right-0 z-30 w-full sm:w-80 ${open ? "" : "translate-x-full"} transform transition-transform duration-200 ease-out`, "aria-hidden": !open, children: _jsxs("div", { className: "pointer-events-auto flex h-full flex-col border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-[-10px_0_30px_rgba(0,0,0,0.18)]", children: [_jsxs("header", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Thread Analytics" }), _jsxs("button", { type: "button", onClick: onClose, className: "rounded-md border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]", children: [_jsx("span", { className: "sr-only", children: "Close analytics panel" }), _jsx(X, { className: "size-4", "aria-hidden": true })] })] }), _jsxs("div", { className: "flex-1 space-y-5 overflow-y-auto p-4", children: [_jsxs("section", { className: "space-y-2", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Overview" }), _jsxs("div", { className: "space-y-2", children: [_jsx(MetricCard, { label: "Total messages", value: analytics.counts.totalMessages }), _jsx(MetricCard, { label: "Messages with attachments", value: analytics.counts.messagesWithAttachments })] })] }), _jsxs("section", { className: "space-y-2", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Message Mix" }), _jsxs("div", { className: "space-y-2", children: [_jsx(MetricCard, { label: "Outbound", value: analytics.counts.outboundMessages }), _jsx(MetricCard, { label: "Inbound", value: analytics.counts.inboundMessages }), _jsx(MetricCard, { label: "System", value: analytics.counts.systemMessages }), _jsx(MetricCard, { label: "Template", value: analytics.counts.templateMessages }), _jsx(MetricCard, { label: "Test", value: analytics.counts.testMessages })] })] }), _jsxs("section", { className: "space-y-2", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Timing" }), _jsxs("div", { className: "space-y-2", children: [_jsx(MetricCard, { label: "Thread age", value: formatDuration(analytics.timing.threadAgeMs) }), _jsx(MetricCard, { label: "Avg inbound \u2192 outbound", value: formatDuration(analytics.timing.avgInboundToOutboundMs) }), _jsx(MetricCard, { label: "Avg outbound \u2192 inbound", value: formatDuration(analytics.timing.avgOutboundToInboundMs) }), _jsx(MetricCard, { label: "Longest gap", value: formatDuration(analytics.timing.longestGapMs) }), _jsx(MetricCard, { label: "First response time", value: formatDuration(analytics.timing.firstResponseMs) })] })] }), _jsxs("section", { className: "space-y-2", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Engagement" }), _jsxs("div", { className: "space-y-2", children: [_jsx(MetricCard, { label: "Days active", value: analytics.engagement.daysActive }), _jsx(MetricCard, { label: "Messages per day", value: formatRate(analytics.engagement.messagesPerDay) }), _jsx(MetricCard, { label: "Attachments per day", value: formatRate(analytics.engagement.attachmentsPerDay) }), _jsx(MetricCard, { label: "Templates per day", value: formatRate(analytics.engagement.templatesPerDay) }), _jsx(MetricCard, { label: "Test sends per day", value: formatRate(analytics.engagement.testSendsPerDay) })] })] }), _jsxs("section", { className: "space-y-2", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Channel Mix" }), _jsxs("div", { className: "space-y-2", children: [_jsx(MetricCard, { label: "Email", value: analytics.channels.email }), _jsx(MetricCard, { label: "SMS", value: analytics.channels.sms }), _jsx(MetricCard, { label: "Internal/system", value: analytics.channels.internalSystem }), Object.entries(analytics.channels.other).map(([channel, count]) => (_jsx(MetricCard, { label: `Other · ${channel}`, value: count }, channel)))] })] }), _jsxs("section", { className: "space-y-2", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: "Milestones" }), analytics.milestones.length === 0 ? (_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "No milestones yet." })) : (_jsx("ol", { className: "space-y-2", children: analytics.milestones.map((milestone) => (_jsx(MilestoneRow, { milestone: milestone }, milestone.key))) }))] })] })] }) }));
}
