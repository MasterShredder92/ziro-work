"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EventLog } from "@/lib/data/models/events";
import { useEvents } from "@/hooks/data";
import { List } from "@/components/ui/List";
import { DASHBOARD_TENANT_ID } from "./constants";
import { ActivityFeedItem } from "./ActivityFeedItem";
import { daysAgoIso } from "./dashboardFormat";

const PAGE_SIZE = 25;
const MAX_PAGES = 24;

function mergeById(prev: EventLog[], next: EventLog[]): EventLog[] {
  const map = new Map<string, EventLog>();
  for (const e of prev) map.set(e.id, e);
  for (const e of next) map.set(e.id, e);
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export type ActivityFeedProps = {
  /** When false, omits the Activity heading row (parent section provides the title). */
  showTitle?: boolean;
};

export function ActivityFeed({ showTitle = true }: ActivityFeedProps) {
  const tenantId = DASHBOARD_TENANT_ID;
  const [page, setPage] = useState(1);
  const [merged, setMerged] = useState<EventLog[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  const params = useMemo(
    () => ({
      tenantId,
      page: { mode: "offset" as const, page, pageSize: PAGE_SIZE },
    }),
    [tenantId, page],
  );

  const { data, isLoading, error } = useEvents(params);

  useEffect(() => {
    if (!data) return;
    queueMicrotask(() => {
      if (data.items.length) {
        setMerged((prev) => mergeById(prev, data.items));
      }
      loadingMoreRef.current = false;
    });
  }, [data]);

  const hasMore = (data?.items.length ?? 0) === PAGE_SIZE && page < MAX_PAGES;

  const onLoadMore = useCallback(() => {
    if (!hasMore || isLoading || loadingMoreRef.current || page >= MAX_PAGES) return;
    loadingMoreRef.current = true;
    setPage((p) => p + 1);
  }, [hasMore, isLoading, page]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) onLoadMore();
      },
      { root: null, rootMargin: "120px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onLoadMore, merged.length]);

  const weekCut = daysAgoIso(7);
  const recentFirst = useMemo(() => {
    const recent = merged.filter((e) => new Date(e.created_at).toISOString() >= weekCut);
    const older = merged.filter((e) => new Date(e.created_at).toISOString() < weekCut);
    return { recent, older };
  }, [merged, weekCut]);

  const listItems = useMemo(() => {
    const ordered = [...recentFirst.recent, ...recentFirst.older];
    return ordered.map((event) => ({
      id: event.id,
      title: <ActivityFeedItem event={event} />,
    }));
  }, [recentFirst]);

  return (
    <section className={showTitle ? "space-y-[var(--z-space-4)]" : "space-y-3"}>
      {showTitle ? (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]">
            Activity
          </h2>
          <p className="text-xs text-[var(--z-muted)]">Last 7 days highlighted · scroll for older</p>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-[var(--z-danger)]">{error.message}</p>
      ) : listItems.length === 0 && !isLoading ? (
        <p className="text-sm text-[var(--z-muted)]">No events yet.</p>
      ) : (
        <>
          <List items={listItems} />
          <div ref={sentinelRef} className="h-6 w-full" aria-hidden />
          {isLoading ? (
            <p className="text-center text-xs text-[var(--z-muted)]">Loading…</p>
          ) : null}
        </>
      )}
    </section>
  );
}
