"use client";

import { useState } from "react";

type Props = {
  invoiceId: string;
  tenantId: string;
  maxAmountCents: number;
  onClose: () => void;
  onRecorded?: () => void;
};

const METHODS = ["manual", "card", "ach", "cash", "check", "square", "stripe"] as const;

export function PaymentEntryModal({
  invoiceId,
  tenantId,
  maxAmountCents,
  onClose,
  onRecorded,
}: Props) {
  const [amountCents, setAmountCents] = useState(maxAmountCents);
  const [method, setMethod] = useState<(typeof METHODS)[number]>("manual");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/billing/invoices/${invoiceId}/pay?tenantId=${tenantId}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            amount_cents: amountCents,
            method,
            reference: reference || undefined,
            notes: notes || undefined,
          }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? `Failed (${res.status})`);
        return;
      }
      onRecorded?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--z-fg)]">Record payment</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--z-muted)] hover:text-[var(--z-fg)]"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="text-[var(--z-muted)]">Amount (cents)</span>
            <input
              type="number"
              min={1}
              max={maxAmountCents}
              value={amountCents}
              onChange={(e) => setAmountCents(Number(e.target.value))}
              className="mt-1 h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 text-sm text-[var(--z-fg)]"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--z-muted)]">Method</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof method)}
              className="mt-1 h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 text-sm text-[var(--z-fg)]"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[var(--z-muted)]">Reference (check #, txn id)</span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="mt-1 h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 text-sm text-[var(--z-fg)]"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--z-muted)]">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
            />
          </label>
          {error ? (
            <div className="rounded-[var(--z-radius-md)] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          ) : null}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || amountCents <= 0}
            className="inline-flex h-9 items-center rounded-[var(--z-radius-md)] border border-[#c4f036]/40 bg-[#c4f036]/15 px-3 text-sm font-semibold text-[#c4f036] disabled:opacity-40"
          >
            {submitting ? "Recording…" : "Record payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
