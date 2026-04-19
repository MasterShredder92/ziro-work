import type { TeacherLoadEntry } from "@/lib/admin/types";

export interface TeacherLoadChartProps {
  entries: TeacherLoadEntry[];
  maxRows?: number;
}

export function TeacherLoadChart({
  entries,
  maxRows = 12,
}: TeacherLoadChartProps) {
  const visible = entries.slice(0, maxRows);
  const maxHours = visible.reduce(
    (m, e) => (e.hoursScheduled > m ? e.hoursScheduled : m),
    0,
  );

  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--z-fg)]">
            Teacher load
          </h3>
          <p className="text-xs text-[var(--z-muted)]">
            Scheduled hours & students per teacher
          </p>
        </div>
        <div className="text-xs text-[var(--z-muted)]">
          {entries.length} teachers
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {visible.length === 0 ? (
          <div className="py-6 text-center text-sm text-[var(--z-muted)]">
            No teachers configured.
          </div>
        ) : (
          visible.map((e) => {
            const pct = maxHours > 0 ? (e.hoursScheduled / maxHours) * 100 : 0;
            return (
              <div key={e.teacherId}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="truncate font-medium text-[var(--z-fg)]">
                    {e.teacherName}
                  </span>
                  <span className="text-[var(--z-muted)]">
                    {e.hoursScheduled.toFixed(1)}h ·{" "}
                    {e.lessonCount} lessons · {e.studentCount} students
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--z-surface),white_4%)]">
                  <div
                    className="h-full rounded-full bg-[var(--z-accent)] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
