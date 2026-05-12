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
  gretna:   { text: "#059669", stripe: "#059669", bg: "rgba(5,150,105,0.07)"  },
  omaha:    { text: "#b91c1c", stripe: "#b91c1c", bg: "rgba(185,28,28,0.07)"  },
  elkhorn:  { text: "#1d4ed8", stripe: "#1d4ed8", bg: "rgba(29,78,216,0.07)"  },
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

/* ─── Status badge ───────────────────────────────────────── */
function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();
  let bg = "rgba(107,114,128,0.1)", color = "var(--z-muted, #6b7280)";
  if (s === "active")                              { bg = "rgba(16,185,129,0.12)";  color = "#059669"; }
  else if (s === "paused")                         { bg = "rgba(37,99,235,0.12)";   color = "#2563eb"; }
  else if (s === "inactive" || s === "archived")   { bg = "rgba(107,114,128,0.1)";  color = "var(--z-muted, #6b7280)"; }
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={{ background: bg, color }}>
      {status ?? "Unknown"}
    </span>
  );
}

/* ─── Balance badge ──────────────────────────────────────── */
function BalanceBadge({ balance }: { balance: number }) {
  const isOverdue = balance > 0;
  const isCredit  = balance < 0;
  let bg = "rgba(107,114,128,0.1)", color = "var(--z-muted, #6b7280)";
  if (isOverdue) { bg = "rgba(185,28,28,0.1)";  color = "#b91c1c"; }
  if (isCredit)  { bg = "rgba(16,185,129,0.12)"; color = "#059669"; }
  const label = isOverdue ? "Owes" : isCredit ? "Credit" : "Paid";
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: bg, color }}>
      {label} {formatBalance(balance)}
    </span>
  );
}

/* ─── Skeleton ───────────────────────────────────────────── */
function HeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-3 w-16 rounded" style={{ background: "var(--z-border)" }} />
        <div className="h-3 w-2 rounded"  style={{ background: "var(--z-border)" }} />
        <div className="h-3 w-32 rounded" style={{ background: "var(--z-border)" }} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="h-9 w-64 rounded" style={{ background: "var(--z-border)" }} />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full" style={{ background: "var(--z-border)" }} />
          <div className="h-6 w-24 rounded-full" style={{ background: "var(--z-border)" }} />
        </div>
      </div>
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
      <div className="rounded-lg px-4 py-3 text-sm"
        style={{ background: "rgba(185,28,28,0.08)", color: "#b91c1c", border: "1px solid rgba(185,28,28,0.2)" }}>
        {error ?? "Family not found."}
      </div>
    );
  }

  const locC = locationName ? locationColor(locationName) : null;
  const avatarBg = locC?.bg ?? "rgba(99,102,241,0.12)";
  const avatarFg = locC?.text ?? "#6366f1";

  return (
    <div>
      {/* ── Breadcrumbs ─────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm"
        style={{ color: "var(--z-muted)" }}>
        <Link href="/crm/families"
          className="transition-colors"
          style={{ color: "var(--z-muted)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--z-fg)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--z-muted)")}>
          Families
        </Link>
        <span aria-hidden className="select-none" style={{ color: "var(--z-border)" }}>/</span>
        <span className="font-medium" style={{ color: "var(--z-fg)" }} aria-current="page">
          {family.name}
        </span>
      </nav>

      {/* ── Header card with location accent ────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--z-surface)",
          border: "1px solid var(--z-border)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>

        {/* Location-brand top stripe */}
        {locC && (
          <div style={{ height: 4, background: locC.stripe, width: "100%" }} />
        )}

        <div className="px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: avatar + name + location */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 select-none"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${avatarBg.replace("0.07","0.35")}, ${avatarBg})`,
                color: avatarFg,
                boxShadow: `0 2px 10px ${avatarBg.replace("0.07","0.3")}`,
                border: `2px solid ${avatarFg}30`,
              }}>
              {initials(family.name)}
            </div>

            <div>
              <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl"
                style={{ color: "var(--z-fg)" }}>
                {familyDisplayName(family.name)}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {locationName && locC && (
                  <span className="text-xs font-semibold rounded-full px-2 py-0.5"
                    style={{ background: locC.bg, color: locC.text }}>
                    {locationName.replace(" Music Lessons", "")}
                  </span>
                )}
                {family.is_military && (
                  <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase"
                    style={{ background: "rgba(109,40,217,0.12)", color: "#7c3aed", letterSpacing: "0.07em" }}>
                    ★ MIL
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: status + balance */}
          <div className="flex shrink-0 flex-wrap items-center gap-2 pt-0.5">
            <StatusBadge status={family.status} />
            <BalanceBadge balance={family.balance} />
          </div>
        </div>
      </div>

      <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--z-muted)]">
        <span className="text-[var(--z-fg-secondary)]">Workspace</span>
        <span aria-hidden className="text-[var(--z-border)]">
          ·
        </span>
        <span>
          <kbd className="rounded border border-[var(--z-border)] bg-[var(--z-surface-2)] px-1.5 py-0.5 font-mono text-[10px] normal-case tracking-normal text-[var(--z-fg)]">
            Ctrl
          </kbd>
          <span className="mx-0.5 font-mono text-[10px] normal-case text-[var(--z-muted)]">/</span>
          <kbd className="rounded border border-[var(--z-border)] bg-[var(--z-surface-2)] px-1.5 py-0.5 font-mono text-[10px] normal-case tracking-normal text-[var(--z-fg)]">
            ⌘K
          </kbd>{" "}
          command center
        </span>
        <span aria-hidden className="text-[var(--z-border)]">
          ·
        </span>
        <span>Tab dock sticks on scroll</span>
      </p>
    </div>
  );
}
