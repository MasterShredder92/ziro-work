"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";

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
}: InvoicesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [locationId, setLocationId] = useState(initialLocationId);

  const totalPages = Math.ceil(totalCount / pageSize);

  const navigate = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search, status, location_id: locationId });
  };

  const handleStatusChange = (s: string) => {
    setStatus(s);
    navigate({ search, status: s, location_id: locationId });
  };

  const handleLocationChange = (id: string) => {
    setLocationId(id);
    navigate({ search, status, location_id: id });
  };

  const handlePageChange = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <PageShell title="Invoices">
      <div className="space-y-6">
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

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="search"
              placeholder="Search name, email, invoice #…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
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

        {/* ── Table ── */}
        <div className="rounded-xl border border-[var(--z-border)] overflow-hidden">
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
    </PageShell>
  );
}

