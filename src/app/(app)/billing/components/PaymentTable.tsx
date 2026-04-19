import type { BillingPaymentRow } from "@/lib/billing/types";

function formatCents(cents: number | null | undefined): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(((cents ?? 0) as number) / 100);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type PaymentTableProps = {
  payments: BillingPaymentRow[];
  maxHeight?: number;
  emptyMessage?: string;
};

export function PaymentTable({
  payments,
  maxHeight = 420,
  emptyMessage = "No payments recorded.",
}: PaymentTableProps) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--z-border)]">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Payments
          </div>
          <div className="text-sm font-semibold text-[var(--z-fg)]">
            {payments.length} records
          </div>
        </div>
      </div>

      <div
        className="grid sticky top-0 z-10 bg-[color-mix(in_oklab,var(--z-surface),white_2%)] border-b border-[var(--z-border)]"
        style={{
          gridTemplateColumns: "120px minmax(140px,1.4fr) 140px 120px 120px",
        }}
      >
        {["Date", "Payment", "Tender", "Gross", "Net"].map((label) => (
          <div
            key={label}
            className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="overflow-auto" style={{ maxHeight }}>
        {payments.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-[var(--z-muted)]">
            {emptyMessage}
          </div>
        ) : (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="grid border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/[0.02] transition-colors"
              style={{
                gridTemplateColumns:
                  "120px minmax(140px,1.4fr) 140px 120px 120px",
              }}
            >
              <div className="px-4 py-3 text-sm text-[var(--z-muted)] tabular-nums">
                {formatDate(payment.reporting_date)}
              </div>
              <div className="px-4 py-3 text-sm text-[var(--z-fg)] truncate">
                <div className="font-medium truncate">
                  {payment.square_payment_id}
                </div>
                <div className="text-[11px] text-[var(--z-muted)] truncate">
                  {payment.status ?? "—"}
                </div>
              </div>
              <div className="px-4 py-3 text-sm text-[var(--z-muted)] truncate">
                {payment.tender_bucket ?? "—"}
              </div>
              <div className="px-4 py-3 text-sm text-[var(--z-fg)] tabular-nums">
                {formatCents(payment.total_money_cents)}
              </div>
              <div className="px-4 py-3 text-sm text-emerald-300 tabular-nums font-medium">
                {formatCents(payment.net_cents)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
