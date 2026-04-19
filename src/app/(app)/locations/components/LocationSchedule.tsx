import type { ScheduleBlock } from "@/lib/types/entities";

interface LocationScheduleProps {
  blocks: ScheduleBlock[];
  title?: string;
  maxRows?: number;
}

function formatTime(t: string | null | undefined): string {
  if (!t) return "--";
  return t.slice(0, 5);
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "--";
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function LocationSchedule({
  blocks,
  title = "Upcoming schedule",
  maxRows = 20,
}: LocationScheduleProps) {
  const rows = blocks.slice(0, maxRows);
  return (
    <section className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <header className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">{title}</h2>
        <span className="text-xs text-[var(--z-muted)]">
          {rows.length} upcoming
        </span>
      </header>
      {rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-[var(--z-muted)]">
          No upcoming blocks for this location.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--z-border)]">
          {rows.map((b) => (
            <li
              key={b.id}
              className="grid grid-cols-[120px_1fr_auto] items-center gap-3 px-4 py-2.5 text-sm"
            >
              <span className="font-medium text-[var(--z-fg)]">
                {formatDate(b.block_date)}
              </span>
              <span className="truncate text-[var(--z-fg)]">
                {b.block_type ?? "Session"}
                {b.status ? ` · ${b.status}` : ""}
              </span>
              <span className="shrink-0 text-xs text-[var(--z-muted)]">
                {formatTime(b.start_time)}–{formatTime(b.end_time)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
