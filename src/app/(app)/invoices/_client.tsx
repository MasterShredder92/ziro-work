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

// ── Invoice Builder Modal ─────────────────────────────────────────────────────
// Full-featured invoice builder: line items, theme toggle, location logo,
// Google Review toggle, student/family linking, live total calculation.

type LineItem = {
  id: string;
  description: string;
  quantity: string;
  unit_price: string;
  is_makeup: boolean;
};

function newLineItem(): LineItem {
  return { id: Math.random().toString(36).slice(2), description: "", quantity: "1", unit_price: "", is_makeup: false };
}

function CreateInvoiceModal({ onClose }: { onClose: () => void }) {
  // ── Family / Student search ──
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<{ id: string; name: string; primary_email: string | null }[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = React.useState<string | null>(null);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [searching, setSearching] = React.useState(false);

  // ── Invoice fields ──
  const [customerName, setCustomerName] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [locationId, setLocationId] = React.useState("");
  const [dueDate, setDueDate] = React.useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [note, setNote] = React.useState("");
  const [lineItems, setLineItems] = React.useState<LineItem[]>([newLineItem()]);
  const [themePreference, setThemePreference] = React.useState<"dark" | "light">("dark");
  const [googleReview, setGoogleReview] = React.useState(false);

  // ── UI state ──
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [createdToken, setCreatedToken] = React.useState<string | null>(null);

  // ── Computed total ──
  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return sum + qty * price;
  }, 0);

  // ── Location logo ──
  const locationInfo = LOCATIONS.find(l => l.id === locationId);

  // ── Debounced family search ──
  React.useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/families?search=${encodeURIComponent(searchQuery)}&limit=8`);
        const j = await res.json();
        setSearchResults(j.data ?? []);
        setShowDropdown(true);
      } catch { /* noop */ }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function selectFamily(f: { id: string; name: string; primary_email: string | null }) {
    setSelectedFamilyId(f.id);
    setCustomerName(f.name);
    setCustomerEmail(f.primary_email ?? "");
    setSearchQuery(f.name);
    setShowDropdown(false);
  }

  // ── Line item helpers ──
  function updateItem(id: string, field: keyof LineItem, value: string | boolean) {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }
  function addItem() { setLineItems(prev => [...prev, newLineItem()]); }
  function removeItem(id: string) { setLineItems(prev => prev.filter(i => i.id !== id)); }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim()) { setError("Customer name is required."); return; }
    if (subtotal <= 0) { setError("Add at least one line item with a price."); return; }
    setSaving(true);
    setError(null);
    try {
      const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const payload = {
        family_id: selectedFamilyId,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || null,
        location_id: locationId || null,
        due_date: dueDate,
        notes: note.trim() || null,
        amount_cents: Math.round(subtotal * 100),
        subtotal_cents: Math.round(subtotal * 100),
        total_cents: Math.round(subtotal * 100),
        status: "draft",
        theme_preference: themePreference,
        google_review_enabled: googleReview,
        live_url_token: token,
        line_items: lineItems.filter(i => i.description.trim()).map(i => ({
          description: i.description.trim(),
          quantity: parseFloat(i.quantity) || 1,
          unit_price: parseFloat(i.unit_price) || 0,
          is_makeup_session: i.is_makeup,
        })),
      };
      const res = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed to create invoice");
      setCreatedToken(token);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
    setSaving(false);
  }

  // ── Success screen ──
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--z-border)] bg-[var(--z-bg)] p-8 text-center space-y-4">
          <div className="text-5xl">✅</div>
          <div className="text-lg font-bold text-[var(--z-fg)]">Invoice Created</div>
          <div className="text-sm text-[var(--z-muted)]">
            Draft saved. Share the live link with the family when ready.
          </div>
          {createdToken && (
            <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-xs font-mono text-[var(--z-fg)] break-all">
              /invoice/{createdToken}
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[var(--z-accent)] py-2.5 text-sm font-semibold text-[var(--z-on-accent)] hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Builder UI ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--z-border)] bg-[var(--z-bg)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--z-border)] px-6 py-4">
          <div>
            <div className="text-base font-bold text-[var(--z-fg)]">Invoice Builder</div>
            <div className="text-xs text-[var(--z-muted)]">Draft saves automatically — send when ready</div>
          </div>
          <button onClick={onClose} className="text-[var(--z-muted)] hover:text-[var(--z-fg)] text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ── Row 1: Theme + Location ── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Theme toggle */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Invoice Theme</label>
              <div className="flex rounded-lg border border-[var(--z-border)] overflow-hidden text-sm">
                {(["dark", "light"] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setThemePreference(t)}
                    className="flex-1 py-2 capitalize transition-colors"
                    style={{
                      background: themePreference === t ? "var(--z-accent)" : "var(--z-surface)",
                      color: themePreference === t ? "var(--z-on-accent)" : "var(--z-muted)",
                      fontWeight: themePreference === t ? 700 : 400,
                    }}
                  >
                    {t === "dark" ? "🌙 Dark" : "☀️ Light"}
                  </button>
                ))}
              </div>
            </div>
            {/* Location */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Location</label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
              >
                <option value="">All Locations</option>
                {LOCATIONS.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              {locationInfo && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: locationInfo.color }}>
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: locationInfo.color }} />
                  {locationInfo.name} logo will appear on invoice
                </div>
              )}
            </div>
          </div>

          {/* ── Row 2: Family search ── */}
          <div className="space-y-1.5 relative">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              Family / Customer <span className="text-[var(--z-accent)]">*</span>
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search family name…"
              className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
            />
            {searching && <div className="absolute right-3 top-8 text-xs text-[var(--z-muted)]">Searching…</div>}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 rounded-xl border border-[var(--z-border)] bg-[var(--z-bg)] shadow-xl overflow-hidden">
                {searchResults.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => selectFamily(f)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--z-surface-hover)] transition-colors"
                  >
                    <span className="font-medium text-[var(--z-fg)]">{f.name}</span>
                    {f.primary_email && <span className="ml-2 text-[var(--z-muted)] text-xs">{f.primary_email}</span>}
                  </button>
                ))}
              </div>
            )}
            {selectedFamilyId && (
              <p className="text-[10px] text-[var(--z-accent)]">✓ Family linked — name and email pre-filled</p>
            )}
          </div>

          {/* ── Row 3: Name + Email ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Customer Name <span className="text-[var(--z-accent)]">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Auto-filled from family"
                className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="Auto-filled from family"
                className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
              />
            </div>
          </div>

          {/* ── Row 4: Due Date + Note ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Due Date <span className="text-[var(--z-accent)]">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Note</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Optional note"
                className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
              />
            </div>
          </div>

          {/* ── Line Items ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Line Items</label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-semibold text-[var(--z-accent)] hover:opacity-80 transition-opacity"
              >
                + Add Item
              </button>
            </div>
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_90px_32px] gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] px-1">
              <span>Description</span>
              <span>Qty</span>
              <span>Unit Price</span>
              <span />
            </div>
            {lineItems.map(item => (
              <div key={item.id} className="grid grid-cols-[1fr_80px_90px_32px] gap-2 items-center">
                <div className="space-y-1">
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => updateItem(item.id, "description", e.target.value)}
                    placeholder="e.g. Guitar lesson – June"
                    className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-2.5 py-1.5 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
                  />
                  <label className="flex items-center gap-1.5 text-[10px] text-[var(--z-muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.is_makeup}
                      onChange={e => updateItem(item.id, "is_makeup", e.target.checked)}
                      className="rounded"
                    />
                    5th-week makeup
                  </label>
                </div>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={item.quantity}
                  onChange={e => updateItem(item.id, "quantity", e.target.value)}
                  className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-2.5 py-1.5 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={e => updateItem(item.id, "unit_price", e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-2.5 py-1.5 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={lineItems.length === 1}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--z-muted)] hover:text-red-400 disabled:opacity-30 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
            {/* Total */}
            <div className="flex justify-end pt-2 border-t border-[var(--z-border)]">
              <div className="text-sm font-bold text-[var(--z-fg)]">
                Total: <span className="text-[var(--z-accent)]">${subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ── Toggles ── */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-[var(--z-muted)] cursor-pointer select-none">
              <div
                onClick={() => setGoogleReview(v => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${googleReview ? "bg-[var(--z-accent)]" : "bg-[var(--z-surface-2)]"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${googleReview ? "translate-x-4" : ""}`} />
              </div>
              Google Review button on invoice
            </label>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2.5 text-sm font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !customerName.trim() || subtotal <= 0}
              className="flex-1 rounded-xl border border-[var(--z-accent)]/40 bg-[var(--z-accent)]/15 px-3 py-2.5 text-sm font-semibold text-[var(--z-accent)] disabled:opacity-40 hover:bg-[var(--z-accent)]/25 transition-colors"
            >
              {saving ? "Creating…" : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
