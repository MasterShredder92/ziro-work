"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  is_makeup_session: boolean;
  is_fifth_week: boolean;
  session_date: string | null;
  sort_order: number;
};

type InvoiceData = {
  id: string;
  status: string;
  total_cents: number;
  subtotal_cents: number;
  discount_cents: number | null;
  due_date: string;
  issued_at: string;
  paid_at: string | null;
  description: string | null;
  notes: string | null;
  theme_preference: "dark" | "light";
  google_review_enabled: boolean;
  metadata: { customer_name?: string; customer_email?: string } | null;
};

type TenantData = {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
};

type LocationData = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function statusConfig(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
      return { label: "Paid", bg: "#00b85420", color: "#00b854", border: "#00b85440" };
    case "draft":
      return { label: "Draft", bg: "#60606020", color: "#909098", border: "#60606040" };
    case "void":
    case "voided":
      return { label: "Void", bg: "#ef444420", color: "#ef4444", border: "#ef444440" };
    default:
      return { label: "Due", bg: "#f59e0b20", color: "#f59e0b", border: "#f59e0b40" };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LiveInvoicePage() {
  const params = useParams();
  const token = params?.token as string;

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/invoice/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setInvoice(data.invoice);
        setLineItems(data.line_items ?? []);
        setTenant(data.tenant);
        setLocation(data.location);
        // Mark as viewed
        fetch(`/api/invoice/${token}`, { method: "PATCH" }).catch(() => {});
      })
      .catch(() => setError("Failed to load invoice"))
      .finally(() => setLoading(false));
  }, [token]);

  const isDark = invoice?.theme_preference !== "light";
  const accent = tenant?.accent_color ?? (isDark ? "#00ff88" : "#00b854");
  const primaryColor = tenant?.primary_color ?? "#D4226A";

  // ── CSS vars for this page ──
  const cssVars = isDark
    ? {
        "--inv-bg": "#080808",
        "--inv-surface": "#0f0f12",
        "--inv-surface2": "#1a1a1e",
        "--inv-border": "#2b2b2f",
        "--inv-fg": "#f0f0f0",
        "--inv-muted": "#909098",
        "--inv-accent": accent,
      }
    : {
        "--inv-bg": "#f8f8fa",
        "--inv-surface": "#ffffff",
        "--inv-surface2": "#f0f0f4",
        "--inv-border": "#e0e0e6",
        "--inv-fg": "#111118",
        "--inv-muted": "#606068",
        "--inv-accent": accent,
      };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#00ff88]/30 border-t-[#00ff88] animate-spin mx-auto" />
          <div className="text-sm text-[#909098]">Loading invoice…</div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="text-center space-y-3">
          <div className="text-4xl">🔍</div>
          <div className="text-lg font-semibold text-white">Invoice not found</div>
          <div className="text-sm text-[#909098]">This link may have expired or is invalid.</div>
        </div>
      </div>
    );
  }

  const status = statusConfig(invoice.status);
  const customerName = invoice.metadata?.customer_name ?? "Valued Customer";
  const total = invoice.total_cents;
  const subtotal = invoice.subtotal_cents;
  const discount = invoice.discount_cents ?? 0;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={cssVars as React.CSSProperties}
    >
      {/* ── Animated background ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "var(--inv-bg)" }}
      >
        {/* Subtle gradient orbs */}
        <div
          className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full opacity-[0.04] blur-[120px] animate-pulse"
          style={{ background: primaryColor }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full opacity-[0.03] blur-[100px] animate-pulse"
          style={{ background: accent, animationDelay: "1.5s" }}
        />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12 space-y-6">

        {/* ── Header: Logo + Studio ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant?.logo_url && (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <div className="font-bold text-[var(--inv-fg)] text-sm">{tenant?.name ?? "Music Studio"}</div>
              {location && (
                <div className="text-xs text-[var(--inv-muted)]">{location.name}</div>
              )}
            </div>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
            style={{ background: status.bg, color: status.color, borderColor: status.border }}
          >
            {status.label}
          </div>
        </div>

        {/* ── Invoice card ── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "var(--inv-surface)",
            borderColor: "var(--inv-border)",
          }}
        >
          {/* Card header */}
          <div
            className="px-6 py-5 border-b"
            style={{ borderColor: "var(--inv-border)" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--inv-muted)] mb-1">Invoice for</div>
                <div className="text-xl font-bold text-[var(--inv-fg)]">{customerName}</div>
                {invoice.description && (
                  <div className="text-sm text-[var(--inv-muted)] mt-0.5">{invoice.description}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--inv-muted)]">Due</div>
                <div className="text-sm font-semibold text-[var(--inv-fg)]">{formatDate(invoice.due_date)}</div>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="px-6 py-4 space-y-3">
            {lineItems.length > 0 ? (
              <>
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_60px_80px_80px] gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--inv-muted)] pb-1 border-b" style={{ borderColor: "var(--inv-border)" }}>
                  <span>Description</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Rate</span>
                  <span className="text-right">Amount</span>
                </div>
                {lineItems.map(item => (
                  <div key={item.id} className="grid grid-cols-[1fr_60px_80px_80px] gap-2 items-start">
                    <div>
                      <div className="text-sm text-[var(--inv-fg)]">{item.description}</div>
                      {item.is_fifth_week && (
                        <div
                          className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: `${accent}20`, color: accent }}
                        >
                          5th-Week Makeup — Pre-paid
                        </div>
                      )}
                      {item.is_makeup_session && !item.is_fifth_week && (
                        <div className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400">
                          Makeup Session
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-right text-[var(--inv-muted)]">{item.quantity}</div>
                    <div className="text-sm text-right text-[var(--inv-muted)]">
                      {item.unit_price === 0 ? "—" : `$${item.unit_price.toFixed(2)}`}
                    </div>
                    <div className="text-sm text-right font-medium text-[var(--inv-fg)]">
                      {item.unit_price === 0 ? "$0.00" : `$${(item.quantity * item.unit_price).toFixed(2)}`}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-sm text-[var(--inv-muted)] py-2">No line items</div>
            )}
          </div>

          {/* Totals */}
          <div
            className="px-6 py-4 border-t space-y-2"
            style={{ borderColor: "var(--inv-border)", background: "var(--inv-surface2)" }}
          >
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--inv-muted)]">Discount</span>
                <span className="text-green-400">-{formatCents(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-[var(--inv-muted)]">Total Due</span>
              <span
                className="text-2xl font-bold"
                style={{ color: invoice.status === "paid" ? "#00b854" : "var(--inv-fg)" }}
              >
                {formatCents(total)}
              </span>
            </div>
            {invoice.status === "paid" && invoice.paid_at && (
              <div className="text-xs text-[var(--inv-muted)]">
                Paid on {formatDate(invoice.paid_at)} ✓
              </div>
            )}
          </div>
        </div>

        {/* ── Notes ── */}
        {invoice.notes && (
          <div
            className="rounded-xl border px-4 py-3 text-sm text-[var(--inv-muted)]"
            style={{ borderColor: "var(--inv-border)", background: "var(--inv-surface)" }}
          >
            {invoice.notes}
          </div>
        )}

        {/* ── Google Review button ── */}
        {invoice.google_review_enabled && (
          <a
            href="https://g.page/r/review"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold border transition-opacity hover:opacity-80"
            style={{
              borderColor: "var(--inv-border)",
              background: "var(--inv-surface)",
              color: "var(--inv-fg)",
            }}
          >
            ⭐ Leave us a Google Review
          </a>
        )}

        {/* ── Student Portal CTA ── */}
        <div
          className="rounded-2xl border px-6 py-5 text-center space-y-3"
          style={{
            borderColor: `${accent}30`,
            background: `${accent}08`,
          }}
        >
          <div className="text-sm font-semibold text-[var(--inv-fg)]">Track your progress & practice time</div>
          <div className="text-xs text-[var(--inv-muted)]">
            Log in to the Student Portal to view lesson history, practice logs, and upcoming sessions.
          </div>
          <Link
            href="/login"
            className="inline-block px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
            style={{ background: accent, color: isDark ? "#000" : "#fff" }}
          >
            Open Student Portal →
          </Link>
        </div>

        {/* ── Footer ── */}
        <div className="text-center text-xs text-[var(--inv-muted)] pb-4">
          {tenant?.name ?? "Music Studio"} · Powered by ZiroWork
          {location?.phone && <span> · {location.phone}</span>}
        </div>
      </div>
    </div>
  );
}
