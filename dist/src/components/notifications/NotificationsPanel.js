"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Drawer } from "@/components/ui/Drawer";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useNotifications } from "@/components/notifications/notificationsContext";
export function NotificationsPanel() {
    const { panelOpen, closePanel, events, markAllRead, markRead, isEventRead, loadMoreEvents, hasMoreEvents, eventsLoading, } = useNotifications();
    const sentinelRef = React.useRef(null);
    React.useEffect(() => {
        if (!panelOpen)
            return undefined;
        const el = sentinelRef.current;
        if (!el)
            return undefined;
        const obs = new IntersectionObserver((entries) => {
            const hit = entries.some((e) => e.isIntersecting);
            if (hit)
                loadMoreEvents();
        }, { root: null, rootMargin: "140px", threshold: 0 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [loadMoreEvents, panelOpen, events.length]);
    return (_jsxs(Drawer, { open: panelOpen, onClose: closePanel, title: "Notifications", children: [_jsxs("div", { className: "mb-[var(--z-space-4)] flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [_jsx("p", { className: "text-xs leading-relaxed text-[var(--z-muted)]", children: "Recent tenant events \u2014 lifecycle moves, billing, agents, and risk signals." }), _jsx("button", { type: "button", onClick: markAllRead, className: "shrink-0 text-xs font-semibold text-[var(--z-accent)] hover:underline", children: "Mark all read" })] }), events.length === 0 && !eventsLoading ? (_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "No recent events for this tenant." })) : (_jsxs("div", { className: "space-y-[var(--z-space-3)] pb-[var(--z-space-6)]", children: [events.map((event) => (_jsx(NotificationItem, { event: event, read: isEventRead(String(event.id)), onActivate: (id) => markRead(id) }, String(event.id)))), _jsx("div", { ref: sentinelRef, className: "h-4 w-full shrink-0", "aria-hidden": true }), eventsLoading ? (_jsx("p", { className: "text-center text-xs text-[var(--z-muted)]", children: "Loading\u2026" })) : null, !hasMoreEvents && events.length > 0 ? (_jsx("p", { className: "text-center text-xs text-[var(--z-muted)]", children: "End of feed" })) : null] }))] }));
}
