"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/* ─── Location Brand Colors ──────────────────────────────────
   Bellevue: Royal Purple | Gretna: Emerald | Omaha: Crimson | Elkhorn: Royal Blue
*/
const LOCATION_COLORS: Record<string, { text: string; stripe: string; bg: string }> = {
  bellevue: { text: "#7c3aed", stripe: "#7c3aed", bg: "rgba(109,40,217,0.07)" },
  gretna:   { text: "#059669", stripe: "#059669", bg: "rgba(5,150,105,0.07)" },
  omaha:    { text: "#b91c1c", stripe: "#b91c1c", bg: "rgba(185,28,28,0.07)" },
  elkhorn:  { text: "#1d4ed8", stripe: "#1d4ed8", bg: "rgba(29,78,216,0.07)" },
};
function locationColor(name: string) {
  const n = (name ?? "").toLowerCase();
  for (const [key, val] of Object.entries(LOCATION_COLORS)) {
    if (n.includes(key)) return val;
  }
  return { text: "#6366f1", stripe: "#6366f1", bg: "rgba(99,102,241,0.07)" };
}

/* ─── Types ──────────────────────────────────────────────── */
type FamilyHeader = {
  id: string;
  name: string;
  status: string | null;
  balance: number;
  billing_status: string;
  primary_location_id: string | null;
  is_military: boolean | null;
};

/* ─── Helpers ────────────────────────────────────────────── */
function formatBalance(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
  return amount < 0 ? `-${formatted}` : formatted;
}

function familyDisplayName(name: string): string {
  const trimmed = name.trim();
  if (/family$/i.test(trimmed)) return trimmed;
  return `The ${trimmed} Family`;
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}

/* ─── Status badge (hero glass) ─────────────────────────── */
function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();
  let ring = "rgba(148,163,184,0.35)";
  let fg = "var(--z-fg-secondary)";
  if (s === "active") {
    ring = "rgba(16,185,129,0.45)";
    fg = "#34d399";
  } else if (s === "paused") {
    ring = "rgba(59,130,246,0.45)";
    fg = "#60a5fa";
  } else if (s === "inactive" || s === "archived") {
    ring = "rgba(148,163,184,0.3)";
    fg = "var(--z-muted)";
  }
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur-md"
      style={{
        borderColor: ring,
        color: fg,
        background: "color-mix(in oklab, var(--z-surface), transparent 35%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {status ?? "Unknown"}
    </span>
  );
}

/* ─── Balance badge (hero glass) ──────────────────────────── */
function BalanceBadge({ balance }: { balance: number }) {
  const isOverdue = balance > 0;
  const isCredit = balance < 0;
  let ring = "rgba(148,163,184,0.35)";
  let fg = "var(--z-fg)";
  if (isOverdue) {
    ring = "rgba(248,113,113,0.45)";
    fg = "#f87171";
  }
  if (isCredit) {
    ring = "rgba(52,211,153,0.45)";
    fg = "#6ee7b7";
  }
  const label = isOverdue ? "Balance due" : isCredit ? "Credit" : "Paid up";
  return (
    <div
      className="rounded-2xl border px-4 py-3 backdrop-blur-md"
      style={{
        borderColor: ring,
        background: "color-mix(in oklab, var(--z-surface), transparent 28%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 12px 40px rgba(0,0,0,0.25)",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--z-muted)]">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold tabular-nums tracking-tight" style={{ color: fg }}>
        {formatBalance(balance)}
      </p>
    </div>
  );
}

/* ─── Skeleton ─────────────────────────────────────────────── */
function HeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-4 w-48 rounded-full bg-[var(--z-border)]" />
      <div className="h-64 rounded-3xl bg-[var(--z-surface-2)]" />
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export function FamilyAccountHeader() {
  const params = useParams<{ id: string }>();
  const familyId = params?.id ?? "";

  const [family, setFamily] = useState<FamilyHeader | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/crm/families/${familyId}`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        });
        if (!res.ok) throw new Error(`Family not found (${res.status})`);
        const json = await res.json();
        const f = json.data ?? json;
        setFamily({
          id: f.id,
          name: f.name,
          status: f.status ?? null,
          balance: f.balance ?? 0,
          billing_status: f.billing_status ?? "unknown",
          primary_location_id: f.primary_location_id ?? null,
          is_military: f.is_military ?? null,
        });

        if (f.primary_location_id) {
          try {
            const lr = await fetch(`/api/crm/locations/${f.primary_location_id}`, {
              headers: { "x-tenant-id": DEFAULT_TENANT_ID },
            });
            if (lr.ok) {
              const lj = await lr.json();
              const loc = lj.data ?? lj;
              setLocationName(loc.name ?? null);
            }
          } catch {
            // non-blocking
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load family");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [familyId]);

  if (loading) return <HeaderSkeleton />;

  if (error || !family) {
    return (
      <div
        className="rounded-2xl border px-5 py-4 text-sm"
        style={{
          background: "rgba(185,28,28,0.08)",
          color: "#b91c1c",
          borderColor: "rgba(185,28,28,0.25)",
        }}
      >
        {error ?? "Family not found."}
      </div>
    );
  }

  const locC = locationName ? locationColor(locationName) : null;
  const avatarBg = locC?.bg ?? "rgba(99,102,241,0.12)";
  const avatarFg = locC?.text ?? "#6366f1";
  const accent = locC?.stripe ?? "#6366f1";
  const shortId = `${family.id.slice(0, 8)}…${family.id.slice(-4)}`;

  return (
    <div className="relative">
      {/* Breadcrumb — pill rail */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-2 text-[13px] font-medium"
      >
        <Link
          href="/crm/families"
          className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1 text-[var(--z-muted)] transition hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:text-[var(--z-fg)]"
        >
          ← Families
        </Link>
        <span className="text-[var(--z-border)]">/</span>
        <span className="rounded-full border border-[color-mix(in_oklab,var(--z-accent),transparent_70%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)] px-3 py-1 font-semibold text-[var(--z-fg)]">
          {family.name}
        </span>
      </nav>

      {/* Hero vault */}
      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--z-border)] shadow-[0_24px_80px_rgba(0,0,0,0.35)] dark:shadow-[0_32px_100px_rgba(0,0,0,0.55)]">
        {/* Mesh + grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-90 dark:opacity-100"
            style={{
              background: [
                `radial-gradient(120% 80% at 0% 0%, ${accent}33, transparent 55%)`,
                `radial-gradient(90% 70% at 100% 10%, color-mix(in oklab, var(--z-accent), transparent 82%), transparent 50%)`,
              `radial-gradient(70% 50% at 50% 120%, rgba(99,102,241,0.15), transparent 45%)`,
              "var(--z-surface)",
            ].join(", "),
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.055]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            mixBlendMode: "overlay",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_oklab,var(--z-fg),transparent_88%)] to-transparent opacity-50"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col gap-8 px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="flex min-w-0 flex-1 flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-black tracking-tight shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:h-24 sm:w-24 sm:text-3xl"
              style={{
                background: `linear-gradient(145deg, ${avatarBg.replace("0.07", "0.45")}, ${avatarBg})`,
                color: avatarFg,
                border: `2px solid ${avatarFg}55`,
                boxShadow: `0 0 0 1px rgba(255,255,255,0.06) inset, 0 16px 48px ${avatarFg}33`,
              }}
            >
              {initials(family.name)}
            </div>
            <div className="min-w-0 pb-0.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[var(--z-muted)]">
                Family account
              </p>
              <h1 className="mt-2 max-w-[18ch] text-balance font-black leading-[0.95] tracking-[-0.04em] text-[var(--z-fg)] sm:max-w-none sm:text-5xl lg:text-6xl">
                {familyDisplayName(family.name)}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {locationName && locC && (
                  <span
                    className="rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm"
                    style={{
                      borderColor: `${locC.text}44`,
                      background: locC.bg,
                      color: locC.text,
                    }}
                  >
                    {locationName.replace(" Music Lessons", "")}
                  </span>
                )}
                {family.is_military && (
                  <span
                    className="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{
                      borderColor: "color-mix(in oklab, var(--z-purple), transparent 55%)",
                      background: "color-mix(in oklab, var(--z-purple), transparent 88%)",
                      color: "var(--z-purple)",
                    }}
                  >
                    Military
                  </span>
                )}
                <span className="font-mono text-[11px] text-[var(--z-muted)] tabular-nums">{shortId}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
            <div className="flex flex-wrap justify-end gap-2">
              <StatusBadge status={family.status} />
            </div>
            <BalanceBadge balance={family.balance} />
          </div>
        </div>
      </div>
    </div>
  );
}
