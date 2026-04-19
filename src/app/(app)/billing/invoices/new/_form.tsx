"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LineItem = {
  description: string;
  quantity: number;
  unit_amount_cents: number;
  taxable: boolean;
};

export function NewInvoiceForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_amount_cents: 0, taxable: false },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/billing/invoices?tenantId=${tenantId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          description: description || undefined,
          due_at: dueAt ? new Date(dueAt).toISOString() : undefined,
          lineItems: items
            .filter((it) => it.description.trim().length > 0)
            .map((it) => ({
              description: it.description,
              quantity: it.quantity,
              unit_amount_cents: it.unit_amount_cents,
              taxable: it.taxable,
            })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to create invoice");
        return;
      }
      router.push(`/billing/invoices/${data.data.id}?tenantId=${tenantId}`);
    } finally {
      setSubmitting(false);
    }
  }

  const subtotal = items.reduce(
    (s, it) => s + it.quantity * it.unit_amount_cents,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="text-[var(--z-muted)]">Description</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 text-sm text-[var(--z-fg)]"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--z-muted)]">Due</span>
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="mt-1 h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 text-sm text-[var(--z-fg)]"
          />
        </label>
      </div>

      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">Line items</h2>
          <button
            type="button"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                { description: "", quantity: 1, unit_amount_cents: 0, taxable: false },
              ])
            }
            className="text-xs font-semibold text-[#00ff88] hover:underline"
          >
            + Add line
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="grid gap-2"
              style={{
                gridTemplateColumns: "1fr 80px 120px 80px 40px",
              }}
            >
              <input
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateItem(idx, { description: e.target.value })}
                className="h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 text-sm text-[var(--z-fg)]"
              />
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) =>
                  updateItem(idx, { quantity: Number(e.target.value) })
                }
                className="h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 text-sm text-[var(--z-fg)]"
              />
              <input
                type="number"
                min={0}
                placeholder="Unit (cents)"
                value={item.unit_amount_cents}
                onChange={(e) =>
                  updateItem(idx, {
                    unit_amount_cents: Number(e.target.value),
                  })
                }
                className="h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 text-sm text-[var(--z-fg)]"
              />
              <label className="flex items-center justify-center gap-2 text-xs text-[var(--z-muted)]">
                <input
                  type="checkbox"
                  checked={item.taxable}
                  onChange={(e) => updateItem(idx, { taxable: e.target.checked })}
                />
                Tax
              </label>
              <button
                type="button"
                onClick={() =>
                  setItems((prev) => prev.filter((_, i) => i !== idx))
                }
                className="text-sm text-[var(--z-muted)] hover:text-red-300"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 text-right text-sm text-[var(--z-muted)]">
          Subtotal: {(subtotal / 100).toFixed(2)}
        </div>
      </div>

      {error ? (
        <div className="rounded-[var(--z-radius-md)] border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-9 items-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="inline-flex h-9 items-center rounded-[var(--z-radius-md)] border border-[#00ff88]/40 bg-[#00ff88]/15 px-3 text-sm font-semibold text-[#00ff88] disabled:opacity-40"
        >
          {submitting ? "Creating…" : "Create invoice"}
        </button>
      </div>
    </div>
  );
}
