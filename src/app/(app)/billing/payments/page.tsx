import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { listPayments } from "@/lib/billing/paymentQueries";
import { formatCents, formatDateTime } from "../components/format";

export const dynamic = "force-dynamic";

async function resolveSession(): Promise<Session> {
  try {
    return await requirePermission("billing.read")();
  } catch {
    redirect("/dashboard");
  }
}

export default async function BillingPaymentsPage() {
  const session = await resolveSession();
  const payments = await listPayments(session.tenantId, undefined, { limit: 500 });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">Payments</h1>
        <p className="text-sm text-[var(--z-muted)]">
          Ledger of incoming revenue, refunds, and credits.
        </p>
      </header>
      <div className="overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
        <div
          className="grid border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_2%)]"
          style={{
            gridTemplateColumns: "minmax(160px,1fr) 140px 120px 140px 140px 120px",
          }}
        >
          {["Paid at", "Method", "Amount", "Refunded", "Invoice", "Status"].map(
            (c) => (
              <div
                key={c}
                className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]"
              >
                {c}
              </div>
            ),
          )}
        </div>
        {payments.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-[var(--z-muted)]">
            No payments recorded.
          </div>
        ) : (
          payments.map((p) => (
            <div
              key={p.id}
              className="grid border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/[0.02]"
              style={{
                gridTemplateColumns: "minmax(160px,1fr) 140px 120px 140px 140px 120px",
              }}
            >
              <div className="px-4 py-3 text-sm text-[var(--z-fg)]">
                {formatDateTime(p.paid_at)}
              </div>
              <div className="px-4 py-3 text-sm text-[var(--z-muted)]">{p.method}</div>
              <div className="px-4 py-3 text-sm tabular-nums text-[var(--z-fg)]">
                {formatCents(p.amount_cents, p.currency)}
              </div>
              <div className="px-4 py-3 text-sm tabular-nums text-[var(--z-muted)]">
                {formatCents(p.refunded_cents, p.currency)}
              </div>
              <div className="px-4 py-3 text-[11px] text-[var(--z-muted)]">
                {p.invoice_id ? p.invoice_id.slice(0, 8) : "—"}
              </div>
              <div className="px-4 py-3 text-sm uppercase text-[var(--z-fg)]">
                {p.status}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
