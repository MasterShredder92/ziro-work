import type {
  StudentBillingItem,
  StudentBillingSummary,
} from "@/lib/student/types";

function formatMoney(cents: number): string {
  const n = cents / 100;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusClass(status: string | null): string {
  const s = (status ?? "").toUpperCase();
  if (s === "PAID") return "bg-emerald-500/10 text-emerald-400";
  if (s === "UNPAID" || s === "PARTIALLY_PAID")
    return "bg-amber-500/10 text-amber-400";
  if (s === "CANCELED" || s === "CANCELLED") return "bg-red-500/10 text-red-400";
  return "bg-white/5 text-[var(--z-muted)]";
}

/** Sticky column header cell — matches CRM portal table pattern */
const PORTAL_TABLE_TH =
  "sticky top-0 z-20 bg-[var(--z-surface,#0a0a0c)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)] shadow-[inset_0_-1px_0_var(--z-border,rgb(28_28_30))]";

export interface BillingListProps {
  invoices: StudentBillingItem[];
  summary?: StudentBillingSummary | null;
  emptyLabel?: string;
  maxRows?: number;
}

export function BillingList({
  invoices,
  summary,
  emptyLabel = "No invoices on file.",
  maxRows,
}: BillingListProps) {
  const rows = typeof maxRows === "number" ? invoices.slice(0, maxRows) : invoices;

  if (rows.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {summary ? (
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Balance" value={formatMoney(summary.balanceCents)} />
          <SummaryCard
            label="Overdue"
            value={formatMoney(summary.overdueAmountCents)}
            hint={`${summary.overdueCount} invoice${
              summary.overdueCount === 1 ? "" : "s"
            }`}
          />
          <SummaryCard
            label="Billed"
            value={formatMoney(summary.totalBilledCents)}
          />
          <SummaryCard
            label="Paid"
            value={formatMoney(summary.totalPaidCents)}
          />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)]">
        <div className="isolate max-h-[min(70vh,720px)] overflow-auto overscroll-contain">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr>
                <th className={`${PORTAL_TABLE_TH} text-left`}>Invoice</th>
                <th className={`${PORTAL_TABLE_TH} text-left`}>Date</th>
                <th className={`${PORTAL_TABLE_TH} text-left`}>Due</th>
                <th className={`${PORTAL_TABLE_TH} text-right`}>Amount</th>
                <th className={`${PORTAL_TABLE_TH} text-right`}>Balance</th>
                <th className={`${PORTAL_TABLE_TH} text-left`}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--z-border)]">
              {rows.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-2 text-[var(--z-fg)]">
                    <div className="font-medium">
                      {inv.invoice_number ?? inv.title ?? inv.id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-[var(--z-muted)]">
                    {formatDate(inv.invoice_date)}
                  </td>
                  <td className="px-4 py-2 text-[var(--z-muted)]">
                    {formatDate(inv.due_date)}
                  </td>
                  <td className="px-4 py-2 text-right text-[var(--z-fg)]">
                    {formatMoney(inv.amount_cents)}
                  </td>
                  <td className="px-4 py-2 text-right text-[var(--z-fg)]">
                    {formatMoney(inv.balance_cents)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${statusClass(
                        inv.status,
                      )}`}
                    >
                      {inv.status ?? "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-[var(--z-fg)]">{value}</div>
      {hint ? (
        <div className="mt-0.5 text-xs text-[var(--z-muted)]">{hint}</div>
      ) : null}
    </div>
  );
}
