"use client";
import React, { useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { BillingSummaryBar } from "@/components/billing/BillingSummaryBar";
import type { BillingMetrics } from "./page";

// ─── Location config ──────────────────────────────────────────────────────────
const LOCATIONS: { id: string; name: string; color: string }[] = [
  { id: "f7b52dd5-12ee-437f-9c60-f8adf454ac31", name: "Bellevue", color: "#7C3AED" },
  { id: "40c67ffc-91b5-46a9-94bd-6ddffdfb7638", name: "Gretna", color: "#16A34A" },
  { id: "cebd97d4-c241-4de2-8ade-49e5cc0070d5", name: "Elkhorn", color: "#0EA5E9" },
  { id: "d48229c1-b70a-4d29-893e-5079887dab76", name: "Omaha", color: "#DC2626" },
];

const LOCATION_MAP: Record<string, { name: string; color: string }> = Object.fromEntries(
  LOCATIONS.map((l) => [l.id, { name: l.name, color: l.color }])
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface InvoiceRow {
  id: string;
  family_id: string | null;
  status: string | null;
  amount_cents: number | null;
  invoice_number: string | null;
  due_date: string | null;
  paid_at: string | null;
  square_created_at: string | null;
  location_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  requested_amount: number | null;
  amount_paid: number | null;
  invoice_date: string | null;
  recurring_series_id: string | null;
}

interface InvoicesClientProps {
  invoices: InvoiceRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  paidTotal: number;
  unpaidTotal: number;
  overdueCount: number;
  initialStatus: string;
  initialLocationId: string;
  initialSearch: string;
  initialMonthOffset: number;
  viewLabel: string;
  billingMetrics?: BillingMetrics[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCents(cents: number | null | undefined): string {
  if (cents == null || isNaN(cents)) return "—";
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function statusBadge(status: string | null): { label: string; bg: string; color: string } {
  const s = (status ?? "").toUpperCase();
  switch (s) {
    case "PAID":
      return { label: "Paid", bg: "rgba(34,197,94,0.15)", color: "#22C55E" };
    case "UNPAID":
      return { label: "Unpaid", bg: "rgba(239,68,68,0.15)", color: "#EF4444" };
    case "PARTIALLY_PAID":
      return { label: "Partial", bg: "rgba(245,158,11,0.15)", color: "#F59E0B" };
    case "SCHEDULED":
      return { label: "Scheduled", bg: "rgba(14,165,233,0.15)", color: "#0EA5E9" };
    case "DRAFT":
      return { label: "Draft", bg: "rgba(96,96,104,0.15)", color: "#909098" };
    case "CANCELLED":
    case "CANCELED":
      return { label: "Cancelled", bg: "rgba(96,96,104,0.15)", color: "#606068" };
    default:
      return { label: s || "Unknown", bg: "rgba(96,96,104,0.15)", color: "#909098" };
  }
}

function isOverdue(invoice: InvoiceRow): boolean {
  if (!invoice.due_date) return false;
  if ((invoice.status ?? "").toUpperCase() === "PAID") return false;
  return new Date(invoice.due_date) < new Date();
}

// ─── Square Sync Button ─────────────────────────────────────────────────────
function SquareSyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();
  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/integrations/square/sync", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult(j.message ?? "Sync complete");
        router.refresh();
      } else {
        setResult(j.error ?? j.message ?? `Sync failed (${res.status})`);
      }
    } catch {
      setResult("Sync failed — check connection");
    } finally {
      setSyncing(false);
      setTimeout(() => setResult(null), 4000);
    }
  }
  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex h-full items-center gap-2 rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] px-4 text-sm font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:border-[#00ff88]/30 disabled:opacity-50 transition-colors"
      >
        <span className={syncing ? "animate-spin" : ""}>⟳</span>
        {syncing ? "Syncing…" : "Sync Square"}
      </button>
      {result && <div className="text-[10px] text-[var(--z-muted)]">{result}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function InvoicesClient({
  invoices,
  totalCount,
  page,
  pageSize,
  paidTotal,
  unpaidTotal,
  overdueCount,
  initialStatus,
  initialLocationId,
  initialSearch,
  initialMonthOffset,
  viewLabel,
  billingMetrics,
}: InvoicesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [locationId, setLocationId] = useState(initialLocationId);
  const [monthOffset, setMonthOffset] = useState(initialMonthOffset);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  const navigate = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined && v !== "") params.set(k, v);
        else params.delete(k);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search, status, location_id: locationId, month_offset: String(monthOffset) });
  };

  const handleStatusChange = (s: string) => {
    setStatus(s);
    navigate({ search, status: s, location_id: locationId, month_offset: String(monthOffset) });
  };

  const handleLocationChange = (id: string) => {
    setLocationId(id);
    navigate({ search, status, location_id: id, month_offset: String(monthOffset) });
  };

  const handleMonthChange = (offset: number) => {
    setMonthOffset(offset);
    navigate({ search, status, location_id: locationId, month_offset: String(offset) });
  };

  const handlePageChange = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <PageShell title="Invoices">
      <div className="space-y-6">
        {/* ── Bub agent bar + Square sync ── */}
        <div className="flex items-stretch gap-3">
          <div className="flex-1">
          </div>
          <SquareSyncButton />
        </div>
        {/* ── Billing summary by location ── */}
        {billingMetrics && <BillingSummaryBar metrics={billingMetrics} />}
        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <div className="text-2xl font-extrabold text-[#22C55E]">
              {formatCents(paidTotal)}
            </div>
            <div className="text-xs text-[var(--z-muted)]">Total collected</div>
          </div>
          <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <div className="text-2xl font-extrabold text-[#EF4444]">
              {formatCents(unpaidTotal)}
            </div>
            <div className="text-xs text-[var(--z-muted)]">Outstanding</div>
          </div>
          <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <div className="text-2xl font-extrabold text-[#F59E0B]">{overdueCount}</div>
            <div className="text-xs text-[var(--z-muted)]">Overdue invoices</div>
          </div>
          <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <div className="text-2xl font-extrabold text-[var(--z-fg)]">{totalCount.toLocaleString()}</div>
            <div className="text-xs text-[var(--z-muted)]">Total invoices</div>
          </div>
        </div>

        {/* ── Month navigation + Create Invoice ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMonthChange(monthOffset - 1)}
              className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors"
            >
              ←
            </button>
            <span className="min-w-[160px] text-center text-sm font-semibold text-[var(--z-fg)]">{viewLabel}</span>
            <button
              onClick={() => handleMonthChange(monthOffset + 1)}
              disabled={monthOffset >= 1}
              className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm text-[var(--z-muted)] hover:text-[var(--z-fg)] disabled:opacity-40 transition-colors"
            >
              →
            </button>
            {monthOffset !== 0 && (
              <button
                onClick={() => handleMonthChange(0)}
                className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors"
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-[var(--z-accent)] px-4 py-1.5 text-sm font-semibold text-[var(--z-on-accent)] hover:opacity-90 transition-opacity"
          >
            + Create Invoice
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-3">

          <form onSubmit={handleSearch} className="flex w-full gap-2 sm:w-auto">
            <input
              type="search"
              placeholder="Search name, email, invoice #…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)] sm:w-64"
            />
            <button
              type="submit"
              className="h-9 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex rounded-lg border border-[var(--z-border)] overflow-hidden text-sm">
            {(["all", "unpaid", "paid", "partially_paid"] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className="px-3 py-1.5 capitalize transition-colors"
                style={{
                  background: status === s ? "var(--z-accent)" : "var(--z-surface)",
                  color: status === s ? "var(--z-on-accent)" : "var(--z-muted)",
                  fontWeight: status === s ? 700 : 400,
                }}
              >
                {s === "partially_paid" ? "Partial" : s}
              </button>
            ))}
          </div>

          <div className="flex rounded-lg border border-[var(--z-border)] overflow-hidden text-sm">
            <button
              onClick={() => handleLocationChange("")}
              className="px-3 py-1.5 transition-colors"
              style={{
                background: !locationId ? "var(--z-accent)" : "var(--z-surface)",
                color: !locationId ? "var(--z-on-accent)" : "var(--z-muted)",
                fontWeight: !locationId ? 700 : 400,
              }}
            >
              All
            </button>
            {LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleLocationChange(loc.id)}
                className="px-3 py-1.5 transition-colors"
                style={{
                  background: locationId === loc.id ? loc.color : "var(--z-surface)",
                  color: locationId === loc.id ? "#fff" : "var(--z-muted)",
                  fontWeight: locationId === loc.id ? 700 : 400,
                }}
              >
                {loc.name}
              </button>
            ))}
          </div>

          <span className="ml-auto text-sm text-[var(--z-muted)]">
            {totalCount.toLocaleString()} invoices
          </span>
        </div>

        {/* ── Table (desktop) ── */}
        <div className="hidden sm:block rounded-xl border border-[var(--z-border)] overflow-hidden">
          <div
            className="grid px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)]"
            style={{
              gridTemplateColumns: "1fr 100px 90px 100px 110px 100px 90px",
              background: "var(--z-surface)",
              borderBottom: "1px solid var(--z-border)",
            }}
          >
            <div>Customer</div>
            <div>Invoice #</div>
            <div>Studio</div>
            <div>Amount</div>
            <div>Due</div>
            <div>Paid</div>
            <div>Status</div>
          </div>

          {invoices.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-[var(--z-muted)]">
              No invoices match your filters.
            </div>
          ) : (
            invoices.map((inv) => {
              const badge = statusBadge(inv.status);
              const overdue = isOverdue(inv);
              const locInfo = inv.location_id ? LOCATION_MAP[inv.location_id] : null;

              return (
                <div
                  key={inv.id}
                  className="grid items-center border-b px-4 py-3 text-sm transition-colors hover:bg-white/[0.02]"
                  style={{
                    gridTemplateColumns: "1fr 100px 90px 100px 110px 100px 90px",
                    borderColor: "var(--z-border)",
                  }}
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[var(--z-fg)]">
                      {inv.customer_name || "—"}
                    </div>
                    {inv.customer_email && (
                      <div className="truncate text-xs text-[var(--z-muted)]">
                        {inv.customer_email}
                      </div>
                    )}
                    {inv.family_id && (
                      <Link
                        href={`/crm/families/${inv.family_id}`}
                        className="text-[10px] hover:underline"
                        style={{ color: "var(--z-accent)" }}
                      >
                        View family →
                      </Link>
                    )}
                  </div>

                  <div className="truncate text-xs text-[var(--z-muted)]">
                    {inv.invoice_number || "—"}
                  </div>

                  <div>
                    {locInfo ? (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          background: `${locInfo.color}22`,
                          color: locInfo.color,
                        }}
                      >
                        {locInfo.name}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--z-muted)]">—</span>
                    )}
                  </div>

                  <div className="font-semibold text-[var(--z-fg)]">
                    {formatCents(inv.amount_cents)}
                  </div>

                  <div
                    className="text-xs"
                    style={{ color: overdue ? "#EF4444" : "var(--z-muted)" }}
                  >
                    {formatDate(inv.due_date)}
                    {overdue && (
                      <span className="ml-1 text-[10px] font-bold text-[#EF4444]">
                        OVERDUE
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-[var(--z-muted)]">
                    {formatDate(inv.paid_at)}
                  </div>

                  <div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Cards (mobile) ── */}
        <div className="sm:hidden space-y-3">
          {invoices.length === 0 ? (
            <div className="rounded-xl border border-[var(--z-border)] px-6 py-12 text-center text-sm text-[var(--z-muted)]">
              No invoices match your filters.
            </div>
          ) : (
            invoices.map((inv) => {
              const badge = statusBadge(inv.status);
              const overdue = isOverdue(inv);
              const locInfo = inv.location_id ? LOCATION_MAP[inv.location_id] : null;
              return (
                <div
                  key={inv.id}
                  className="rounded-xl border px-4 py-3 space-y-1.5"
                  style={{
                    borderColor: overdue ? "#EF444466" : "var(--z-border)",
                    background: "var(--z-surface)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-bold text-[var(--z-fg)]">{inv.customer_name || "—"}</div>
                      {inv.customer_email && <div className="truncate text-xs text-[var(--z-muted)]">{inv.customer_email}</div>}
                    </div>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="font-semibold text-[var(--z-fg)]">{formatCents(inv.amount_cents)}</span>
                    {locInfo && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${locInfo.color}22`, color: locInfo.color }}>{locInfo.name}</span>}
                    {inv.invoice_number && <span className="text-[var(--z-muted)]">#{inv.invoice_number}</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[var(--z-muted)]">
                    {inv.due_date && <span style={{ color: overdue ? "#EF4444" : undefined }}>Due {formatDate(inv.due_date)}{overdue ? " · OVERDUE" : ""}</span>}
                    {inv.paid_at && <span>Paid {formatDate(inv.paid_at)}</span>}
                  </div>
                  {inv.family_id && (
                    <Link href={`/crm/families/${inv.family_id}`} className="text-[10px] hover:underline" style={{ color: "var(--z-accent)" }}>View family →</Link>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--z-muted)]">
              Page {page} of {totalPages} ({totalCount.toLocaleString()} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm font-semibold text-[var(--z-muted)] disabled:opacity-40 hover:text-[var(--z-fg)] transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm font-semibold text-[var(--z-muted)] disabled:opacity-40 hover:text-[var(--z-fg)] transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Invoice Modal ── */}
      {showCreateModal && (
        <CreateInvoiceModal onClose={() => setShowCreateModal(false)} />
      )}
    </PageShell>
  );
}

// ── Create Invoice Modal ─────────────────────────────────────────────────────
function CreateInvoiceModal({ onClose }: { onClose: () => void }) {
  // Family search autocomplete
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<{ id: string; name: string; primary_email: string | null }[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = React.useState<string | null>(null);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [searching, setSearching] = React.useState(false);

  // Invoice fields
  const [customerName, setCustomerName] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [amountDollars, setAmountDollars] = React.useState("");
  const [dueDate, setDueDate] = React.useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // Debounced family search
  React.useEffect(() => {
    if (!searchQuery.trim() || selectedFamilyId) { setSearchResults([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/families?search=${encodeURIComponent(searchQuery.trim())}&limit=10`);
        if (res.ok) {
          const j = await res.json();
          const items = (j?.data ?? []) as { id: string; name: string; primary_email: string | null }[];
          setSearchResults(items);
          setShowDropdown(items.length > 0);
        }
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery, selectedFamilyId]);

  function selectFamily(f: { id: string; name: string; primary_email: string | null }) {
    setSelectedFamilyId(f.id);
    setCustomerName(f.name);
    setCustomerEmail(f.primary_email ?? "");
    setSearchQuery(f.name);
    setShowDropdown(false);
    setSearchResults([]);
  }

  function clearFamily() {
    setSelectedFamilyId(null);
    setSearchQuery("");
    setCustomerName("");
    setCustomerEmail("");
    setSearchResults([]);
    setShowDropdown(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !amountDollars || !dueDate) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim() || null,
          family_id: selectedFamilyId,
          amount_cents: Math.round(parseFloat(amountDollars) * 100),
          due_date: dueDate,
          note: note.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? "Failed to create invoice");
      }
      setSuccess(true);
      setTimeout(() => { onClose(); window.location.reload(); }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl border border-[#2b2b2f] bg-[#0f0f12] p-6 shadow-2xl space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-white">Create Invoice</h3>
        {success ? (
          <p className="text-sm text-[#00ff88] font-semibold">Invoice created successfully!</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Family search autocomplete */}
            <div className="space-y-1 relative">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#909098]">
                Family <span className="text-[#00ff88]">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  autoFocus
                  required
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); if (selectedFamilyId) clearFamily(); }}
                  placeholder="Search by family name or email…"
                  className="w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white placeholder-[#505055] focus:border-[#00ff88]/50 focus:outline-none pr-8"
                />
                {searching && (
                  <span className="absolute right-3 text-[10px] text-[#505055]">searching…</span>
                )}
                {selectedFamilyId && (
                  <button type="button" onClick={clearFamily} className="absolute right-3 text-[#505055] hover:text-white text-xs">✕</button>
                )}
              </div>
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 rounded-xl border border-[#2b2b2f] bg-[#0f0f12] shadow-2xl overflow-hidden">
                  {searchResults.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => selectFamily(f)}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#1a1a1e] transition-colors"
                    >
                      <span className="text-white font-medium">{f.name}</span>
                      {f.primary_email && <span className="ml-2 text-[#505055] text-xs">{f.primary_email}</span>}
                    </button>
                  ))}
                </div>
              )}
              {selectedFamilyId && (
                <p className="text-[10px] text-[#00ff88]">Family selected — name and email pre-filled below</p>
              )}
            </div>

            {/* Auto-populated fields (editable) */}
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#909098]">Customer Name <span className="text-[#00ff88]">*</span></label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Auto-filled from family selection"
                className="w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white placeholder-[#505055] focus:border-[#00ff88]/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#909098]">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="Auto-filled from family selection"
                className="w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white placeholder-[#505055] focus:border-[#00ff88]/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#909098]">Amount ($) <span className="text-[#00ff88]">*</span></label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={amountDollars}
                  onChange={e => setAmountDollars(e.target.value)}
                  placeholder="45.00"
                  className="w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white placeholder-[#505055] focus:border-[#00ff88]/50 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#909098]">Due Date <span className="text-[#00ff88]">*</span></label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white focus:border-[#00ff88]/50 focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#909098]">Note</label>
              <textarea
                rows={2}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Optional note or description"
                className="w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white placeholder-[#505055] focus:border-[#00ff88]/50 focus:outline-none resize-none"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2.5 text-sm font-semibold text-[#909098] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !customerName.trim() || !amountDollars || !dueDate}
                className="flex-1 rounded-xl border border-[#00ff88]/40 bg-[#00ff88]/15 px-3 py-2.5 text-sm font-semibold text-[#00ff88] disabled:opacity-40 hover:bg-[#00ff88]/25 transition-colors"
              >
                {saving ? "Creating…" : "Create Invoice"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
