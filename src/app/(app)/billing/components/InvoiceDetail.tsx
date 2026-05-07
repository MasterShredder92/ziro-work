"use client";

import Link from "next/link";
import { useState } from "react";
import type { InvoiceWithLines } from "@/lib/billing/models";
import { formatCents, formatDate, formatDateTime, statusTone } from "./format";
import { PaymentEntryModal } from "./PaymentEntryModal";

type Props = {
  invoice: InvoiceWithLines;
  tenantId: string;
};

export function InvoiceDetail({ invoice, tenantId }: Props) {
  const [openPayment, setOpenPayment] = useState(false);

  async function voidInvoice() {
    if (!confirm("Void this invoice?")) return;
    const reason = prompt("Reason (optional):") ?? undefined;
    await fetch(`/api/billing/invoices/${invoice.id}/void?tenantId=${tenantId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    window.location.reload();
  }

  const balance = invoice.balance_cents ?? 0;

  const timeline: Array<{ ts: string | null; text: string }> = [
    { ts: invoice.created_at, text: "Invoice created" },
    { ts: invoice.issued_at, text: "Issued" },
    { ts: invoice.sent_at, text: "Sent" },
    ...invoice.payments
      .slice()
      .sort((a, b) => (a.paid_at > b.paid_at ? 1 : -1))
      .map((p) => ({
        ts: p.paid_at,
        text: `Payment recorded — ${formatCents(p.amount_cents, invoice.currency)} (${p.method})`,
      })),
    invoice.paid_at ? { ts: invoice.paid_at, text: "Marked paid" } : null,
    invoice.voided_at
      ? { ts: invoice.voided_at, text: `Voided${invoice.void_reason ? ` — ${invoice.void_reason}` : ""}` }
      : null,
  ].filter(Boolean) as Array<{ ts: string | null; text: string }>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Invoice {invoice.number ?? invoice.id.slice(0, 8)}
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--z-fg)]">
            {invoice.description ?? "Invoice"}
          </h1>
          <div className="mt-1 text-sm text-[var(--z-muted)]">
            Due {formatDate(invoice.due_at)} · Issued {formatDate(invoice.issued_at)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase ${statusTone(
              invoice.status,
            )}`}
          >
            {invoice.status}
          </span>
          <button
            type="button"
            onClick={() => setOpenPayment(true)}
            disabled={balance <= 0}
            className="inline-flex h-9 items-center rounded-[var(--z-radius-md)] border border-[#c4f036]/40 bg-[#c4f036]/15 px-3 text-sm font-semibold text-[#c4f036] disabled:opacity-40"
          >
            Record payment
          </button>
          <button
            type="button"
            onClick={voidInvoice}
            disabled={invoice.status === "void"}
            className="inline-flex h-9 items-center rounded-[var(--z-radius-md)] border border-red-500/40 bg-red-500/10 px-3 text-sm font-semibold text-red-300 disabled:opacity-40"
          >
            Void
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Total" value={formatCents(invoice.total_cents, invoice.currency)} />
        <Kpi label="Paid" value={formatCents(invoice.amount_paid_cents, invoice.currency)} />
        <Kpi
          label="Balance"
          value={formatCents(balance, invoice.currency)}
          tone={balance > 0 ? "warn" : "ok"}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--z-fg)]">Line items</h2>
        <div className="overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
          <div
            className="grid border-b border-[var(--z-border)]"
            style={{
              gridTemplateColumns: "minmax(200px,1fr) 80px 120px 120px 80px",
            }}
          >
            {["Description", "Qty", "Unit", "Amount", "Tax"].map((c) => (
              <div
                key={c}
                className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]"
              >
                {c}
              </div>
            ))}
          </div>
          {invoice.lineItems.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-[var(--z-muted)]">
              No line items.
            </div>
          ) : (
            invoice.lineItems.map((li) => (
              <div
                key={li.id}
                className="grid border-b border-[var(--z-border)] last:border-b-0"
                style={{
                  gridTemplateColumns: "minmax(200px,1fr) 80px 120px 120px 80px",
                }}
              >
                <div className="px-4 py-3 text-sm text-[var(--z-fg)]">
                  {li.description}
                </div>
                <div className="px-4 py-3 text-sm tabular-nums text-[var(--z-muted)]">
                  {li.quantity}
                </div>
                <div className="px-4 py-3 text-sm tabular-nums text-[var(--z-muted)]">
                  {formatCents(li.unit_amount_cents, invoice.currency)}
                </div>
                <div className="px-4 py-3 text-sm tabular-nums text-[var(--z-fg)]">
                  {formatCents(li.amount_cents, invoice.currency)}
                </div>
                <div className="px-4 py-3 text-[11px] text-[var(--z-muted)]">
                  {li.taxable ? "Taxable" : "—"}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Panel title="Payments">
          {invoice.payments.length === 0 ? (
            <div className="text-sm text-[var(--z-muted)]">No payments recorded.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {invoice.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2"
                >
                  <div>
                    <div className="font-medium text-[var(--z-fg)]">
                      {formatCents(p.amount_cents, invoice.currency)}
                    </div>
                    <div className="text-[11px] text-[var(--z-muted)]">
                      {p.method} · {formatDateTime(p.paid_at)}
                    </div>
                  </div>
                  <span className="text-[11px] uppercase text-[var(--z-muted)]">
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Credits">
          {invoice.credits.length === 0 ? (
            <div className="text-sm text-[var(--z-muted)]">No credits applied.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {invoice.credits.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2"
                >
                  <div>
                    <div className="font-medium text-[var(--z-fg)]">
                      {formatCents(c.applied_cents, invoice.currency)} applied
                    </div>
                    <div className="text-[11px] text-[var(--z-muted)]">
                      of {formatCents(c.amount_cents, invoice.currency)} — {c.reason ?? "credit"}
                    </div>
                  </div>
                  <span className="text-[11px] uppercase text-[var(--z-muted)]">
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Panel title="Timeline">
          <ol className="space-y-2 text-sm">
            {timeline.map((e, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#c4f036]" />
                <div>
                  <div className="text-[var(--z-fg)]">{e.text}</div>
                  <div className="text-[11px] text-[var(--z-muted)]">
                    {formatDateTime(e.ts)}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="PDF preview">
          <div className="rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-bg)] p-6 text-center text-sm text-[var(--z-muted)]">
            PDF generation is queued at issue time. A rendered copy will be attached to
            invoice emails sent via the Templates OS.
            <div className="mt-3">
              <Link
                href={`/api/billing/invoices/${invoice.id}?tenantId=${tenantId}`}
                className="text-[#c4f036] hover:underline"
              >
                Download JSON
              </Link>
            </div>
          </div>
        </Panel>
      </section>

      {openPayment ? (
        <PaymentEntryModal
          invoiceId={invoice.id}
          tenantId={tenantId}
          maxAmountCents={balance}
          onClose={() => setOpenPayment(false)}
          onRecorded={() => window.location.reload()}
        />
      ) : null}
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  const toneClass =
    tone === "warn" ? "text-amber-300" : tone === "ok" ? "text-emerald-300" : "text-[var(--z-fg)]";
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {title}
      </div>
      {children}
    </div>
  );
}
