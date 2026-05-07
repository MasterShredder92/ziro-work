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

// ── Music notes floating background ──────────────────────────────────────────

const NOTES = ["♩", "♪", "♫", "♬", "𝄞", "𝄢", "♭", "♮", "♯"];

type NoteProps = {
  note: string;
  style: React.CSSProperties;
};

function FloatingNote({ note, style }: NoteProps) {
  return (
    <span
      className="absolute select-none pointer-events-none"
      style={{
        fontSize: "1.5rem",
        opacity: 0.045,
        color: "#ffffff",
        animation: "floatNote linear infinite",
        ...style,
      }}
    >
      {note}
    </span>
  );
}

// Deterministic pseudo-random based on index so SSR/client match
function pseudoRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const NOTE_COUNT = 28;
const noteItems = Array.from({ length: NOTE_COUNT }, (_, i) => ({
  note: NOTES[i % NOTES.length],
  left: `${pseudoRand(i * 3) * 100}%`,
  delay: `${pseudoRand(i * 7) * 18}s`,
  duration: `${18 + pseudoRand(i * 11) * 22}s`,
  size: `${1.1 + pseudoRand(i * 5) * 1.4}rem`,
  startY: `${pseudoRand(i * 13) * 100}vh`,
}));

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
        fetch(`/api/invoice/${token}`, { method: "PATCH" }).catch(() => {});
      })
      .catch(() => setError("Failed to load invoice"))
      .finally(() => setLoading(false));
  }, [token]);

  const accent = tenant?.accent_color ?? "#c4f036";
  const primaryColor = tenant?.primary_color ?? "#D4226A";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#060608" }}>
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#c4f036]/30 border-t-[#c4f036] animate-spin mx-auto" />
          <div className="text-sm text-[#606068]">Loading invoice…</div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#060608" }}>
        <div className="text-center space-y-3">
          <div className="text-4xl">🔍</div>
          <div className="text-lg font-semibold text-white">Invoice not found</div>
          <div className="text-sm text-[#606068]">This link may have expired or is invalid.</div>
        </div>
      </div>
    );
  }

  const status = statusConfig(invoice.status);
  const customerName = invoice.metadata?.customer_name ?? "Valued Customer";
  const total = invoice.total_cents;
  const discount = invoice.discount_cents ?? 0;

  return (
    <>
      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes floatNote {
          0%   { transform: translateY(0vh) rotate(-8deg); opacity: 0; }
          5%   { opacity: 0.045; }
          90%  { opacity: 0.035; }
          100% { transform: translateY(-105vh) rotate(8deg); opacity: 0; }
        }
        @keyframes cardGlow {
          0%, 100% { box-shadow: 0 0 40px 0 ${accent}18, 0 0 80px 0 ${primaryColor}0a, 0 24px 64px 0 #00000080; }
          50%       { box-shadow: 0 0 60px 0 ${accent}28, 0 0 120px 0 ${primaryColor}14, 0 24px 64px 0 #00000080; }
        }
      `}</style>

      <div
        className="min-h-screen relative overflow-hidden"
        style={{ background: "#060608" }}
      >
        {/* ── Deep background gradient ── */}
        <div className="pointer-events-none fixed inset-0 z-0">
          {/* Very subtle color wash — not pulsing, just ambient */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 80% 60% at 20% 10%, ${primaryColor}09 0%, transparent 70%),
                           radial-gradient(ellipse 60% 50% at 80% 90%, ${accent}07 0%, transparent 70%)`,
            }}
          />
        </div>

        {/* ── Floating music notes ── */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          {noteItems.map((n, i) => (
            <FloatingNote
              key={i}
              note={n.note}
              style={{
                left: n.left,
                top: n.startY,
                fontSize: n.size,
                animationDuration: n.duration,
                animationDelay: `-${n.delay}`,
              }}
            />
          ))}
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
                  className="w-12 h-12 rounded-full object-cover ring-1 ring-white/10"
                />
              )}
              <div>
                <div className="font-bold text-white/90 text-sm">{tenant?.name ?? "Music Studio"}</div>
                {location && (
                  <div className="text-xs text-white/40">{location.name}</div>
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
              background: "#0d0d10",
              borderColor: `${accent}22`,
              animation: "cardGlow 4s ease-in-out infinite",
            }}
          >
            {/* Card header */}
            <div
              className="px-6 py-5 border-b"
              style={{ borderColor: "#1e1e24" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">Invoice for</div>
                  <div className="text-xl font-bold text-white/90">{customerName}</div>
                  {invoice.description && (
                    <div className="text-sm text-white/40 mt-0.5">{invoice.description}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/30">Due</div>
                  <div className="text-sm font-semibold text-white/80">{formatDate(invoice.due_date)}</div>
                </div>
              </div>
            </div>

            {/* Line items */}
            <div className="px-6 py-4 space-y-3">
              {lineItems.length > 0 ? (
                <>
                  <div
                    className="grid grid-cols-[1fr_60px_80px_80px] gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/25 pb-1 border-b"
                    style={{ borderColor: "#1e1e24" }}
                  >
                    <span>Description</span>
                    <span className="text-right">Qty</span>
                    <span className="text-right">Rate</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {lineItems.map(item => (
                    <div key={item.id} className="grid grid-cols-[1fr_60px_80px_80px] gap-2 items-start">
                      <div>
                        <div className="text-sm text-white/80">{item.description}</div>
                        {item.is_fifth_week && (
                          <div
                            className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: `${accent}18`, color: accent }}
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
                      <div className="text-sm text-right text-white/40">{item.quantity}</div>
                      <div className="text-sm text-right text-white/40">
                        {item.unit_price === 0 ? "—" : `$${item.unit_price.toFixed(2)}`}
                      </div>
                      <div className="text-sm text-right font-medium text-white/80">
                        {item.unit_price === 0 ? "$0.00" : `$${(item.quantity * item.unit_price).toFixed(2)}`}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-sm text-white/30 py-2">No line items</div>
              )}
            </div>

            {/* Totals */}
            <div
              className="px-6 py-4 border-t space-y-2"
              style={{ borderColor: "#1e1e24", background: "#0a0a0d" }}
            >
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Discount</span>
                  <span className="text-green-400">-{formatCents(discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white/50">Total Due</span>
                <span
                  className="text-3xl font-bold"
                  style={{ color: invoice.status === "paid" ? "#00b854" : accent }}
                >
                  {formatCents(total)}
                </span>
              </div>
              {invoice.status === "paid" && invoice.paid_at && (
                <div className="text-xs text-white/30">
                  Paid on {formatDate(invoice.paid_at)} ✓
                </div>
              )}
            </div>
          </div>

          {/* ── Notes ── */}
          {invoice.notes && (
            <div
              className="rounded-xl border px-4 py-3 text-sm text-white/40"
              style={{ borderColor: "#1e1e24", background: "#0d0d10" }}
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
                borderColor: "#2a2a30",
                background: "#0d0d10",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              ⭐ Leave us a Google Review
            </a>
          )}

          {/* ── Student Portal CTA ── */}
          <div
            className="rounded-2xl border px-6 py-5 text-center space-y-3"
            style={{
              borderColor: `${accent}20`,
              background: `${accent}06`,
            }}
          >
            <div className="text-sm font-semibold text-white/80">Track your progress & practice time</div>
            <div className="text-xs text-white/35">
              Log in to the Student Portal to view lesson history, practice logs, and upcoming sessions.
            </div>
            <Link
              href="/login"
              className="inline-block px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
              style={{ background: accent, color: "#000" }}
            >
              Open Student Portal →
            </Link>
          </div>

          {/* ── Footer ── */}
          <div className="text-center text-xs text-white/20 pb-4">
            {tenant?.name ?? "Music Studio"} · Powered by ZiroWork
            {location?.phone && <span> · {location.phone}</span>}
          </div>
        </div>
      </div>
    </>
  );
}
