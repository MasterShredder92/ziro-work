"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { EventLog } from "@/lib/data/models/events";
import { useEvents } from "@/hooks/data";
import {
  DollarSign,
  UserPlus,
  UserCheck,
  Music,
  Bell,
  RefreshCw,
  Calendar,
} from "lucide-react";

const DASHBOARD_TENANT_ID =
  process.env.NEXT_PUBLIC_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";

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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function eventTitle(event: EventLog): string {
  const t = event.event_type ?? "";
  const p = (event.payload ?? {}) as Record<string, unknown>;
  if (/payment|paid|invoice/.test(t)) return p.family_name ? `Invoice paid · ${p.family_name}` : "Invoice paid";
  if (/enroll/.test(t)) return p.student_name ? `Enrolled · ${p.student_name}` : "New enrollment";
  if (/lead|intake/.test(t)) return p.name ? `New lead · ${p.name}` : "New lead";
  if (/teacher_change|teacher/.test(t)) return "Teacher reassigned";
  if (/cancel/.test(t)) return "Cancellation";
  if (/trial/.test(t)) return "Trial scheduled";
  return t.replace(/_/g, " ");
}

function eventSubtitle(event: EventLog): string {
  return (event.event_type ?? "").replace(/_/g, " ");
}

function eventHref(event: EventLog): string | null {
  const t = event.event_type ?? "";
  const p = (event.payload ?? {}) as Record<string, unknown>;
  if (/payment|paid|invoice/.test(t)) {
    if (p.family_id) return `/crm/families/${p.family_id}`;
    return `/invoices`;
  }
  if (/enroll/.test(t)) {
    if (p.student_id) return `/students/${p.student_id}`;
    if (p.family_id) return `/crm/families/${p.family_id}`;
    return `/crm/families`;
  }
  if (/lead|intake/.test(t)) {
    if (p.lead_id) return `/crm/leads/${p.lead_id}`;
    return `/crm/leads`;
  }
  if (/teacher_change|teacher/.test(t)) {
    if (p.teacher_id) return `/crm/teachers/${p.teacher_id}`;
    return `/crm/teachers`;
  }
  if (/cancel/.test(t)) {
    if (p.student_id) return `/students/${p.student_id}`;
    if (p.family_id) return `/crm/families/${p.family_id}`;
    return null;
  }
  if (/trial/.test(t)) {
    if (p.student_id) return `/students/${p.student_id}`;
    return null;
  }
  return null;
}

function eventIcon(event: EventLog): React.ReactNode {
  const t = event.event_type ?? "";
  if (/payment|paid|invoice/.test(t)) return <DollarSign className="h-3.5 w-3.5" />;
  if (/enroll/.test(t)) return <UserCheck className="h-3.5 w-3.5" />;
  if (/lead|intake/.test(t)) return <UserPlus className="h-3.5 w-3.5" />;
  if (/teacher/.test(t)) return <RefreshCw className="h-3.5 w-3.5" />;
  if (/trial|schedule/.test(t)) return <Calendar className="h-3.5 w-3.5" />;
  if (/music|instrument/.test(t)) return <Music className="h-3.5 w-3.5" />;
  return <Bell className="h-3.5 w-3.5" />;
}

function eventAccent(event: EventLog): string {
  const t = event.event_type ?? "";
  if (/payment|paid/.test(t)) return "#00ff88";
  if (/enroll/.test(t)) return "#2563eb";
  if (/lead|intake/.test(t)) return "#7c3aed";
  if (/cancel/.test(t)) return "#ef4444";
  if (/trial/.test(t)) return "#d97706";
  return "#6366f1";
}

function EventRow({
  event,
  isRecent,
  accent,
  isLast,
}: {
  event: EventLog;
  isRecent: boolean;
  accent: string;
  isLast: boolean;
}) {
  const href = eventHref(event);
  const inner = (
    <div
      className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-150"
      style={{
        background: isRecent ? `${accent}08` : "var(--z-surface-2)",
        border: `1px solid ${isRecent ? accent + "20" : "var(--z-border)"}`,
        cursor: href ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        if (!href) return;
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.background = isRecent ? `${accent}12` : "var(--z-surface-hover)";
        e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.15)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.background = isRecent ? `${accent}08` : "var(--z-surface-2)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Timeline column */}
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        {/* Icon badge */}
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{
            background: `${accent}20`,
            color: accent,
            boxShadow: isRecent ? `0 0 10px ${accent}40` : undefined,
          }}
        >
          {eventIcon(event)}
        </div>
        {/* Connector line */}
        {!isLast && (
          <div
            className="mt-1 w-px flex-1"
            style={{
              background: `linear-gradient(to bottom, ${accent}30, transparent)`,
              minHeight: "12px",
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-0.5">
        <p className="truncate text-xs font-semibold" style={{ color: "var(--z-fg)" }}>
          {eventTitle(event)}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--z-muted)" }}>
          {eventSubtitle(event)}
        </p>
      </div>

      {/* Timestamp */}
      <span
        className="shrink-0 text-[10px] font-medium mt-0.5"
        style={{
          color: isRecent ? accent : "var(--z-muted)",
          textShadow: isRecent ? `0 0 8px ${accent}50` : undefined,
        }}
      >
        {timeAgo(event.created_at)}
      </span>
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

export function ActivityStream() {
  const tenantId = DASHBOARD_TENANT_ID;
  const [page, setPage] = useState(1);
  const [merged, setMerged] = useState<EventLog[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  const params = useMemo(
    () => ({ tenantId, page: { mode: "offset" as const, page, pageSize: PAGE_SIZE } }),
    [tenantId, page],
  );

  const { data, isLoading, error } = useEvents(params);

  useEffect(() => {
    if (!data) return;
    queueMicrotask(() => {
      if (data.items.length) setMerged((prev) => mergeById(prev, data.items));
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
      (entries) => { if (entries.some((e) => e.isIntersecting)) onLoadMore(); },
      { root: null, rootMargin: "120px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onLoadMore, merged.length]);

  const weekCutMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

  if (error) {
    return <p className="text-xs" style={{ color: "var(--z-danger)" }}>{error.message}</p>;
  }

  if (merged.length === 0 && !isLoading) {
    return <p className="text-xs" style={{ color: "var(--z-muted)" }}>No events yet.</p>;
  }

  return (
    <div className="space-y-1.5">
      {merged.map((event, idx) => {
        const accent = eventAccent(event);
        const isRecent = new Date(event.created_at).getTime() > weekCutMs;
        const isLast = idx === merged.length - 1;
        return (
          <EventRow
            key={event.id}
            event={event}
            isRecent={isRecent}
            accent={accent}
            isLast={isLast}
          />
        );
      })}

      <div ref={sentinelRef} className="h-4 w-full" aria-hidden />
      {isLoading && (
        <p className="text-center text-[10px]" style={{ color: "var(--z-muted)" }}>
          Loading…
        </p>
      )}
    </div>
  );
}
