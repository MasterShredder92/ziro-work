import type { BillingAgingBucket } from "@/lib/billing/types";
import { Card } from "@/components/ui/Card";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

export type AgingReportProps = {
  buckets: BillingAgingBucket[];
};

export function AgingReport({ buckets }: AgingReportProps) {
  const totalOutstanding = buckets.reduce(
    (sum, b) => sum + b.outstandingCents,
    0,
  );

  return (
    <Card variant="elevated" padding="md" radius="lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Aging report
          </div>
          <div className="text-lg font-semibold text-[var(--z-fg)]">
            Outstanding by age
          </div>
        </div>
        <div className="text-sm text-[var(--z-muted)]">
          Total {formatCents(totalOutstanding)}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {buckets.map((bucket) => {
          const share =
            totalOutstanding > 0
              ? Math.round((bucket.outstandingCents / totalOutstanding) * 100)
              : 0;
          const isOverdue = bucket.id !== "current";
          const toneText =
            bucket.id === "90+"
              ? "text-red-400"
              : bucket.id === "61-90"
                ? "text-red-300"
                : bucket.id === "31-60"
                  ? "text-amber-300"
                  : bucket.id === "0-30"
                    ? "text-amber-200"
                    : "text-emerald-300";
          const barTone =
            bucket.id === "90+"
              ? "bg-red-500/70"
              : bucket.id === "61-90"
                ? "bg-red-400/70"
                : bucket.id === "31-60"
                  ? "bg-amber-400/70"
                  : bucket.id === "0-30"
                    ? "bg-amber-300/70"
                    : "bg-emerald-400/70";
          return (
            <div
              key={bucket.id}
              className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_1.5%)] p-3"
            >
              <div className="text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
                {bucket.label}
              </div>
              <div
                className={`mt-1 text-xl font-semibold tabular-nums ${toneText}`}
              >
                {formatCents(bucket.outstandingCents)}
              </div>
              <div className="mt-1 text-[11px] text-[var(--z-muted)]">
                {bucket.invoiceCount} invoice{bucket.invoiceCount === 1 ? "" : "s"}
                {isOverdue ? ` · ${share}% of AR` : ""}
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className={`h-full ${barTone} transition-all`}
                  style={{ width: `${Math.min(100, share)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
