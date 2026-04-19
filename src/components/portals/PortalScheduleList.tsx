"use client";
import { EmptyState } from "@/components/system/SurfaceStates";
import { normalizeSchedulingStatus, statusBadgeClass } from "@/lib/scheduling/colorSemantics";

type PortalScheduleRow = {
  id: string;
  subject?: string | null;
  blockDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status?: string | null;
  room?: string | null;
  isVirtual?: boolean | null;
  blockType?: string | null;
};

type PortalScheduleListProps = {
  rows: PortalScheduleRow[];
  title?: string;
  maxRows?: number;
  emptyLabel?: string;
  onlyToday?: boolean;
};

function formatDateLabel(date: string | null | undefined): string {
  if (!date) return "--";
  const d = new Date(`${date}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return "--";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "--";
  return value.slice(0, 5);
}

function isToday(date: string | null | undefined): boolean {
  if (!date) return false;
  return date === new Date().toISOString().slice(0, 10);
}

export function PortalScheduleList({
  rows,
  title = "Schedule",
  maxRows = 20,
  emptyLabel = "No scheduled blocks.",
  onlyToday = false,
}: PortalScheduleListProps) {
  const filtered = onlyToday ? rows.filter((row) => isToday(row.blockDate)) : rows;
  const data = [...filtered]
    .sort((a, b) => {
      const ad = a.blockDate ?? "";
      const bd = b.blockDate ?? "";
      if (ad !== bd) return ad.localeCompare(bd);
      const at = a.startTime ?? "";
      const bt = b.startTime ?? "";
      return at.localeCompare(bt);
    })
    .slice(0, maxRows);
  return (
    <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
      <header className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">{title}</h2>
        <span className="text-xs text-[var(--z-muted)]">
          {data.length} {data.length === 1 ? "block" : "blocks"}
        </span>
      </header>
      {data.length === 0 ? (
        <div className="p-4">
          <EmptyState title={emptyLabel} description="New scheduling updates will appear here." />
        </div>
      ) : (
        <ul className="divide-y divide-[var(--z-border)]" role="list">
          {data.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between z-hover-micro-subtle"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--z-fg)]">
                  {formatDateLabel(row.blockDate)}
                  <span className="mx-2 text-[var(--z-muted)]">·</span>
                  {formatTime(row.startTime)} - {formatTime(row.endTime)}
                </div>
                <div className="truncate text-xs text-[var(--z-muted)]">
                  {row.subject ?? row.blockType ?? "lesson"}
                  {row.subject && row.blockType ? ` · ${row.blockType}` : ""}
                  {row.room ? ` · Room ${row.room}` : ""}
                  {row.isVirtual ? " · Virtual" : ""}
                </div>
              </div>
              <span
                className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusBadgeClass(
                  row.status,
                )}`}
              >
                {normalizeSchedulingStatus(row.status)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
