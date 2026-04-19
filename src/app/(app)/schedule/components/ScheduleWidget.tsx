import Link from "next/link";
import { listEvents } from "@/lib/schedule/service";
import type { LessonEvent } from "@/lib/schedule/types";
import { SCHEDULING_ACCENT_HEX } from "@/lib/scheduling/colorSemantics";

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function endOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

export async function ScheduleWidget({
  tenantId,
  title = "Today on the schedule",
  teacherId,
  studentId,
  familyId,
  href = "/schedule",
  days = 1,
  limit = 6,
}: {
  tenantId: string;
  title?: string;
  teacherId?: string;
  studentId?: string;
  familyId?: string;
  href?: string;
  days?: number;
  limit?: number;
}) {
  const now = new Date();
  const rangeEnd = endOfDay(
    new Date(now.getTime() + (days - 1) * 24 * 60 * 60 * 1000),
  );
  let events: LessonEvent[] = [];
  try {
    events = await listEvents(tenantId, {
      range: {
        start: startOfDay(now).toISOString(),
        end: rangeEnd.toISOString(),
      },
      teacherId,
      studentId,
      familyId,
      limit: limit * 3,
    });
  } catch {
    events = [];
  }

  const display = events.slice(0, limit);

  return (
    <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--z-border)]">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Schedule
          </div>
          <div className="text-sm font-semibold text-[var(--z-fg)]">
            {title}
          </div>
        </div>
        <Link
          href={href}
          className="text-xs hover:underline"
          style={{ color: SCHEDULING_ACCENT_HEX }}
        >
          View all →
        </Link>
      </header>
      {display.length === 0 ? (
        <div className="px-4 py-6 text-sm text-[var(--z-muted)] text-center">
          Nothing on the books.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--z-border)]">
          {display.map((ev) => (
            <li key={ev.id} className="px-4 py-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/schedule/events/${ev.id}`}
                  className="text-sm font-medium text-[var(--z-fg)] truncate hover:underline"
                >
                  {ev.title}
                </Link>
                <div className="text-[11px] text-[var(--z-muted)]">
                  {new Date(ev.startTime).toLocaleString(undefined, {
                    weekday: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  ·{" "}
                  <span className="capitalize">{ev.status}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
