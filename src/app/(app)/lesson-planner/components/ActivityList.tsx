import type { LessonActivity } from "@/lib/lessonPlanner/types";

export function ActivityList({
  activities,
}: {
  activities: LessonActivity[];
}) {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]">
        No activities yet. Add a warm-up, direct instruction, practice, and a
        closure to build the instructional arc.
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {activities.map((act, idx) => (
        <li
          key={act.id}
          className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-full border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_6%)] px-2 py-0.5 text-[10px] font-semibold text-[var(--z-muted)]">
              {idx + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-[var(--z-fg)]">
                  {act.title}
                </div>
                <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                  {act.kind.replace(/_/g, " ")}
                </span>
                {act.duration_minutes ? (
                  <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] text-[var(--z-muted)]">
                    {act.duration_minutes} min
                  </span>
                ) : null}
                {act.grouping ? (
                  <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] text-[var(--z-muted)]">
                    {act.grouping.replace(/_/g, " ")}
                  </span>
                ) : null}
              </div>
              {act.description ? (
                <p className="mt-1 text-xs text-[var(--z-muted)]">
                  {act.description}
                </p>
              ) : null}
              {act.resources.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-[var(--z-muted)]">
                  {act.resources.map((r) => (
                    <span
                      key={r}
                      className="rounded-full border border-[var(--z-border)] px-2 py-0.5"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
