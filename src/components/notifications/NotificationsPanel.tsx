"use client";

import * as React from "react";
import { Drawer } from "@/components/ui/Drawer";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useNotifications } from "@/components/notifications/notificationsContext";

export function NotificationsPanel() {
  const {
    panelOpen,
    closePanel,
    events,
    markAllRead,
    markRead,
    isEventRead,
    loadMoreEvents,
    hasMoreEvents,
    eventsLoading,
  } = useNotifications();

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!panelOpen) return undefined;
    const el = sentinelRef.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) loadMoreEvents();
      },
      { root: null, rootMargin: "140px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMoreEvents, panelOpen, events.length]);

  return (
    <Drawer open={panelOpen} onClose={closePanel} title="Notifications">
      <div className="mb-[var(--z-space-4)] flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-xs leading-relaxed text-[var(--z-muted)]">
          Recent tenant events — lifecycle moves, billing, agents, and risk signals.
        </p>
        <button
          type="button"
          onClick={markAllRead}
          className="shrink-0 text-xs font-semibold text-[var(--z-accent)] hover:underline"
        >
          Mark all read
        </button>
      </div>

      {events.length === 0 && !eventsLoading ? (
        <p className="text-sm text-[var(--z-muted)]">No recent events for this tenant.</p>
      ) : (
        <div className="space-y-[var(--z-space-3)] pb-[var(--z-space-6)]">
          {events.map((event) => (
            <NotificationItem
              key={String(event.id)}
              event={event}
              read={isEventRead(String(event.id))}
              onActivate={(id) => markRead(id)}
            />
          ))}
          <div ref={sentinelRef} className="h-4 w-full shrink-0" aria-hidden />
          {eventsLoading ? (
            <p className="text-center text-xs text-[var(--z-muted)]">Loading…</p>
          ) : null}
          {!hasMoreEvents && events.length > 0 ? (
            <p className="text-center text-xs text-[var(--z-muted)]">End of feed</p>
          ) : null}
        </div>
      )}
    </Drawer>
  );
}
