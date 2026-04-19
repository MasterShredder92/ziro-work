import type { BillingInvoiceRow } from "@/lib/billing/types";
import { cn } from "@/components/ui/utils/cn";

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

function StatusBadge({ row }: { row: BillingInvoiceRow }) {
  const status = (row.status ?? "unknown").toLowerCase();
  const isOverdue = row.is_overdue;
  const tone = isOverdue
    ? "bg-red-500/15 text-red-300 border-red-500/30"
    : status === "paid"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : status === "draft"
        ? "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]"
        : status === "unpaid" || status === "partially_paid"
          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
          : "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";

  const label = isOverdue ? `Overdue · ${row.days_overdue}d` : status;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tone,
      )}
    >
      {label}
    </span>
  );
}

export type InvoiceTableProps = {
  invoices: BillingInvoiceRow[];
  maxHeight?: number;
  emptyMessage?: string;
};

export function InvoiceTable({
  invoices,
  maxHeight = 520,
  emptyMessage = "No invoices found.",
}: InvoiceTableProps) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--z-border)]">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Invoices
          </div>
          <div className="text-sm font-semibold text-[var(--z-fg)]">
            {invoices.length} records
          </div>
        </div>
      </div>

      <div
        className="grid sticky top-0 z-10 bg-[color-mix(in_oklab,var(--z-surface),white_2%)] border-b border-[var(--z-border)]"
        style={{
          gridTemplateColumns:
            "minmax(140px,1.2fr) minmax(180px,1.6fr) 120px 120px 120px 140px",
        }}
      >
        {[
          "Invoice",
          "Customer",
          "Invoiced",
          "Outstanding",
          "Due",
          "Status",
        ].map((label) => (
          <div
            key={label}
            className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="overflow-auto" style={{ maxHeight }}>
        {invoices.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-[var(--z-muted)]">
            {emptyMessage}
          </div>
        ) : (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="grid border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/[0.02] transition-colors"
              style={{
                gridTemplateColumns:
                  "minmax(140px,1.2fr) minmax(180px,1.6fr) 120px 120px 120px 140px",
              }}
            >
              <div className="px-4 py-3 text-sm text-[var(--z-fg)] truncate">
                <div className="font-medium truncate">
                  {invoice.invoice_number ?? invoice.title ?? invoice.square_invoice_id}
                </div>
                <div className="text-[11px] text-[var(--z-muted)] truncate">
                  {formatDate(invoice.invoice_date)}
                </div>
              </div>
              <div className="px-4 py-3 text-sm text-[var(--z-fg)] truncate">
                <div className="truncate">
                  {invoice.customer_name ?? "—"}
                </div>
                <div className="text-[11px] text-[var(--z-muted)] truncate">
                  {invoice.customer_email ?? ""}
                </div>
              </div>
              <div className="px-4 py-3 text-sm text-[var(--z-fg)] tabular-nums">
                {formatCents(invoice.amount_cents)}
              </div>
              <div
                className={cn(
                  "px-4 py-3 text-sm tabular-nums",
                  invoice.outstanding_cents > 0
                    ? "text-amber-300 font-medium"
                    : "text-[var(--z-muted)]",
                )}
              >
                {formatCents(invoice.outstanding_cents)}
              </div>
              <div className="px-4 py-3 text-sm text-[var(--z-muted)] tabular-nums">
                {formatDate(invoice.due_date)}
              </div>
              <div className="px-4 py-3 flex items-center">
                <StatusBadge row={invoice} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
