import Link from "next/link";
import type { LessonEvent } from "@/lib/schedule/types";
import { EmptyState } from "@/components/system/SurfaceStates";
import {
  eventCardClass,
  SCHEDULING_ACCENT_HEX,
} from "@/lib/scheduling/colorSemantics";

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const dow = copy.getDay();
  copy.setDate(copy.getDate() - dow);
  return copy;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function hhmm(dt: Date): string {
  return dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function EventCalendarGrid({
  events,
  weekStart,
  title,
}: {
  events: LessonEvent[];
  weekStart?: Date;
  title?: string;
}) {
  const anchor = weekStart ?? startOfWeek(new Date());
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + i);
    return d;
  });

  const byDay = new Map<string, LessonEvent[]>();
  for (const ev of events) {
    const start = new Date(ev.startTime);
    const key = start.toDateString();
    const arr = byDay.get(key) ?? [];
    arr.push(ev);
    byDay.set(key, arr);
  }

  for (const arr of byDay.values()) {
    arr.sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
  }

  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--z-border)]">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Week
          </div>
          <div className="text-sm font-semibold text-[var(--z-fg)]">
            {title ?? anchor.toLocaleDateString()} · {days[6]?.toLocaleDateString()}
          </div>
        </div>
        <div className="text-xs text-[var(--z-muted)]">
          {events.length} event{events.length === 1 ? "" : "s"}
        </div>
      </header>
      {events.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title="No events in this window"
            description="Create an event to populate the weekly calendar."
          />
        </div>
      ) : null}
      <div className="grid grid-cols-7 text-xs">
        {days.map((day) => {
          const key = day.toDateString();
          const list = byDay.get(key) ?? [];
          const isToday = sameDay(day, new Date());
          return (
            <div
              key={key}
              className="border-r last:border-r-0 border-t border-[var(--z-border)] min-h-[140px] p-2 space-y-1.5"
            >
              <div
                className="text-[11px] font-semibold"
                style={{ color: isToday ? SCHEDULING_ACCENT_HEX : "var(--z-muted)" }}
              >
                {day.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              {events.length > 0 && list.length === 0 ? (
                <div className="text-[11px] text-[var(--z-muted)]/60 italic">—</div>
              ) : (
                list.map((ev) => {
                  const start = new Date(ev.startTime);
                  const end = new Date(ev.endTime);
                  return (
                    <Link
                      key={ev.id}
                      href={`/schedule/events/${ev.id}`}
                      className={`block rounded border px-2 py-1 leading-tight hover:brightness-110 z-hover-micro-subtle ${eventCardClass(
                        ev.status,
                      )}`}
                    >
                      <div className="font-medium truncate">{ev.title}</div>
                      <div className="text-[10px] opacity-70">
                        {hhmm(start)} – {hhmm(end)}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
