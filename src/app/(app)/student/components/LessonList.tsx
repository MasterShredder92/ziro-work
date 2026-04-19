import type { StudentLessonItem } from "@/lib/student/types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusClass(status: string | null): string {
  if (status === "completed") return "bg-emerald-500/10 text-emerald-400";
  if (status === "missed") return "bg-red-500/10 text-red-400";
  return "bg-white/5 text-[var(--z-muted)]";
}

export interface LessonListProps {
  lessons: StudentLessonItem[];
  emptyLabel?: string;
  maxRows?: number;
}

export function LessonList({
  lessons,
  emptyLabel = "No lesson history yet.",
  maxRows,
}: LessonListProps) {
  const rows = typeof maxRows === "number" ? lessons.slice(0, maxRows) : lessons;

  if (rows.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)]">
      <ul className="divide-y divide-[var(--z-border)]">
        {rows.map((l) => (
          <li key={l.id} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--z-fg)]">
                  {formatDate(l.block_date)}
                  {l.instrument ? ` · ${l.instrument}` : ""}
                </div>
                <div className="text-xs text-[var(--z-muted)]">
                  Engagement:{" "}
                  {typeof l.engagement_level === "number"
                    ? `${l.engagement_level}/5`
                    : "—"}
                  {l.progress_indicator ? ` · ${l.progress_indicator}` : ""}
                </div>
              </div>
              {l.status ? (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${statusClass(
                    l.status,
                  )}`}
                >
                  {l.status}
                </span>
              ) : null}
            </div>
            {l.lesson_notes ? (
              <p className="mt-2 line-clamp-3 text-xs text-[var(--z-muted)]">
                {l.lesson_notes}
              </p>
            ) : null}
            {l.worked_on.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {l.worked_on.map((w, i) => (
                  <span
                    key={`${l.id}-${i}`}
                    className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] text-[var(--z-muted)]"
                  >
                    {w}
                  </span>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
