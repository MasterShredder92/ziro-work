import { Fragment } from "react";
import { Card } from "@/components/ui/Card";
import type { DirectorScheduleData } from "@/lib/director/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);

function hourLabel(hour: number): string {
  const suffix = hour >= 12 ? "p" : "a";
  const h = ((hour + 11) % 12) + 1;
  return `${h}${suffix}`;
}

export type ScheduleHeatmapProps = {
  schedule: DirectorScheduleData;
};

export function ScheduleHeatmap({ schedule }: ScheduleHeatmapProps) {
  const cellMap = new Map<string, number>();
  let max = 0;
  for (const cell of schedule.heatmap) {
    cellMap.set(`${cell.dayOfWeek}:${cell.hour}`, cell.count);
    if (cell.count > max) max = cell.count;
  }
  const denom = Math.max(1, max);

  const peakLabel =
    schedule.peakDayOfWeek != null && schedule.peakHour != null
      ? `${DAY_LABELS[schedule.peakDayOfWeek]} ${hourLabel(schedule.peakHour)}`
      : "—";

  return (
    <Card variant="elevated" padding="md" radius="lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Schedule heatmap
          </div>
          <div className="text-lg font-semibold text-[var(--z-fg)]">
            Lesson density
          </div>
        </div>
        <div className="text-xs text-[var(--z-muted)]">
          Peak: <span className="text-[var(--z-fg)] font-medium">{peakLabel}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div
          className="grid gap-1 min-w-[640px]"
          style={{
            gridTemplateColumns: `48px repeat(${HOURS.length}, minmax(28px, 1fr))`,
          }}
        >
          <div />
          {HOURS.map((h) => (
            <div
              key={`head-${h}`}
              className="text-[10px] text-center text-[var(--z-muted)] uppercase tracking-wider"
            >
              {hourLabel(h)}
            </div>
          ))}
          {DAY_LABELS.map((dayLabel, day) => (
            <Fragment key={`row-${day}`}>
              <div className="text-[11px] font-semibold text-[var(--z-muted)] uppercase tracking-wider flex items-center">
                {dayLabel}
              </div>
              {HOURS.map((h) => {
                const count = cellMap.get(`${day}:${h}`) ?? 0;
                const intensity = count === 0 ? 0 : 0.15 + (count / denom) * 0.85;
                return (
                  <div
                    key={`cell-${day}-${h}`}
                    title={`${dayLabel} ${hourLabel(h)} · ${count} lesson${count === 1 ? "" : "s"}`}
                    className="h-7 rounded-sm border border-[var(--z-border)] transition-colors"
                    style={{
                      backgroundColor:
                        count === 0
                          ? "color-mix(in oklab, var(--z-surface), transparent 60%)"
                          : `color-mix(in oklab, #c4f036, transparent ${Math.round(
                              (1 - intensity) * 100,
                            )}%)`,
                    }}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--z-muted)]">
        <span>Less</span>
        {[0.2, 0.4, 0.6, 0.8, 1].map((v) => (
          <span
            key={v}
            className="h-3 w-5 rounded-sm border border-[var(--z-border)]"
            style={{
              backgroundColor: `color-mix(in oklab, #c4f036, transparent ${Math.round(
                (1 - v) * 100,
              )}%)`,
            }}
          />
        ))}
        <span>More</span>
        <span className="ml-auto">
          {schedule.blocks.length} blocks · {schedule.startDate} → {schedule.endDate}
        </span>
      </div>
    </Card>
  );
}
