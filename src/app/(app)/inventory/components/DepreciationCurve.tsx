import type { DepreciationRecord } from "@/lib/inventory/types";

export type DepreciationCurveProps = {
  record: DepreciationRecord;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DepreciationCurve({ record }: DepreciationCurveProps) {
  const max = Math.max(record.purchasePrice, 1);
  const points = record.curve;

  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Depreciation curve
          </h3>
          <p className="mt-1 text-sm text-[var(--z-fg)]">
            {record.method.replace("_", " ")} · {record.usefulLifeMonths} mo
            useful life
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
            Current
          </div>
          <div className="text-lg font-semibold text-[var(--z-fg)]">
            {formatCurrency(record.currentValue)}
          </div>
        </div>
      </header>
      <div className="mt-4 grid grid-cols-[repeat(13,minmax(0,1fr))] items-end gap-1 h-24">
        {points.map((p) => {
          const height = Math.max(2, Math.round((p.value / max) * 100));
          return (
            <div
              key={`${p.month}-${p.date}`}
              className="relative flex h-full items-end"
              title={`${p.date}: ${formatCurrency(p.value)}`}
            >
              <div
                className="w-full rounded-sm bg-[color-mix(in_oklab,var(--z-accent),transparent_40%)]"
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-[10px] text-[var(--z-muted)]">
        <span>Month 0</span>
        <span>Month {points[points.length - 1]?.month ?? 0}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-[var(--z-muted)]">
        <div>
          <div className="text-[10px] uppercase">Purchase</div>
          <div className="font-semibold text-[var(--z-fg)]">
            {formatCurrency(record.purchasePrice)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase">Salvage</div>
          <div className="font-semibold text-[var(--z-fg)]">
            {formatCurrency(record.salvageValue)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase">Accumulated</div>
          <div className="font-semibold text-[var(--z-fg)]">
            {formatCurrency(record.accumulated)}
          </div>
        </div>
      </div>
    </div>
  );
}
