"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Invoice } from "@/lib/billing/models";
import { formatCents, formatDate, statusTone } from "./format";

type Props = {
  invoices: Invoice[];
  tenantId: string;
};

const STATUS_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "open", label: "Open" },
  { id: "sent", label: "Sent" },
  { id: "partial", label: "Partial" },
  { id: "paid", label: "Paid" },
  { id: "overdue", label: "Overdue" },
  { id: "void", label: "Void" },
];

export function InvoiceList({ invoices, tenantId }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter && inv.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${inv.number ?? ""} ${inv.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [invoices, query, statusFilter]);

  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const anySelected = selectedIds.length > 0;

  async function bulkVoid() {
    for (const id of selectedIds) {
      await fetch(`/api/billing/invoices/${id}/void?tenantId=${tenantId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "Bulk void" }),
      });
    }
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by number or description"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 min-w-[220px] flex-1 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <Link
          href={`/billing/invoices/new?tenantId=${tenantId}`}
          className="ml-auto inline-flex h-9 items-center rounded-[var(--z-radius-md)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 text-sm font-semibold text-[#00ff88]"
        >
          + New invoice
        </Link>
        <button
          type="button"
          onClick={bulkVoid}
          disabled={!anySelected}
          className="inline-flex h-9 items-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)] disabled:opacity-40"
        >
          Void selected ({selectedIds.length})
        </button>
      </div>

      <div className="overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
        <div
          className="grid border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_2%)]"
          style={{
            gridTemplateColumns:
              "40px minmax(120px,1fr) minmax(180px,1.6fr) 120px 120px 120px 120px",
          }}
        >
          <div className="px-4 py-2.5" />
          {["Number", "Description", "Total", "Paid", "Balance", "Status"].map((c) => (
            <div
              key={c}
              className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]"
            >
              {c}
            </div>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-[var(--z-muted)]">
            No invoices match your filters.
          </div>
        ) : (
          filtered.map((inv) => (
            <div
              key={inv.id}
              className="grid border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/[0.02]"
              style={{
                gridTemplateColumns:
                  "40px minmax(120px,1fr) minmax(180px,1.6fr) 120px 120px 120px 120px",
              }}
            >
              <div className="flex items-center justify-center px-4 py-3">
                <input
                  type="checkbox"
                  checked={Boolean(selected[inv.id])}
                  onChange={(e) =>
                    setSelected((prev) => ({ ...prev, [inv.id]: e.target.checked }))
                  }
                />
              </div>
              <div className="px-4 py-3 text-sm text-[var(--z-fg)]">
                <Link
                  href={`/billing/invoices/${inv.id}?tenantId=${tenantId}`}
                  className="font-medium hover:underline"
                >
                  {inv.number ?? inv.id.slice(0, 8)}
                </Link>
                <div className="text-[11px] text-[var(--z-muted)]">
                  Due {formatDate(inv.due_at)}
                </div>
              </div>
              <div className="px-4 py-3 text-sm text-[var(--z-fg)] truncate">
                {inv.description ?? "—"}
              </div>
              <div className="px-4 py-3 text-sm tabular-nums text-[var(--z-fg)]">
                {formatCents(inv.total_cents, inv.currency)}
              </div>
              <div className="px-4 py-3 text-sm tabular-nums text-[var(--z-muted)]">
                {formatCents(inv.amount_paid_cents, inv.currency)}
              </div>
              <div className="px-4 py-3 text-sm tabular-nums text-amber-300">
                {formatCents(inv.balance_cents, inv.currency)}
              </div>
              <div className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase ${statusTone(
                    inv.status,
                  )}`}
                >
                  {inv.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
