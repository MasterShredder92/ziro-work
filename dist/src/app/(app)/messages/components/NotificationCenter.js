import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
export function NotificationCenter({ badge, unread, threads, }) {
    var _a;
    const unreadThreads = threads
        .filter((t) => t.unreadCount > 0)
        .slice(0, 8);
    const byChannel = {};
    for (const t of unread.threads) {
        byChannel[t.channelType] =
            ((_a = byChannel[t.channelType]) !== null && _a !== void 0 ? _a : 0) + t.unreadCount;
    }
    return (_jsxs("aside", { className: "flex flex-col gap-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("header", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Notifications" }), _jsxs("span", { className: "text-[10px] uppercase tracking-wide text-[var(--z-muted)]", children: [badge.totalUnread, " total"] })] }), _jsxs("dl", { className: "grid grid-cols-3 gap-2 text-xs", children: [_jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] p-2", children: [_jsx("dt", { className: "text-[10px] uppercase text-[var(--z-muted)]", children: "Unread" }), _jsx("dd", { className: "text-sm font-semibold text-[var(--z-fg)]", children: badge.totalUnread })] }), _jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] p-2", children: [_jsx("dt", { className: "text-[10px] uppercase text-[var(--z-muted)]", children: "Mentions" }), _jsx("dd", { className: "text-sm font-semibold text-[var(--z-fg)]", children: badge.mentions })] }), _jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] p-2", children: [_jsx("dt", { className: "text-[10px] uppercase text-[var(--z-muted)]", children: "Alerts" }), _jsx("dd", { className: "text-sm font-semibold text-[var(--z-fg)]", children: badge.alerts })] })] }), unreadThreads.length === 0 ? (_jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "You are all caught up." })) : (_jsx("ul", { className: "flex flex-col divide-y divide-[var(--z-border)]", children: unreadThreads.map((t) => {
                    var _a;
                    return (_jsx("li", { children: _jsxs(Link, { href: `/messages/threads/${t.id}`, className: "flex items-center justify-between gap-2 py-2 text-xs hover:bg-[var(--z-surface-hover)]", children: [_jsx("span", { className: "truncate text-[var(--z-fg)]", children: (_a = t.subject) !== null && _a !== void 0 ? _a : "Conversation" }), _jsx("span", { className: "shrink-0 rounded-full bg-[var(--z-accent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--z-on-accent,white)]", children: t.unreadCount })] }) }, t.id));
                }) })), Object.keys(byChannel).length > 0 ? (_jsxs("footer", { className: "text-[10px] text-[var(--z-muted)]", children: ["By channel:", " ", Object.entries(byChannel)
                        .map(([ch, n]) => `${ch}: ${n}`)
                        .join(" · ")] })) : null] }));
}
