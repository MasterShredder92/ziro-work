type UsageRow = {
  metric: string;
  total: number;
};

type Props = {
  usage: UsageRow[];
  period: { start: string; end: string };
};

function displayValue(metric: string, total: number): string {
  if (metric === "storage") {
    const mb = total / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(total);
}

export function UsageBreakdown({ usage, period }: Props) {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-semibold text-[var(--z-fg)]">Usage metering</h2>
        <p className="text-xs text-[var(--z-muted)]">
          Metered activity from {period.start} to {period.end}.
        </p>
      </header>
      <div className="overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
        {usage.length === 0 ? (
          <div className="px-4 py-6 text-sm text-[var(--z-muted)]">
            No usage recorded for this period.
          </div>
        ) : (
          usage.map((row) => (
            <div
              key={row.metric}
              className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3 last:border-b-0"
            >
              <div className="text-sm font-medium text-[var(--z-fg)]">{row.metric}</div>
              <div className="text-sm tabular-nums text-[var(--z-muted)]">
                {displayValue(row.metric, row.total)}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
