"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ThreadComposer } from "./ThreadComposer";
import { ThreadMessageList } from "./ThreadMessageList";
import { ThreadParticipantsPanel } from "./ThreadParticipantsPanel";
import { deriveThreadAnalytics } from "./deriveThreadAnalytics";
import { ThreadAnalyticsSummary } from "./ThreadAnalyticsSummary";
function formatRelativeTime(iso) {
    if (!iso)
        return "No activity yet";
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t))
        return "No activity yet";
    const deltaMs = Date.now() - t;
    const absMs = Math.abs(deltaMs);
    const suffix = deltaMs >= 0 ? "ago" : "from now";
    if (absMs < 60000)
        return "just now";
    if (absMs < 3600000)
        return `${Math.round(absMs / 60000)}m ${suffix}`;
    if (absMs < 86400000)
        return `${Math.round(absMs / 3600000)}h ${suffix}`;
    return `${Math.round(absMs / 86400000)}d ${suffix}`;
}
export function ThreadDetailClient({ thread, participants, messages, currentProfileId, senderNameLookup, templateOptions, canWrite, mergeFields, }) {
    var _a, _b;
    const [analyticsOpen, setAnalyticsOpen] = useState(false);
    const analytics = useMemo(() => deriveThreadAnalytics(messages, currentProfileId), [messages, currentProfileId]);
    const activityRelative = formatRelativeTime(thread.lastMessageAt);
    return (_jsxs("div", { className: "relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden", children: [_jsx("header", { className: "flex shrink-0 flex-col gap-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("h1", { className: "text-base font-semibold text-[var(--z-fg)]", children: (_a = thread.subject) !== null && _a !== void 0 ? _a : "Conversation" }), _jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: [participants.length, " participant", participants.length === 1 ? "" : "s", " \u00B7", " ", _jsx("span", { className: "uppercase tracking-wide", children: thread.channelType }), " \u00B7", " ", thread.status] }), _jsxs("p", { className: "text-[11px] text-[var(--z-muted)]", children: [analytics.counts.totalMessages, " messages \u00B7 ", participants.length, " participants \u00B7 Last activity ", activityRelative] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: () => {
                                        var _a;
                                        return (_a = document
                                            .getElementById("thread-participants-panel")) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }, className: "rounded-md border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]", children: "Participants" }), _jsx("button", { type: "button", onClick: () => setAnalyticsOpen((v) => !v), className: "rounded-md border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]", "aria-expanded": analyticsOpen, "aria-controls": "thread-analytics-panel", children: "Analytics" }), _jsx(Link, { href: "/messages", className: "rounded-md border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]", children: "Back" })] })] }) }), _jsx("div", { id: "thread-participants-panel", children: _jsx(ThreadParticipantsPanel, { participants: participants, threadChannelType: thread.channelType, contextType: thread.contextType, threadSubject: thread.subject }) }), _jsx(ThreadMessageList, { messages: messages, currentProfileId: currentProfileId, senderNameLookup: senderNameLookup }), _jsx(ThreadComposer, { threadId: thread.id, defaultChannel: thread.channelType, templates: templateOptions, mergeFields: mergeFields, threadSubject: (_b = thread.subject) !== null && _b !== void 0 ? _b : null, canWrite: canWrite }), _jsx(ThreadAnalyticsSummary, { open: analyticsOpen, onClose: () => setAnalyticsOpen(false), messages: messages, currentProfileId: currentProfileId })] }));
}
