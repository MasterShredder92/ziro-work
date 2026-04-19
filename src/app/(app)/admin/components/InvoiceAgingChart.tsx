import type { InvoiceAgingBucket } from "@/lib/admin/types";

export interface InvoiceAgingChartProps {
  buckets: InvoiceAgingBucket[];
  currency?: string;
}

function formatMoney(cents: number, currency = "USD"): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(dollars);
}

const bucketColor = [
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#b91c1c",
];

export function InvoiceAgingChart({
  buckets,
  currency = "USD",
}: InvoiceAgingChartProps) {
  const max = buckets.reduce(
    (m, b) => (b.totalAmountCents > m ? b.totalAmountCents : m),
    0,
  );
  const total = buckets.reduce((sum, b) => sum + b.totalAmountCents, 0);

  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--z-fg)]">
            Invoice aging
          </h3>
          <p className="text-xs text-[var(--z-muted)]">
            Outstanding receivables by bucket
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[var(--z-muted)]">Total outstanding</div>
          <div className="text-lg font-bold text-[var(--z-fg)]">
            {formatMoney(total, currency)}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {buckets.map((b, i) => {
          const pct = max > 0 ? (b.totalAmountCents / max) * 100 : 0;
          const color = bucketColor[i % bucketColor.length];
          return (
            <div key={b.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--z-fg)]">
                  {b.label}{" "}
                  <span className="text-[var(--z-muted)]">
                    ({b.count} inv)
                  </span>
                </span>
                <span className="font-semibold text-[var(--z-fg)]">
                  {formatMoney(b.totalAmountCents, currency)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--z-surface),white_4%)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
