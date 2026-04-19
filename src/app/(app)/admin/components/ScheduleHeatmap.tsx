import type { ScheduleHeatmapCell } from "@/lib/admin/types";

export interface ScheduleHeatmapProps {
  cells: ScheduleHeatmapCell[];
  startHour?: number;
  endHour?: number;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatHour(h: number): string {
  const am = h < 12;
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${am ? "a" : "p"}`;
}

function intensityColor(ratio: number): string {
  if (ratio <= 0) return "transparent";
  const alpha = Math.min(0.85, 0.15 + ratio * 0.7);
  return `color-mix(in oklab, var(--z-accent), transparent ${Math.round(
    (1 - alpha) * 100,
  )}%)`;
}

export function ScheduleHeatmap({
  cells,
  startHour = 8,
  endHour = 21,
}: ScheduleHeatmapProps) {
  const map = new Map<string, number>();
  for (const c of cells) map.set(`${c.day}:${c.hour}`, c.count);

  const max = cells.reduce((m, c) => (c.count > m ? c.count : m), 0);
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h += 1) hours.push(h);

  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--z-fg)]">
            Schedule heatmap
          </h3>
          <p className="text-xs text-[var(--z-muted)]">
            Lessons by weekday and hour
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--z-muted)]">
          <span>Less</span>
          <div className="flex gap-1">
            {[0.15, 0.35, 0.55, 0.75, 0.95].map((r) => (
              <span
                key={r}
                className="h-3 w-3 rounded-sm border border-[var(--z-border)]"
                style={{ backgroundColor: intensityColor(r) }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div
          className="grid gap-1 text-[11px]"
          style={{
            gridTemplateColumns: `64px repeat(${hours.length}, minmax(24px, 1fr))`,
          }}
        >
          <div />
          {hours.map((h) => (
            <div
              key={`h-${h}`}
              className="text-center text-[var(--z-muted)]"
            >
              {formatHour(h)}
            </div>
          ))}

          {DAYS.map((label, dayIdx) => (
            <div key={`row-${dayIdx}`} className="contents">
              <div className="flex items-center text-[var(--z-muted)]">
                {label}
              </div>
              {hours.map((h) => {
                const count = map.get(`${dayIdx}:${h}`) ?? 0;
                const ratio = max > 0 ? count / max : 0;
                return (
                  <div
                    key={`c-${dayIdx}-${h}`}
                    className="flex aspect-square items-center justify-center rounded-sm border border-[var(--z-border)] text-[10px] text-[var(--z-fg)]"
                    style={{ backgroundColor: intensityColor(ratio) }}
                    title={`${label} ${formatHour(h)} — ${count} lessons`}
                  >
                    {count > 0 ? count : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
