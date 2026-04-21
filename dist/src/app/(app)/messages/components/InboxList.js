"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
    var _a;
    if ((_a = thread.counterpart) === null || _a === void 0 ? void 0 : _a.fullName)
        return thread.counterpart.fullName;
    if (thread.subject)
        return thread.subject;
    return "New conversation";
}
export function InboxList({ threads, totalUnread }) {
    const pathname = usePathname();
    const params = useSearchParams();
    const currentThreadId = params.get("thread");
    return (_jsxs("aside", { className: "flex h-full flex-col border-r border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Inbox" }), _jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: [threads.length, " thread", threads.length === 1 ? "" : "s", totalUnread > 0 ? ` · ${totalUnread} unread` : ""] })] }), threads.length === 0 ? (_jsx("div", { className: "flex flex-1 items-center justify-center px-6 py-12 text-center text-sm text-[var(--z-muted)]", children: "No conversations yet. Start a new message to get going." })) : (_jsx("ul", { className: "flex-1 divide-y divide-[var(--z-border)] overflow-y-auto", children: threads.map((thread) => {
                    const isActive = thread.id === currentThreadId;
                    return (_jsx("li", { children: _jsxs(Link, { href: `${pathname}?thread=${thread.id}`, scroll: false, className: `flex flex-col gap-1 px-4 py-3 transition hover:bg-[var(--z-surface-hover)] ${isActive
                                ? "bg-[var(--z-surface-hover)]"
                                : "bg-transparent"}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "truncate text-sm font-medium text-[var(--z-fg)]", children: threadLabel(thread) }), _jsx("span", { className: "shrink-0 text-xs text-[var(--z-muted)]", children: formatRelative(thread.lastMessageAt) })] }), thread.lastMessagePreview ? (_jsx("p", { className: "line-clamp-2 text-xs text-[var(--z-muted)]", children: thread.lastMessagePreview })) : (_jsx("p", { className: "text-xs italic text-[var(--z-muted)]", children: "No messages yet" })), thread.unreadCount > 0 ? (_jsxs("span", { className: "inline-flex w-fit items-center rounded-full bg-[var(--z-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--z-on-accent,white)]", children: [thread.unreadCount, " new"] })) : null] }) }, thread.id));
                }) }))] }));
}
