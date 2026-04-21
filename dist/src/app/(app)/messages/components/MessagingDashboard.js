"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { useMemo, useState } from "react";
import { NewMessageModal } from "./NewMessageModal";
const statusOptions = [
    { id: "all", label: "All" },
    { id: "open", label: "Open" },
    { id: "archived", label: "Archived" },
    { id: "snoozed", label: "Snoozed" },
];
const channelOptions = [
    { id: "all", label: "All channels" },
    { id: "in_app", label: "In-app" },
    { id: "email", label: "Email" },
    { id: "sms", label: "SMS" },
    { id: "push", label: "Push" },
];
function formatRelative(ts) {
    if (!ts)
        return "";
    const then = new Date(ts).getTime();
    if (!Number.isFinite(then))
        return "";
    const diffMs = Date.now() - then;
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 1)
        return "just now";
    if (minutes < 60)
        return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    if (hours < 24)
        return `${hours}h`;
    const days = Math.round(hours / 24);
    if (days < 7)
        return `${days}d`;
    return new Date(ts).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}
function threadLabel(thread) {
    if (thread.subject && thread.subject.trim())
        return thread.subject;
    return "Conversation";
}
export function MessagingDashboard({ threads, unread, badge, currentProfileId, recipients, canWrite, }) {
    const [status, setStatus] = useState("open");
    const [channel, setChannel] = useState("all");
    const [search, setSearch] = useState("");
    const [showNewModal, setShowNewModal] = useState(false);
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return threads.filter((t) => {
            var _a, _b;
            if (status !== "all" && t.status !== status)
                return false;
            if (channel !== "all" && t.channelType !== channel)
                return false;
            if (!q)
                return true;
            const hay = `${(_a = t.subject) !== null && _a !== void 0 ? _a : ""} ${(_b = t.lastMessagePreview) !== null && _b !== void 0 ? _b : ""}`.toLowerCase();
            return hay.includes(q);
        });
    }, [threads, status, channel, search]);
    void currentProfileId;
    return (_jsxs("section", { className: "flex h-full flex-col gap-4", children: [_jsxs("header", { className: "flex flex-col gap-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("h1", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Messaging" }), _jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: [threads.length, " thread", threads.length === 1 ? "" : "s", " \u00B7", " ", unread.totalUnread, " unread", badge.mentions > 0 ? ` · ${badge.mentions} mentions` : "", badge.alerts > 0 ? ` · ${badge.alerts} alerts` : ""] })] }), canWrite ? (_jsx("button", { type: "button", onClick: () => setShowNewModal(true), className: "inline-flex items-center rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-sm font-semibold text-[var(--z-on-accent,white)] shadow-sm transition hover:brightness-110", children: "New message" })) : null] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsx("input", { type: "search", placeholder: "Search threads...", value: search, onChange: (e) => setSearch(e.target.value), className: "min-w-[200px] flex-1 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-1.5 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--z-accent)]" }), _jsx("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]", children: statusOptions.map((opt) => (_jsx("option", { value: opt.id, children: opt.label }, opt.id))) }), _jsx("select", { value: channel, onChange: (e) => setChannel(e.target.value), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]", children: channelOptions.map((opt) => (_jsx("option", { value: opt.id, children: opt.label }, opt.id))) })] }), filtered.length === 0 ? (_jsx("div", { className: "flex flex-1 items-center justify-center rounded-lg border border-dashed border-[var(--z-border)] p-10 text-center text-sm text-[var(--z-muted)]", children: "No threads match these filters." })) : (_jsx("ul", { className: "flex-1 divide-y divide-[var(--z-border)] overflow-y-auto rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: filtered.map((thread) => (_jsx("li", { children: _jsxs(Link, { href: `/messages/threads/${thread.id}`, className: "flex flex-col gap-1 px-4 py-3 transition hover:bg-[var(--z-surface-hover)]", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "truncate text-sm font-medium text-[var(--z-fg)]", children: threadLabel(thread) }), _jsx("span", { className: "shrink-0 text-xs text-[var(--z-muted)]", children: formatRelative(thread.lastMessageAt) })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-[var(--z-muted)]", children: [_jsx("span", { className: "inline-flex items-center rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide", children: thread.channelType }), thread.status !== "open" ? (_jsx("span", { className: "inline-flex items-center rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide", children: thread.status })) : null, thread.unreadCount > 0 ? (_jsxs("span", { className: "inline-flex items-center rounded-full bg-[var(--z-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--z-on-accent,white)]", children: [thread.unreadCount, " new"] })) : null] }), thread.lastMessagePreview ? (_jsx("p", { className: "line-clamp-2 text-xs text-[var(--z-muted)]", children: thread.lastMessagePreview })) : (_jsx("p", { className: "text-xs italic text-[var(--z-muted)]", children: "No messages yet" }))] }) }, thread.id))) })), showNewModal ? (_jsx(NewMessageModal, { recipients: recipients, onClose: () => setShowNewModal(false) })) : null] }));
}
