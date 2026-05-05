"use client";
import React, { useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import type { BillingMetrics } from "./page";

// ─── Location config ──────────────────────────────────────────────────────────
// Now driven by SSR (locationsList prop) — kept here only as a no-op fallback.
export type LocationOption = { id: string; name: string; color: string };

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
  locationsList: LocationOption[];
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
  locationsList,
}: InvoicesClientProps) {
  const LOCATIONS = locationsList;
  const LOCATION_MAP: Record<string, { name: string; color: string }> = React.useMemo(
    () => Object.fromEntries(LOCATIONS.map((l) => [l.id, { name: l.name, color: l.color }])),
    [LOCATIONS]
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [locationId, setLocationId] = useState(initialLocationId);
  const [monthOffset, setMonthOffset] = useState(initialMonthOffset);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"recurring" | "one-time" | null>(null);
  // Billing summary tab — independent from the list location filter
  const [summaryTab, setSummaryTab] = useState<string | null>(null);
  const returnFamilyId = searchParams.get("family_id") ?? null;

  // List is "active" once any filter has been explicitly applied
  const listIsActive = initialStatus !== "all" || !!initialLocationId || !!initialSearch;

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
        {/* ── Top bar: Sync ── */}
        <div className="flex items-center justify-end">
          <SquareSyncButton />
        </div>

        {/* ── Billing Summary: dropdown + single swapping card ── */}
        {billingMetrics && (() => {
          const allSchools = billingMetrics.find(m => m.locationId === null);
          const locationMetrics = billingMetrics.filter(m => m.locationId !== null);
          const activeMetric = summaryTab === null
            ? allSchools
            : locationMetrics.find(l => l.locationId === summaryTab);
          const fmtM = (cents: number) => cents ? `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "$0";
          const activeColor = summaryTab === null ? "#00ff88" : (locationMetrics.find(l => l.locationId === summaryTab)?.color ?? "#00ff88");
          return (
            <div className="space-y-3">
              {/* Location dropdown */}
              <div className="relative inline-block">
                <select
                  value={summaryTab ?? ""}
                  onChange={e => setSummaryTab(e.target.value === "" ? null : e.target.value)}
                  className="h-9 appearance-none rounded-lg border pl-3 pr-8 text-sm font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)] cursor-pointer"
                  style={{
                    borderColor: `${activeColor}66`,
                    background: "var(--z-surface)",
                    color: activeColor,
                  }}
                >
                  <option value="">All Locations</option>
                  {locationMetrics.map(l => (
                    <option key={l.locationId} value={l.locationId ?? ""}>{l.locationName}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: activeColor }}>&#9660;</span>
              </div>
              {/* Single metric card */}
              {activeMetric && (
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: `${activeMetric.color}33`,
                    background: "var(--z-surface)",
                  }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: activeMetric.color }} />
                    <span className="text-sm font-bold text-[var(--z-fg)]">{activeMetric.locationName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
                    {[
                      { label: "Collected", value: fmtM(activeMetric.collectedThisMonth), color: "#22C55E" },
                      { label: "Invoiced", value: fmtM(activeMetric.totalInvoicedThisMonth), color: "var(--z-fg)" },
                      { label: "Discounted", value: activeMetric.discountedThisMonth < 0 ? "—" : fmtM(activeMetric.discountedThisMonth), color: activeMetric.discountedThisMonth < 0 ? "var(--z-muted)" : "#F59E0B" },
                      { label: "Next Month", value: fmtM(activeMetric.nextMonthProjected), color: "#0EA5E9" },
                      { label: "Scheduled", value: fmtM(activeMetric.scheduledPayments), color: "#A78BFA" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="text-[10px] text-[var(--z-muted)] uppercase tracking-wider mb-0.5">{label}</div>
                        <div className="text-base font-bold" style={{ color }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── KPI strip ── */}
        {(() => {
          const kpis = [
            { label: "Collected", value: formatCents(paidTotal), color: "#22C55E" },
            { label: "Outstanding", value: formatCents(unpaidTotal), color: "#EF4444" },
            { label: "Scheduled", value: formatCents(billingMetrics?.find(m => m.locationId === null)?.scheduledPayments ?? 0), color: "#A78BFA" },
            { label: "Overdue", value: String(overdueCount), color: "#F59E0B" },
            { label: "Invoices", value: totalCount.toLocaleString(), color: "var(--z-fg)" },
          ];
          return (
            <>
              {/* Mobile: 2-col grid */}
              <div className="sm:hidden rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] grid grid-cols-2 divide-y divide-[var(--z-border)]">
                {kpis.map(({ label, value, color }, i) => (
                  <div
                    key={label}
                    className={`px-4 py-3${
                      i % 2 === 0 ? " border-r border-[var(--z-border)]" : ""
                    }${i === 4 ? " col-span-2 border-r-0" : ""}`}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-1">{label}</div>
                    <div className="text-lg font-extrabold" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>
              {/* Desktop: single horizontal strip */}
              <div className="hidden sm:flex rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] divide-x divide-[var(--z-border)] overflow-hidden">
                {kpis.map(({ label, value, color }) => (
                  <div key={label} className="flex-1 px-4 py-3 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-1">{label}</div>
                    <div className="text-base font-extrabold" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>
            </>
          );
        })()}

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
            onClick={() => { setInvoiceType(null); setShowCreateModal(true); }}
            className="rounded-lg bg-[var(--z-accent)] px-4 py-1.5 text-sm font-semibold text-[var(--z-on-accent)] hover:opacity-90 transition-opacity"
          >
            + Create Invoice
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="space-y-3">
          {/* Search row */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="search"
              placeholder="Search name, email, invoice #…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 flex-1 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)] sm:max-w-72"
            />
            <button
              type="submit"
              className="h-9 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-4 text-sm font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors"
            >
              Search
            </button>
            <span className="ml-auto flex items-center text-sm text-[var(--z-muted)]">
              {totalCount.toLocaleString()} invoices
            </span>
          </form>
          {/* Status + Location dropdowns */}
          <div className="flex flex-wrap gap-2">
            {/* Status dropdown */}
            <div className="relative">
              <select
                value={status}
                onChange={e => handleStatusChange(e.target.value)}
                className="h-9 appearance-none rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] pl-3 pr-8 text-sm font-semibold text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partial</option>
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--z-muted)]">&#9660;</span>
            </div>
            {/* Location dropdown */}
            <div className="relative">
              <select
                value={locationId}
                onChange={e => handleLocationChange(e.target.value)}
                className="h-9 appearance-none rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] pl-3 pr-8 text-sm font-semibold text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)] cursor-pointer"
              >
                <option value="">All Locations</option>
                {LOCATIONS.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--z-muted)]">&#9660;</span>
            </div>
          </div>
        </div>

        {/* ── Invoice list (lazy — only shown when a filter is active) ── */}
        {!listIsActive ? (
          <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] px-6 py-14 text-center">
            <div className="text-sm font-semibold text-[var(--z-fg)] mb-1">Select a filter to view invoices</div>
            <div className="text-xs text-[var(--z-muted)]">Use the Status or Location dropdowns, or search by name, email, or invoice #.</div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
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
                <div className="px-6 py-12 text-center text-sm text-[var(--z-muted)]">No invoices match your filters.</div>
              ) : (
                invoices.map((inv) => {
                  const badge = statusBadge(inv.status);
                  const overdue = isOverdue(inv);
                  const locInfo = inv.location_id ? LOCATION_MAP[inv.location_id] : null;
                  const href = inv.family_id ? `/crm/families/${inv.family_id}?tab=billing` : null;
                  return (
                    <Link
                      key={inv.id}
                      href={href ?? "#"}
                      className="grid items-center border-b px-4 py-3 text-sm transition-colors hover:bg-[var(--z-accent)]/5 cursor-pointer"
                      style={{
                        gridTemplateColumns: "1fr 100px 90px 100px 110px 100px 90px",
                        borderColor: "var(--z-border)",
                        textDecoration: "none",
                      }}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-[var(--z-fg)]">{inv.customer_name || "—"}</div>
                        {inv.customer_email && <div className="truncate text-xs text-[var(--z-muted)]">{inv.customer_email}</div>}
                      </div>
                      <div className="truncate text-xs text-[var(--z-muted)]">{inv.invoice_number || "—"}</div>
                      <div>
                        {locInfo ? (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${locInfo.color}22`, color: locInfo.color }}>{locInfo.name}</span>
                        ) : (
                          <span className="text-xs text-[var(--z-muted)]">-</span>
                        )}
                      </div>
                      <div className="font-semibold text-[var(--z-fg)]">{formatCents(inv.amount_cents)}</div>
                      <div className="text-xs" style={{ color: overdue ? "#EF4444" : "var(--z-muted)" }}>
                        {formatDate(inv.due_date)}
                        {overdue && <span className="ml-1 text-[10px] font-bold text-[#EF4444]">OVERDUE</span>}
                      </div>
                      <div className="text-xs text-[var(--z-muted)]">{formatDate(inv.paid_at)}</div>
                      <div>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {invoices.length === 0 ? (
                <div className="rounded-xl border border-[var(--z-border)] px-6 py-12 text-center text-sm text-[var(--z-muted)]">No invoices match your filters.</div>
              ) : (
                invoices.map((inv) => {
                  const badge = statusBadge(inv.status);
                  const overdue = isOverdue(inv);
                  const locInfo = inv.location_id ? LOCATION_MAP[inv.location_id] : null;
                  const href = inv.family_id ? `/crm/families/${inv.family_id}?tab=billing` : null;
                  return (
                    <Link
                      key={inv.id}
                      href={href ?? "#"}
                      className="block rounded-xl border px-4 py-3 space-y-1.5 transition-colors hover:border-[var(--z-accent)]/40"
                      style={{
                        borderColor: overdue ? "#EF444466" : "var(--z-border)",
                        background: "var(--z-surface)",
                        textDecoration: "none",
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
                      <div className="text-[10px]" style={{ color: "var(--z-accent)" }}>View billing →</div>
                    </Link>
                  );
                })
              )}
            </div>
          </>
        )}

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

      {/* ── Invoice Type Picker ── */}
      {showCreateModal && invoiceType === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border shadow-2xl p-8 space-y-6"
            style={{ background: "var(--z-surface)", borderColor: "var(--z-border)" }}>
            <div>
              <div className="text-base font-bold text-[var(--z-fg)]">What type of invoice?</div>
              <div className="text-xs text-[var(--z-muted)] mt-1">Choose before building</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setInvoiceType("recurring")}
                className="flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all hover:border-[var(--z-accent)]"
                style={{ borderColor: "var(--z-border)", background: "var(--z-bg)" }}
              >
                <span className="text-2xl">🔁</span>
                <span className="text-sm font-bold text-[var(--z-fg)]">Recurring</span>
                <span className="text-[10px] text-[var(--z-muted)] text-center leading-relaxed">Sends 1st of each month<br/>forever</span>
              </button>
              <button
                onClick={() => setInvoiceType("one-time")}
                className="flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all hover:border-[var(--z-accent)]"
                style={{ borderColor: "var(--z-border)", background: "var(--z-bg)" }}
              >
                <span className="text-2xl">1×</span>
                <span className="text-sm font-bold text-[var(--z-fg)]">One-Time</span>
                <span className="text-[10px] text-[var(--z-muted)] text-center leading-relaxed">Single invoice,<br/>no recurrence</span>
              </button>
            </div>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors"
            >Cancel</button>
          </div>
        </div>
      )}

      {/* ── Create Invoice Modal ── */}
      {showCreateModal && invoiceType !== null && (
        <CreateInvoiceModal
          isRecurringDefault={invoiceType === "recurring"}
          returnFamilyId={returnFamilyId}
          locations={LOCATIONS}
          onClose={() => { setShowCreateModal(false); setInvoiceType(null); }}
        />
      )}
    </PageShell>
  );
}

// ── Invoice Builder Modal ─────────────────────────────────────────────────────
// Full-featured invoice builder: line items, theme toggle, location logo,
// Google Review toggle, student/family linking, live total calculation.


// ─── Line item type ────────────────────────────────────────────────────────
type LineItem = {
  id: string;
  service_id: string | null;
  description: string;
  quantity: string;
  unit_price: string;
  is_makeup: boolean;
  is_fifth_week: boolean;
  sessions_estimated?: boolean;
  rate_missing?: boolean;
  student_id?: string | null;
};

type ServiceOption = {
  id: string;
  name: string;
  sub_category: string | null;
  unit_price: number;
  unit_label: string;
  is_core: boolean;
};

function newLineItem(): LineItem {
  return {
    id: Math.random().toString(36).slice(2),
    service_id: null,
    description: "",
    quantity: "1",
    unit_price: "",
    is_makeup: false,
    is_fifth_week: false,
  };
}

function CreateInvoiceModal({
  onClose,
  isRecurringDefault = true,
  returnFamilyId = null,
  locations,
}: {
  onClose: () => void;
  isRecurringDefault?: boolean;
  returnFamilyId?: string | null;
  locations: LocationOption[];
}) {
  const LOCATIONS = locations;
  const router = useRouter();

  // ── Services catalog ──
  const [services, setServices] = React.useState<ServiceOption[]>([]);
  React.useEffect(() => {
    fetch("/api/settings/services")
      .then(r => r.json())
      .then(j => setServices(j.data ?? []))
      .catch(() => {});
  }, []);

  // ── Family search ──
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<{ id: string; name: string; primary_email: string | null; primary_contact_name: string | null }[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = React.useState<string | null>(null);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [searching, setSearching] = React.useState(false);

  // ── Invoice fields ──
  const [customerName, setCustomerName] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [locationId, setLocationId] = React.useState("");
  // Default due date = 1st of next month
  const [dueDate, setDueDate] = React.useState(() => {
    const d = new Date();
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [note, setNote] = React.useState("");
  const [lineItems, setLineItems] = React.useState<LineItem[]>([newLineItem()]);
  // Theme is locked to light — single immutable invoice template across all tenants.
  const themePreference: "light" = "light";
  const [googleReview, setGoogleReview] = React.useState(false);
  // OFF by default. Opt-in per invoice. Square push is dormant until user checks this box.
  const [pushToSquare, setPushToSquare] = React.useState(false);
  // Recurring: set by type picker, not editable inside the builder
  const isRecurring = isRecurringDefault;

  // ── UI state ──
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [createdToken, setCreatedToken] = React.useState<string | null>(null);
  const [createdPdfUrl, setCreatedPdfUrl] = React.useState<string | null>(null);
  const [createdSquareUrl, setCreatedSquareUrl] = React.useState<string | null>(null);
  const [createdAutoCharge, setCreatedAutoCharge] = React.useState<boolean>(false);
  const [createdSquareError, setCreatedSquareError] = React.useState<string | null>(null);

  // ── Computed total ──
  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return sum + qty * price;
  }, 0);

  const locationInfo = LOCATIONS.find(l => l.id === locationId);

  // ── Pre-fill family when launched from family profile ──
  React.useEffect(() => {
    if (!returnFamilyId) return;
    fetch(`/api/crm/families/${returnFamilyId}`, { headers: { "x-tenant-id": "" } })
      .then(r => r.json())
      .then(j => {
        const f = j.data;
        if (!f) return;
        setSelectedFamilyId(f.id);
        setCustomerName(f.name ?? "");
        setCustomerEmail(f.primary_email ?? "");
        setSearchQuery(f.name ?? "");
        applyBillingDefaults(f.id);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnFamilyId]);

  // ── Auto-fill location + line items from family billing defaults ──
  async function applyBillingDefaults(familyId: string) {
    try {
      const res = await fetch(`/api/families/${familyId}/billing-defaults`);
      if (!res.ok) return;
      const j = await res.json();
      // Auto-set location
      if (j.location?.id) setLocationId(j.location.id);
      // Build prefilled line items, one per active student
      const items: LineItem[] = (j.line_items ?? []).map((li: {
        student_id: string;
        student_name: string;
        instrument: string;
        description: string;
        quantity: number;
        unit_price: number;
        sessions_estimated: boolean;
        rate_missing: boolean;
      }) => ({
        id: Math.random().toString(36).slice(2),
        service_id: null,
        description: li.description,
        quantity: String(li.quantity),
        unit_price: li.unit_price > 0 ? String(li.unit_price) : "",
        is_makeup: false,
        is_fifth_week: false,
        sessions_estimated: li.sessions_estimated,
        rate_missing: li.rate_missing,
        student_id: li.student_id,
      }));
      if (items.length > 0) setLineItems(items);
    } catch { /* noop */ }
  }
  // ── Debounced family search — uses dedicated /api/families/search ──
  React.useEffect(() => {
    if (searchQuery.length < 1) { setSearchResults([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/families/search?q=${encodeURIComponent(searchQuery)}`);
        const j = await res.json();
        setSearchResults(j.data ?? []);
        setShowDropdown(true);
      } catch { /* noop */ }
      setSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function selectFamily(f: { id: string; name: string; primary_email: string | null; primary_contact_name: string | null }) {
    setSelectedFamilyId(f.id);
    setCustomerName(f.name);
    setCustomerEmail(f.primary_email ?? "");
    setSearchQuery(f.name);
    setShowDropdown(false);
    applyBillingDefaults(f.id);
  }

  // ── Line item helpers ──
  function updateItem(id: string, field: keyof LineItem, value: string | boolean | null) {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }

  function selectService(itemId: string, svc: ServiceOption) {
    setLineItems(prev => prev.map(item =>
      item.id === itemId
        ? {
            ...item,
            service_id: svc.id,
            description: svc.sub_category ? `${svc.name} — ${svc.sub_category}` : svc.name,
            unit_price: svc.unit_price > 0 ? String(svc.unit_price) : item.unit_price,
          }
        : item
    ));
  }

  function addItem() { setLineItems(prev => [...prev, newLineItem()]); }
  function removeItem(id: string) { setLineItems(prev => prev.filter(i => i.id !== id)); }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFamilyId && !customerName.trim()) {
      setError("Select a family or enter a customer name.");
      return;
    }
    const validItems = lineItems.filter(i => i.description.trim() && parseFloat(i.unit_price) > 0);
    if (validItems.length === 0) {
      setError("Add at least one line item with a price.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const totalCents = Math.round(subtotal * 100);
      const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const res = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail || null,
          family_id: selectedFamilyId,
          location_id: locationId || null,
          amount_cents: totalCents,
          subtotal_cents: totalCents,
          total_cents: totalCents,
          due_date: dueDate,
          notes: note || null,
          theme_preference: themePreference,
          google_review_enabled: googleReview,
          live_url_token: token,
          is_recurring: isRecurring,
          recurring_day: 1,
          push_to_square: pushToSquare,
          line_items: validItems.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity) || 1,
            unit_price: parseFloat(item.unit_price) || 0,
            student_id: item.student_id ?? null,
            is_makeup_session: item.is_makeup,
            is_fifth_week: item.is_fifth_week,
            session_date: null,
          })),
        }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? "Failed to create invoice"); return; }
      setCreatedToken(token);
      setCreatedPdfUrl((j?.data?.pdf_url as string | null) ?? null);
      setCreatedSquareUrl((j?.data?.square_public_url as string | null) ?? null);
      setCreatedAutoCharge(!!j?.data?.square_auto_charge);
      setCreatedSquareError((j?.data?.square_push_error as string | null) ?? null);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error");
    } finally {
      setSaving(false);
    }
  }

  // ── Core 4 first in service dropdown ──
  const coreServices = services.filter(s => s.is_core);
  const otherServices = services.filter(s => !s.is_core);

  if (success) {
    const familyTarget = returnFamilyId || selectedFamilyId;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div
          className="w-full max-w-sm rounded-2xl border shadow-2xl p-8 text-center space-y-4"
          style={{ background: "var(--z-surface)", borderColor: "var(--z-border)" }}
        >
          <div className="text-4xl">✅</div>
          <div className="text-lg font-bold text-[var(--z-fg)]">Invoice Created</div>
          <div className="text-sm text-[var(--z-muted)]">
            Saved to the family record.
          </div>

          {createdSquareUrl ? (
            <div className="text-xs rounded-lg p-3 text-left" style={{ background: "#0f1a12", border: "1px solid #1f3a25", color: "#7fffac" }}>
              <div className="font-bold mb-1">✓ Pushed to Square</div>
              <div className="text-[var(--z-muted)] leading-snug">
                {createdAutoCharge
                  ? "Square will auto-charge the card on file on the due date."
                  : "Square emailed the family. They’ll save a card on first payment."}
              </div>
              <a href={createdSquareUrl} target="_blank" rel="noopener" className="underline text-[var(--z-accent)] mt-1 inline-block">
                View on Square →
              </a>
            </div>
          ) : createdSquareError ? (
            <div className="text-xs rounded-lg p-3 text-left" style={{ background: "#1a0f0f", border: "1px solid #3a1f1f", color: "#ff9b9b" }}>
              <div className="font-bold mb-1">⚠ Square push failed</div>
              <div className="text-[var(--z-muted)] leading-snug">{createdSquareError}</div>
            </div>
          ) : null}

          {isRecurring && (
            <div className="text-xs text-[var(--z-muted)]">Recurring billing is active — next invoice generates on the 1st.</div>
          )}

          {(createdPdfUrl || createdToken) && (
            <a
              href={createdPdfUrl ?? `/invoice/${createdToken}`}
              target="_blank"
              rel="noopener"
              className="block w-full py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
              style={{ background: "var(--z-accent)", color: "var(--z-on-accent)" }}
            >
              {createdPdfUrl ? "View Invoice PDF →" : "View Invoice →"}
            </a>
          )}

          <button
            onClick={() => {
              if (familyTarget) {
                router.push(`/crm/families/${familyTarget}`);
              } else {
                onClose();
                router.refresh();
              }
            }}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 border"
            style={{
              background: "transparent",
              borderColor: "var(--z-border)",
              color: "var(--z-fg)",
            }}
          >
            {familyTarget ? "Go to Family" : "Done"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl"
        style={{ background: "var(--z-surface)", borderColor: "var(--z-border)" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: "var(--z-surface)", borderColor: "var(--z-border)" }}
        >
          <div>
            <div className="text-sm font-bold text-[var(--z-fg)]">New Invoice</div>
            <div className="text-xs text-[var(--z-muted)]">Auto-saves to family record — no manual sharing needed</div>
          </div>
          <button onClick={onClose} className="text-[var(--z-muted)] hover:text-[var(--z-fg)] text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Row 1: Location (full width) — invoice template is locked white */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Location</label>
            <select
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
            >
              <option value="">All Locations</option>
              {LOCATIONS.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            {locationInfo && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: locationInfo.color }}>
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: locationInfo.color }} />
                {locationInfo.name}
              </div>
            )}
          </div>

          {/* Family search */}
          <div className="space-y-1.5 relative">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              Family <span style={{ color: "var(--z-accent)" }}>*</span>
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); if (!e.target.value) { setSelectedFamilyId(null); } }}
              placeholder="Search by family name, email, or phone…"
              className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
            />
            {searching && <div className="absolute right-3 top-8 text-xs text-[var(--z-muted)]">Searching…</div>}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-20 w-full mt-1 rounded-xl border border-[var(--z-border)] bg-[var(--z-bg)] shadow-xl overflow-hidden">
                {searchResults.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => selectFamily(f)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--z-surface)] text-left transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--z-accent)", color: "var(--z-on-accent)" }}>
                      {f.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--z-fg)]">{f.name}</div>
                      {f.primary_email && <div className="text-xs text-[var(--z-muted)]">{f.primary_email}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && searchResults.length === 0 && searchQuery.length >= 1 && !searching && (
              <div className="absolute z-20 w-full mt-1 rounded-xl border border-[var(--z-border)] bg-[var(--z-bg)] px-4 py-3 text-sm text-[var(--z-muted)] shadow-xl">
                No families found — try a different name or email
              </div>
            )}
            {selectedFamilyId && (
              <div className="text-xs mt-1" style={{ color: "var(--z-accent)" }}>
                ✓ Linked to family record — invoice will auto-save here
              </div>
            )}
          </div>

          {/* Customer name + email (auto-filled from family) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Auto-filled from family"
                className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="Auto-filled from family"
                className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
              />
            </div>
          </div>

          {/* Due date + recurring */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Billing Cadence</label>
              <div
                className="flex items-center gap-2 rounded-lg border border-[var(--z-border)] px-4 py-2.5 text-sm font-semibold"
                style={{ background: "var(--z-bg)", color: "var(--z-accent)" }}
              >
                <span>{isRecurring ? "🔁" : "1×"}</span>
                <span>{isRecurring ? "Recurring — sends 1st of each month" : "One-Time"}</span>
              </div>
              {isRecurring && (
                <div className="text-[10px] text-[var(--z-muted)]">Sends 1st of each month in perpetuity</div>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Line Items</label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-semibold hover:opacity-80 transition-opacity"
                style={{ color: "var(--z-accent)" }}
              >
                + Add Line
              </button>
            </div>

            {lineItems.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-xl border p-3 space-y-2"
                style={{ borderColor: "var(--z-border)", background: "var(--z-bg)" }}
              >
                {/* Service selector */}
                {services.length > 0 && (
                  <select
                    value={item.service_id ?? ""}
                    onChange={e => {
                      const svc = services.find(s => s.id === e.target.value);
                      if (svc) selectService(item.id, svc);
                      else updateItem(item.id, "service_id", null);
                    }}
                    className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-xs text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
                  >
                    <option value="">— Select service —</option>
                    {coreServices.length > 0 && (
                      <optgroup label="Core 4">
                        {coreServices.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.sub_category ? `${s.name} — ${s.sub_category}` : s.name}
                            {s.unit_price > 0 ? ` ($${s.unit_price})` : ""}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {otherServices.length > 0 && (
                      <optgroup label="Other Services">
                        {otherServices.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.sub_category ? `${s.name} — ${s.sub_category}` : s.name}
                            {s.unit_price > 0 ? ` ($${s.unit_price})` : ""}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                )}

                <div className="grid grid-cols-12 gap-2">
                  {/* Description */}
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => updateItem(item.id, "description", e.target.value)}
                    placeholder="Description"
                    className="col-span-6 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-xs text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
                  />
                  {/* Qty */}
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={item.quantity}
                    onChange={e => updateItem(item.id, "quantity", e.target.value)}
                    placeholder="Qty"
                    className="col-span-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1.5 text-xs text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
                  />
                  {/* Unit price */}
                  <div className="col-span-3 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--z-muted)]">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={e => updateItem(item.id, "unit_price", e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] pl-5 pr-2 py-1.5 text-xs text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
                    />
                  </div>
                  {/* Remove */}
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="col-span-1 text-[var(--z-muted)] hover:text-red-400 transition-colors text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Auto-fill warnings */}
                {(item.sessions_estimated || item.rate_missing) && (
                  <div className="flex flex-wrap gap-2">
                    {item.sessions_estimated && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}
                        title="sessions_per_month not set on student record — defaulted to 4"
                      >
                        ⚠ Sessions estimated (4)
                      </span>
                    )}
                    {item.rate_missing && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}
                        title="rate_tier not set on family — enter unit price manually"
                      >
                        ⚠ Family rate missing
                      </span>
                    )}
                  </div>
                )}
                {/* Flags */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-[var(--z-muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.is_makeup}
                      onChange={e => updateItem(item.id, "is_makeup", e.target.checked)}
                      className="accent-[var(--z-accent)]"
                    />
                    Makeup session
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-[var(--z-muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.is_fifth_week}
                      onChange={e => updateItem(item.id, "is_fifth_week", e.target.checked)}
                      className="accent-[var(--z-accent)]"
                    />
                    5th-week (pre-paid, no charge)
                  </label>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-end pt-1">
              <div className="text-sm font-bold" style={{ color: "var(--z-accent)" }}>
                Total: ${subtotal.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Notes (optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Any additional notes for this invoice…"
              className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)] resize-none"
            />
          </div>

          {/* Google review toggle */}
          <label className="flex items-center gap-2 text-sm text-[var(--z-fg)] cursor-pointer">
            <input
              type="checkbox"
              checked={googleReview}
              onChange={e => setGoogleReview(e.target.checked)}
              className="accent-[var(--z-accent)]"
            />
            Include Google Review button on invoice
          </label>

          {/* Square push opt-in — OFF by default to prevent double-billing */}
          <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] p-3 space-y-1">
            <label className="flex items-center gap-2 text-sm text-[var(--z-fg)] cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={pushToSquare}
                onChange={e => setPushToSquare(e.target.checked)}
                className="accent-[var(--z-accent)]"
              />
              Send to Square (auto-charge family)
            </label>
            <p className="text-xs text-[var(--z-muted)] pl-6 leading-snug">
              When checked, Square will email the family and auto-charge if a card is on file. Leave OFF to save the invoice in ZiroWork only — useful while you migrate off Square’s own recurring schedules so families aren’t double-billed.
            </p>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-[var(--z-border)] text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: "var(--z-accent)", color: "var(--z-on-accent)" }}
            >
              {saving ? "Creating…" : isRecurring ? "Create Recurring Invoice" : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
