import { redirect } from "next/navigation";
import { resolveStudentContext } from "../guard";
import { listPayments } from "@data/payments";
import { listInvoices } from "@data/invoices";
import { formatCents, formatDateTime } from "../../billing/components/format";

export const dynamic = "force-dynamic";

export default async function StudentPaymentsPage() {
  let ctx;
  try {
    ctx = await resolveStudentContext();
  } catch {
    redirect("/student");
  }

  const { tenantId, studentId } = ctx;

  const invoices = await listInvoices(
    tenantId,
    { student_id: studentId },
    { limit: 500 },
  );
  const invoiceIds = new Set(invoices.map((i) => i.id));
  const invoicesById = new Map(invoices.map((i) => [i.id, i]));

  const allPayments = await listPayments(tenantId, undefined, { limit: 1000 });
  const payments = allPayments
    .filter((p) => (p.invoice_id ? invoiceIds.has(p.invoice_id) : false))
    .sort((a, b) => (a.paid_at > b.paid_at ? -1 : 1));

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">Payment history</h1>
        <p className="text-sm text-[var(--z-muted)]">
          A read-only record of payments applied to your invoices.
        </p>
      </header>

      <div className="overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
        <div
          className="grid border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_2%)]"
          style={{
            gridTemplateColumns: "160px minmax(160px,1fr) 140px 120px 120px",
          }}
        >
          {["Received", "Invoice", "Method", "Amount", "Status"].map((c) => (
            <div
              key={c}
              className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]"
            >
              {c}
            </div>
          ))}
        </div>
        {payments.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-[var(--z-muted)]">
            No payments on file.
          </div>
        ) : (
          payments.map((p) => {
            const inv = p.invoice_id ? invoicesById.get(p.invoice_id) : null;
            return (
              <div
                key={p.id}
                className="grid border-b border-[var(--z-border)] last:border-b-0"
                style={{
                  gridTemplateColumns:
                    "160px minmax(160px,1fr) 140px 120px 120px",
                }}
              >
                <div className="px-4 py-3 text-sm text-[var(--z-muted)]">
                  {formatDateTime(p.paid_at)}
                </div>
                <div className="px-4 py-3 text-sm text-[var(--z-fg)]">
                  {inv ? inv.number ?? inv.id.slice(0, 8) : "—"}
                </div>
                <div className="px-4 py-3 text-sm text-[var(--z-muted)]">
                  {p.method ?? "—"}
                </div>
                <div className="px-4 py-3 text-sm tabular-nums text-[var(--z-fg)]">
                  {formatCents(p.amount_cents, p.currency)}
                </div>
                <div className="px-4 py-3 text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
                  {p.status}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
