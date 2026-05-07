import { Card } from "@/components/ui/Card";
import type { DirectorTeacherRow } from "@/lib/director/types";

export type TeacherLoadChartProps = {
  teachers: DirectorTeacherRow[];
  maxRows?: number;
};

export function TeacherLoadChart({
  teachers,
  maxRows = 12,
}: TeacherLoadChartProps) {
  const sorted = [...teachers]
    .sort((a, b) => b.weeklyMinutes - a.weeklyMinutes)
    .slice(0, maxRows);
  const maxMinutes = Math.max(1, ...sorted.map((t) => t.weeklyMinutes));

  return (
    <Card variant="elevated" padding="md" radius="lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Teacher load
          </div>
          <div className="text-lg font-semibold text-[var(--z-fg)]">
            Weekly schedule utilization
          </div>
        </div>
        <div className="text-xs text-[var(--z-muted)]">
          {teachers.length} teachers
        </div>
      </div>
      {sorted.length === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--z-muted)]">
          No teachers assigned to this location.
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((t) => {
            const pct = Math.round((t.weeklyMinutes / maxMinutes) * 100);
            return (
              <div key={t.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="truncate pr-3 text-[var(--z-fg)] font-medium">
                    {t.name}
                  </div>
                  <div className="text-xs text-[var(--z-muted)] tabular-nums shrink-0">
                    {t.weeklyLessons} lessons · {Math.round(t.weeklyMinutes / 60)}h
                  </div>
                </div>
                <div className="h-2 rounded-full bg-[color-mix(in_oklab,var(--z-surface),white_4%)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background:
                        "linear-gradient(90deg, #c4f036, color-mix(in oklab, #c4f036, #0094ff 45%))",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
