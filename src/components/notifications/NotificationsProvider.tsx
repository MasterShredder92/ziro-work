"use client";

import * as React from "react";
import { useEvents } from "@/hooks/data/useEvents";
import type { EventLog } from "@/lib/data/models";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";
import {
  NotificationsContext,
  type NotificationsContextValue,
} from "@/components/notifications/notificationsContext";

const READ_STORAGE_KEY = "ziro-work.notifications.read";
const PAGE_SIZE = 24;
const MAX_PAGES = 24;

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x) => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]));
}

function mergeById(prev: EventLog[], next: EventLog[]): EventLog[] {
  const map = new Map<string, EventLog>();
  for (const e of prev) map.set(String(e.id), e);
  for (const e of next) map.set(String(e.id), e);
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export type NotificationsProviderProps = {
  tenantId: string;
  children: React.ReactNode;
};

export function NotificationsProvider({ tenantId, children }: NotificationsProviderProps) {
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [readIds, setReadIds] = React.useState<Set<string>>(() =>
    typeof window === "undefined" ? new Set() : loadReadIds(),
  );
  const [page, setPage] = React.useState(1);
  const [mergedEvents, setMergedEvents] = React.useState<EventLog[]>([]);
  const loadingMoreRef = React.useRef(false);

  React.useEffect(() => {
    setPage(1);
    setMergedEvents([]);
    loadingMoreRef.current = false;
  }, [tenantId]);

  const eventsQuery = useEvents(
    {
      tenantId,
      page: { mode: "offset", page, pageSize: PAGE_SIZE },
    },
    { enabled: tenantId.length > 0 },
  );

  React.useEffect(() => {
    const data = eventsQuery.data;
    if (!data) return;
    queueMicrotask(() => {
      if (data.items.length) {
        setMergedEvents((prev) => mergeById(prev, data.items));
      }
      loadingMoreRef.current = false;
    });
  }, [eventsQuery.data]);

  const hasMoreEvents =
    (eventsQuery.data?.items.length ?? 0) === PAGE_SIZE && page < MAX_PAGES;

  const loadMoreEvents = React.useCallback(() => {
    if (!hasMoreEvents || eventsQuery.isLoading || loadingMoreRef.current || page >= MAX_PAGES) {
      return;
    }
    loadingMoreRef.current = true;
    setPage((p) => p + 1);
  }, [eventsQuery.isLoading, hasMoreEvents, page]);

  React.useEffect(() => {
    if (!tenantId) return undefined;
    const id = window.setInterval(() => {
      eventsQuery.reload();
    }, 50_000);
    return () => window.clearInterval(id);
    // reload identity is stable enough for polling; avoid resubscribing on every query tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const unreadCount = React.useMemo(() => {
    return mergedEvents.filter((e) => !readIds.has(String(e.id))).length;
  }, [mergedEvents, readIds]);

  const markRead = React.useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      persistReadIds(next);
      return next;
    });
  }, []);

  const markAllRead = React.useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const e of mergedEvents) next.add(String(e.id));
      persistReadIds(next);
      return next;
    });
  }, [mergedEvents]);

  const isEventRead = React.useCallback((id: string) => readIds.has(id), [readIds]);

  const openPanel = React.useCallback(() => {
    setPanelOpen(true);
  }, []);

  const closePanel = React.useCallback(() => {
    setPanelOpen(false);
  }, []);

  const value: NotificationsContextValue = React.useMemo(
    () => ({
      events: mergedEvents,
      unreadCount,
      isEventRead,
      panelOpen,
      openPanel,
      closePanel,
      markAllRead,
      markRead,
      loadMoreEvents,
      hasMoreEvents,
      eventsLoading: eventsQuery.isLoading,
    }),
    [
      closePanel,
      eventsQuery.isLoading,
      hasMoreEvents,
      isEventRead,
      loadMoreEvents,
      markAllRead,
      markRead,
      mergedEvents,
      openPanel,
      panelOpen,
      unreadCount,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <NotificationsPanel />
    </NotificationsContext.Provider>
  );
}
