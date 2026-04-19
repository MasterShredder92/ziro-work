import { cn } from "@/components/ui/utils/cn";
import type { LeadSourceStats } from "@/lib/leads/types";

export interface LeadSourceChartProps {
  stats: LeadSourceStats;
  maxRows?: number;
}

export function LeadSourceChart({ stats, maxRows = 10 }: LeadSourceChartProps) {
  const rows = stats.bySource.slice(0, maxRows);
  const maxTotal = rows.reduce((acc, r) => Math.max(acc, r.total), 1);

  return (
    <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Lead sources
          </div>
          <h3 className="text-base font-semibold text-[var(--z-fg)]">
            Channel performance
          </h3>
        </div>
        <div className="text-xs text-[var(--z-muted)]">
          {stats.total.toLocaleString()} leads total
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface-2)] px-4 py-6 text-center text-sm text-[var(--z-muted)]">
          No source data yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const pct = Math.round((row.total / maxTotal) * 100);
            return (
              <li key={row.source} className="space-y-1">
                <div className="flex items-baseline justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-[var(--z-fg)] truncate">
                      {row.source}
                    </span>
                    <span className="text-[var(--z-muted)]">
                      {row.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
                    <span>open {row.open}</span>
                    <span className="text-emerald-300">
                      {row.conversionRate}% conv.
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      row.conversionRate >= 30
                        ? "bg-emerald-400"
                        : row.conversionRate >= 15
                          ? "bg-amber-400"
                          : "bg-sky-400",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
