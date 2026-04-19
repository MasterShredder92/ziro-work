import { Card } from "@/components/ui/Card";
import type { DirectorBillingData } from "@/lib/director/types";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

export type BillingSummaryProps = {
  billing: DirectorBillingData;
};

export function BillingSummary({ billing }: BillingSummaryProps) {
  const collectionRate =
    billing.totalOutstandingCents + billing.totalPaidCents > 0
      ? Math.round(
          (billing.totalPaidCents /
            (billing.totalOutstandingCents + billing.totalPaidCents)) *
            100,
        )
      : 100;

  const rows: Array<{
    label: string;
    value: string;
    tone?: "success" | "warning" | "danger";
  }> = [
    {
      label: "Month-to-date revenue",
      value: formatCents(billing.monthToDateRevenueCents),
      tone: "success",
    },
    {
      label: "Outstanding",
      value: formatCents(billing.totalOutstandingCents),
      tone:
        billing.totalOutstandingCents > 0 ? "warning" : undefined,
    },
    {
      label: "Overdue",
      value: `${billing.overdueCount} · ${formatCents(billing.overdueAmountCents)}`,
      tone: billing.overdueCount > 0 ? "danger" : undefined,
    },
    {
      label: "Paid (lifetime)",
      value: formatCents(billing.totalPaidCents),
    },
    {
      label: "Average invoice",
      value: formatCents(billing.averageInvoiceCents),
    },
    {
      label: "Collection rate",
      value: `${collectionRate}%`,
      tone:
        collectionRate >= 90
          ? "success"
          : collectionRate >= 70
            ? "warning"
            : "danger",
    },
  ];

  const toneClass: Record<"success" | "warning" | "danger", string> = {
    success: "text-emerald-400",
    warning: "text-amber-400",
    danger: "text-red-400",
  };

  return (
    <Card variant="elevated" padding="md" radius="lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Billing summary
          </div>
          <div className="text-lg font-semibold text-[var(--z-fg)]">
            Revenue & collections
          </div>
        </div>
        <div className="text-xs text-[var(--z-muted)]">
          {billing.invoices.length} invoices · {billing.payments.length} payments
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_1.5%)] p-3"
          >
            <div className="text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
              {row.label}
            </div>
            <div
              className={`mt-1 text-xl font-semibold tabular-nums ${
                row.tone ? toneClass[row.tone] : "text-[var(--z-fg)]"
              }`}
            >
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
