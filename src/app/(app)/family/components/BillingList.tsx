import type {
  FamilyBillingItem,
  FamilyBillingSummary,
} from "@/lib/family/types";

interface BillingListProps {
  invoices: FamilyBillingItem[];
  summary?: FamilyBillingSummary;
  title?: string;
  maxRows?: number;
}

function formatMoney(cents: number | null | undefined): string {
  const n = typeof cents === "number" ? cents / 100 : 0;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusClass(status: string | null | undefined): string {
  const s = (status ?? "").toUpperCase();
  if (s === "PAID") return "bg-emerald-500/10 text-emerald-400";
  if (s === "UNPAID" || s === "PARTIALLY_PAID" || s === "SENT")
    return "bg-amber-500/10 text-amber-400";
  if (s === "CANCELED" || s === "CANCELLED")
    return "bg-red-500/10 text-red-400";
  return "bg-white/5 text-[var(--z-muted)]";
}

/** Sticky column header cell — matches CRM portal table pattern */
const PORTAL_TABLE_TH =
  "sticky top-0 z-20 bg-[var(--z-surface,#0a0a0c)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)] shadow-[inset_0_-1px_0_var(--z-border,rgb(28_28_30))]";

export function BillingList({
  invoices,
  summary,
  title = "Billing",
  maxRows = 25,
}: BillingListProps) {
  const rows = invoices.slice(0, maxRows);

  return (
    <section className="flex flex-col gap-3">
      {summary ? (
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Balance"
            value={formatMoney(summary.balanceCents)}
            tone="amber"
          />
          <StatCard
            label="Paid"
            value={formatMoney(summary.totalPaidCents)}
            tone="emerald"
          />
          <StatCard
            label="Billed"
            value={formatMoney(summary.totalBilledCents)}
          />
          <StatCard
            label="Overdue"
            value={`${summary.overdueCount}`}
            suffix={
              summary.overdueAmountCents > 0
                ? formatMoney(summary.overdueAmountCents)
                : undefined
            }
            tone={summary.overdueCount > 0 ? "red" : undefined}
          />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
        <header className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">{title}</h2>
          <span className="text-xs text-[var(--z-muted)]">
            {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
          </span>
        </header>
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--z-muted)]">
            No invoices on file.
          </div>
        ) : (
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
                      {inv.title && inv.invoice_number ? (
                        <div className="text-xs text-[var(--z-muted)]">
                          {inv.title}
                        </div>
                      ) : null}
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
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${statusClass(inv.status)}`}
                      >
                        {inv.status ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: "amber" | "emerald" | "red";
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-400"
      : tone === "emerald"
        ? "text-emerald-400"
        : tone === "red"
          ? "text-red-400"
          : "text-[var(--z-fg)]";
  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={`text-lg font-semibold ${toneClass}`}>{value}</span>
        {suffix ? (
          <span className="text-xs text-[var(--z-muted)]">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}
