"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Family as FamilyRow } from "@/lib/types/entities";

/* ─── Location Brand Colors ──────────────────────────────────
   Bellevue: Royal Purple | Gretna: Emerald | Omaha: Crimson | Elkhorn: Royal Blue
   The left stripe on each row matches the family's location color.
*/
const LOCATION_COLORS: Record<string, { bg: string; text: string; stripe: string }> = {
  bellevue: { bg: "rgba(109,40,217,0.12)", text: "#7c3aed", stripe: "#7c3aed" },   // Royal Purple
  gretna:   { bg: "rgba(5,150,105,0.12)",  text: "#059669", stripe: "#059669" },   // Emerald Green
  omaha:    { bg: "rgba(185,28,28,0.12)",  text: "#b91c1c", stripe: "#b91c1c" },   // Crimson Red
  elkhorn:  { bg: "rgba(29,78,216,0.12)",  text: "#1d4ed8", stripe: "#1d4ed8" },   // Royal Blue
};
function locationColor(name: string) {
  const n = (name ?? "").toLowerCase();
  for (const [key, val] of Object.entries(LOCATION_COLORS)) {
    if (n.includes(key)) return val;
  }
  return { bg: "rgba(99,102,241,0.12)", text: "#6366f1", stripe: "#6366f1" };
}

/* ─── Instrument Normalization ───────────────────────────────
   Typo map → canonical ALL CAPS name.
   Any unrecognized instrument is uppercased as-is.
*/
const INSTRUMENT_CANON: Record<string, string> = {
  piano: "PIANO", paino: "PIANO", piana: "PIANO", keyb: "PIANO", keyboard: "PIANO",
  guitar: "GUITAR", gitar: "GUITAR", gutiar: "GUITAR", gutar: "GUITAR",
  vocals: "VOCALS", vocal: "VOCALS", voice: "VOCALS", singing: "VOCALS",
  drums: "DRUMS", drum: "DRUMS", percussion: "DRUMS",
  bass: "BASS",
  violin: "VIOLIN", fiddle: "VIOLIN",
  ukulele: "UKULELE", uke: "UKULELE",
  saxophone: "SAXOPHONE", sax: "SAXOPHONE",
  trumpet: "TRUMPET",
  flute: "FLUTE",
};
function normalizeInstrument(raw: string | null | undefined): string {
  if (!raw) return "—";
  const key = raw.trim().toLowerCase();
  return INSTRUMENT_CANON[key] ?? raw.trim().toUpperCase();
}

/* ─── Instrument Colors ──────────────────────────────────── */
const INSTRUMENT_COLORS: Record<string, string> = {
  PIANO: "#6366f1", GUITAR: "#f59e0b", VOCALS: "#ec4899", DRUMS: "#ef4444",
  BASS: "#8b5cf6", VIOLIN: "#10b981", UKULELE: "#06b6d4", SAXOPHONE: "#f97316",
  TRUMPET: "#eab308", FLUTE: "#14b8a6",
};
function instrColor(normalized: string) {
  return INSTRUMENT_COLORS[normalized] ?? "#6366f1";
}

/* ─── Helpers ────────────────────────────────────────────── */
function pcName(f: FamilyRow): string {
  const parts = [f.parent_first_name, f.parent_last_name].filter(Boolean).join(" ").trim();
  return f.primary_contact_name ?? f.parent_name ?? (parts || "—");
}
function fmtBalance(cents: number): string {
  const d = Math.abs(cents) / 100;
  return `${cents < 0 ? "-" : ""}$${d.toFixed(2)}`;
}
function fmtLifetime(cents: number | null | undefined): string {
  if (!cents) return "$0";
  return "$" + (cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}
function billingStatus(f: FamilyRow): { label: string; color: string; bg: string } {
  const overdue = (f.overdue_balance_cents ?? 0) > 0 || (f.balance ?? 0) > 0;
  if (overdue) return { label: "Overdue", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
  if (f.billing_status === "current") return { label: "Current", color: "#10b981", bg: "rgba(16,185,129,0.12)" };
  return { label: "No Invoice", color: "#6b7280", bg: "rgba(107,114,128,0.12)" };
}
function isInactive(f: FamilyRow): boolean {
  const s = (f.status ?? "").toLowerCase();
  return s === "inactive" || s === "paused" || s === "archived";
}

/* ─── Avatar — Radial Gradient + Ring ───────────────────── */
const AVATAR_COLORS = [
  ["#7c3aed", "rgba(109,40,217,0.18)"],
  ["#d97706", "rgba(217,119,6,0.18)"],
  ["#059669", "rgba(5,150,105,0.18)"],
  ["#ec4899", "rgba(236,72,153,0.18)"],
  ["#1d4ed8", "rgba(29,78,216,0.18)"],
  ["#8b5cf6", "rgba(139,92,246,0.18)"],
  ["#b91c1c", "rgba(185,28,28,0.18)"],
  ["#f97316", "rgba(249,115,22,0.18)"],
];
function avatarColor(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h] as [string, string];
}
function FamilyAvatar({ name }: { name: string }) {
  const [fg, bg] = avatarColor(name);
  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 select-none"
      style={{
        background: `radial-gradient(circle at 30% 30%, ${bg.replace("0.18", "0.45")}, ${bg})`,
        color: fg,
        boxShadow: `0 2px 8px ${bg.replace("0.18", "0.4")}`,
        border: `1.5px solid ${fg}40`,
      }}
    >
      {initials(name)}
    </div>
  );
}

type StudentSummary = { id: string; name: string; instrument?: string | null; status?: string | null };

export function FamiliesListClient({
  rows,
  counts,
  locationNameById,
  studentsByFamily = {},
}: {
  rows: FamilyRow[];
  counts: Record<string, number>;
  locationNameById: Record<string, string>;
  studentsByFamily?: Record<string, StudentSummary[]>;
}) {
  const [tab, setTab] = useState<"active" | "inactive">("active");
  const [search, setSearch] = useState("");
  const [locFilter, setLocFilter] = useState("all");
  const [billFilter, setBillFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "balance" | "students" | "lifetime">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const activeCnt   = useMemo(() => rows.filter(f => !isInactive(f)).length, [rows]);
  const inactiveCnt = useMemo(() => rows.filter(f => isInactive(f)).length, [rows]);

  const locationOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { id: string; name: string }[] = [{ id: "all", name: "All Locations" }];
    for (const f of rows) {
      if (f.primary_location_id && !seen.has(f.primary_location_id)) {
        seen.add(f.primary_location_id);
        opts.push({
          id: f.primary_location_id,
          name: locationNameById[f.primary_location_id] ?? f.primary_location_id,
        });
      }
    }
    return opts.sort((a, b) => a.id === "all" ? -1 : a.name.localeCompare(b.name));
  }, [rows, locationNameById]);

  const filtered = useMemo(() => {
    let r = rows.filter(f => tab === "active" ? !isInactive(f) : isInactive(f));
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(f =>
        (f.name ?? "").toLowerCase().includes(q) ||
        pcName(f).toLowerCase().includes(q) ||
        (f.primary_email ?? "").toLowerCase().includes(q) ||
        (f.primary_phone ?? "").includes(q)
      );
    }
    if (locFilter !== "all") r = r.filter(f => f.primary_location_id === locFilter);
    if (billFilter !== "all") r = r.filter(f => billingStatus(f).label.toLowerCase() === billFilter);

    r.sort((a, b) => {
      let va: string | number = "", vb: string | number = "";
      if (sortBy === "name")      { va = (a.name ?? "").toLowerCase(); vb = (b.name ?? "").toLowerCase(); }
      else if (sortBy === "balance")  { va = a.balance ?? 0; vb = b.balance ?? 0; }
      else if (sortBy === "students") { va = counts[a.id] ?? 0; vb = counts[b.id] ?? 0; }
      else if (sortBy === "lifetime") { va = a.lifetime_paid_cents ?? 0; vb = b.lifetime_paid_cents ?? 0; }
      return sortDir === "asc" ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });

    if (tab === "active") {
      r.sort((a, b) => {
        const ao = ((a.overdue_balance_cents ?? 0) > 0 || (a.balance ?? 0) > 0) ? 0 : 1;
        const bo = ((b.overdue_balance_cents ?? 0) > 0 || (b.balance ?? 0) > 0) ? 0 : 1;
        return ao - bo;
      });
    }
    return r;
  }, [rows, tab, search, locFilter, billFilter, sortBy, sortDir, counts]);

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  const SI = ({ col }: { col: typeof sortBy }) =>
    sortBy === col
      ? <span className="ml-0.5 text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>
      : <span className="ml-0.5 text-[10px] opacity-25">↕</span>;

  const overdueCnt    = rows.filter(f => (f.overdue_balance_cents ?? 0) > 0 || (f.balance ?? 0) > 0).length;
  const lifetimeTotal = rows.reduce((s, f) => s + (f.lifetime_paid_cents ?? 0), 0);

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-0 border-b" style={{ borderColor: "var(--z-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--z-fg)" }}>Families</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--z-muted)" }}>
              {rows.length} total
              {overdueCnt > 0 && (
                <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                  {overdueCnt} overdue
                </span>
              )}
            </p>
          </div>
          <Link
            href="/crm/families/new"
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "var(--z-accent)", color: "#000" }}>
            <span className="text-base leading-none">+</span> New Family
          </Link>
        </div>

        {/* Active / Inactive tabs */}
        <div className="flex gap-0">
          {([
            { key: "active"   as const, label: "Active",   count: activeCnt },
            { key: "inactive" as const, label: "Inactive", count: inactiveCnt },
          ]).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="relative px-5 py-2.5 text-sm transition-all"
              style={{
                color: tab === key ? "var(--z-fg)" : "var(--z-muted)",
                fontWeight: tab === key ? 700 : 500,
                borderBottom: tab === key ? "2px solid var(--z-accent)" : "2px solid transparent",
                background: "transparent",
              }}
            >
              {label}
              <span
                className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  background: tab === key ? "var(--z-accent)" : "rgba(107,114,128,0.15)",
                  color: tab === key ? "#000" : "var(--z-muted)",
                }}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="px-6 py-3 flex flex-wrap gap-2 border-b" style={{ borderColor: "var(--z-border)" }}>
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
            style={{ background: "var(--z-surface)", color: "var(--z-fg)", border: "1px solid var(--z-border)" }}
            placeholder="Search families, contacts, email, phone…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--z-surface)", color: "var(--z-fg)", border: "1px solid var(--z-border)" }}
          value={locFilter} onChange={e => setLocFilter(e.target.value)}>
          {locationOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--z-surface)", color: "var(--z-fg)", border: "1px solid var(--z-border)" }}
          value={billFilter} onChange={e => setBillFilter(e.target.value)}>
          <option value="all">All Billing</option>
          <option value="overdue">Overdue</option>
          <option value="current">Current</option>
          <option value="no invoice">No Invoice</option>
        </select>
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 pt-1 pb-2">
          <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: "0 4px" }}>

            {/* Sticky header */}
            <thead className="sticky top-0 z-10" style={{ background: "var(--z-bg, var(--z-surface))" }}>
              <tr>
                {[
                  { label: "FAMILY",   col: "name"     as const, align: "left"  },
                  { label: "CONTACT",  col: null,                align: "left"  },
                  { label: "STUDENTS", col: "students" as const, align: "left"  },
                  { label: "LOCATION", col: null,                align: "left"  },
                  { label: "BILLING",  col: null,                align: "left"  },
                  { label: "BALANCE",  col: "balance"  as const, align: "right" },
                  { label: "LIFETIME", col: "lifetime" as const, align: "right" },
                  { label: "",         col: null,                align: "right" },
                ].map(({ label, col, align }) => (
                  <th
                    key={label || "_actions"}
                    className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest ${col ? "cursor-pointer select-none" : ""} text-${align}`}
                    style={{
                      color: "var(--z-muted)",
                      borderBottom: "1px solid var(--z-border)",
                    }}
                    onClick={col ? () => toggleSort(col) : undefined}>
                    {label}{col && <SI col={col} />}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-20 text-center text-sm" style={{ color: "var(--z-muted)" }}>
                    {search || locFilter !== "all" || billFilter !== "all"
                      ? "No families match your filters."
                      : tab === "active" ? "No active families." : "No inactive families."}
                  </td>
                </tr>
              )}
              {filtered.map(f => {
                const bs         = billingStatus(f);
                const students   = studentsByFamily[f.id] ?? [];
                const cnt        = counts[f.id] ?? students.length;
                const locName    = f.primary_location_id ? (locationNameById[f.primary_location_id] ?? null) : null;
                const locC       = locName ? locationColor(locName) : null;
                const stripeColor = locC?.stripe ?? "transparent";
                const balCents   = (f.balance ?? 0) * 100;
                const familyName = f.name ?? "Unnamed";

                /* Normalize + alphabetize instruments */
                const normalizedInstruments = students
                  .map(s => normalizeInstrument(s.instrument))
                  .filter(i => i !== "—")
                  .sort();

                return (
                  <tr
                    key={f.id}
                    className="group"
                    style={{
                      background: "var(--z-bg, transparent)",
                      transition: "all 0.15s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.background = "var(--z-surface)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.background = "var(--z-bg, transparent)";
                    }}
                  >

                    {/* ── Family — location-colored left stripe ── */}
                    <td
                      className="py-4 pl-4 pr-3"
                      style={{
                        borderRadius: "12px 0 0 12px",
                        borderLeft: `4px solid ${stripeColor}`,
                      }}>
                      <Link href={`/crm/families/${f.id}`} className="flex items-center gap-3 hover:opacity-90">
                        <FamilyAvatar name={familyName} />
                        <div className="min-w-0">
                          <div className="font-bold text-[15px] truncate" style={{ color: "var(--z-fg)" }}>
                            {familyName}
                          </div>
                          <div className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: "var(--z-muted)" }}>
                            {cnt > 0 && <span>{cnt} student{cnt !== 1 ? "s" : ""}</span>}
                            {cnt > 0 && locName && <span>·</span>}
                            {locName && <span>{locName.replace(" Music Lessons", "")}</span>}
                            {f.is_military && (
                              <span
                                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                                style={{ background: "rgba(109,40,217,0.12)", color: "#7c3aed", letterSpacing: "0.07em" }}>
                                ★ MIL
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>

                    {/* ── Contact ── */}
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium" style={{ color: "var(--z-fg)" }}>{pcName(f)}</div>
                      {f.primary_phone && (
                        <div className="text-xs mt-0.5" style={{ color: "var(--z-muted)" }}>{f.primary_phone}</div>
                      )}
                    </td>

                    {/* ── Students — normalized ALL CAPS alphabetized pills ── */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 items-center">
                        {normalizedInstruments.length === 0 && (
                          <span className="text-xs" style={{ color: "var(--z-muted)" }}>—</span>
                        )}
                        {normalizedInstruments.slice(0, 3).map((instr, idx) => {
                          const ic = instrColor(instr);
                          return (
                            <span
                              key={`${instr}-${idx}`}
                              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide"
                              style={{ background: `${ic}1e`, color: ic, border: "none" }}>
                              {instr}
                            </span>
                          );
                        })}
                        {normalizedInstruments.length > 3 && (
                          <span className="text-[10px]" style={{ color: "var(--z-muted)" }}>
                            +{normalizedInstruments.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ── Location — brand-colored pill ── */}
                    <td className="px-4 py-4">
                      {locName && locC
                        ? (
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ background: locC.bg, color: locC.text }}>
                            {locName.replace(" Music Lessons", "")}
                          </span>
                        )
                        : <span style={{ color: "var(--z-muted)" }}>—</span>}
                    </td>

                    {/* ── Billing ── */}
                    <td className="px-4 py-4">
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: bs.bg, color: bs.color }}>{bs.label}</span>
                      {f.autopay_enabled && (
                        <div className="text-[10px] mt-0.5" style={{ color: "#10b981" }}>Autopay ✓</div>
                      )}
                    </td>

                    {/* ── Balance ── */}
                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold text-sm"
                        style={{ color: balCents > 0 ? "#ef4444" : "var(--z-fg)" }}>
                        {fmtBalance(balCents)}
                      </span>
                    </td>

                    {/* ── Lifetime ── */}
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm" style={{ color: "var(--z-muted)" }}>
                        {fmtLifetime(f.lifetime_paid_cents)}
                      </span>
                    </td>

                    {/* ── Actions ── */}
                    <td className="py-4 pl-3 pr-5" style={{ borderRadius: "0 12px 12px 0" }}>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/crm/families/${f.id}`}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                          style={{ background: "var(--z-surface-2, var(--z-surface))", color: "var(--z-fg)", border: "1px solid var(--z-border)" }}>
                          View
                        </Link>
                        <Link
                          href={`/invoices?family_id=${f.id}&return=family`}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:opacity-80 transition-opacity"
                          style={{ background: "var(--z-accent)", color: "#000" }}>
                          Invoice
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div
        className="flex items-center gap-6 px-6 py-3 text-xs border-t"
        style={{ borderColor: "var(--z-border)", color: "var(--z-muted)" }}>
        <span>{filtered.length} of {tab === "active" ? activeCnt : inactiveCnt} {tab} families</span>
        <span>Total lifetime: <strong style={{ color: "var(--z-fg)" }}>{fmtLifetime(lifetimeTotal)}</strong></span>
        {overdueCnt > 0 && <span style={{ color: "#ef4444" }}>{overdueCnt} overdue</span>}
      </div>
    </div>
  );
}
