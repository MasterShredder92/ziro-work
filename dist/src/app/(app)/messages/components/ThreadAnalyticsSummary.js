"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { deriveThreadAnalytics } from "./deriveThreadAnalytics";
function Metric({ label, value }) {
    return (_jsxs("li", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2", children: [_jsx("div", { className: "text-[11px] uppercase tracking-wide text-[var(--z-muted)]", children: label }), _jsx("div", { className: "mt-0.5 text-lg font-semibold text-[var(--z-fg)]", children: value })] }));
}
export function ThreadAnalyticsSummary({ open, onClose, messages, currentProfileId, }) {
    const analytics = useMemo(() => deriveThreadAnalytics(messages, currentProfileId), [messages, currentProfileId]);
    if (!open)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-[70] flex", role: "presentation", children: [_jsx("button", { type: "button", "aria-label": "Close analytics summary", className: "flex-1 bg-black/45", onClick: onClose }), _jsx("aside", { className: "h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-96", children: _jsxs("div", { className: "flex h-full flex-col", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Thread analytics" }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Summary" })] }), _jsx("button", { type: "button", className: "rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]", onClick: onClose, children: "Close" })] }), _jsx("div", { className: "min-h-0 flex-1 overflow-y-auto p-4", children: _jsxs("ul", { className: "space-y-2", children: [_jsx(Metric, { label: "Total messages", value: analytics.counts.totalMessages }), _jsx(Metric, { label: "Total edits", value: analytics.counts.editsTotal }), _jsx(Metric, { label: "Total deletes", value: analytics.counts.deletesTotal }), _jsx(Metric, { label: "Total reactions", value: analytics.counts.reactionsTotal }), _jsx(Metric, { label: "Total pins", value: analytics.counts.pinsTotal })] }) })] }) })] }));
}
