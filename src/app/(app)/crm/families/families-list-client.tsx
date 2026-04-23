"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Family as FamilyRow } from "@/lib/types/entities";

/* ─── Helpers ─── */
const INSTRUMENT_COLORS: Record<string, string> = {
  Piano: "#6366f1", Guitar: "#f59e0b", Vocals: "#ec4899", Drums: "#ef4444",
  Bass: "#8b5cf6", Violin: "#10b981", Ukulele: "#06b6d4", Saxophone: "#f97316",
  Trumpet: "#eab308", Flute: "#14b8a6",
};
function instrColor(i: string) { return INSTRUMENT_COLORS[i] ?? "#6366f1"; }

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

/* ─── Avatar ─── */
const AVATAR_COLORS = [
  ["#6366f1","rgba(99,102,241,0.15)"],  // indigo
  ["#f59e0b","rgba(245,158,11,0.15)"],  // amber
  ["#10b981","rgba(16,185,129,0.15)"],  // emerald
  ["#ec4899","rgba(236,72,153,0.15)"],  // pink
  ["#06b6d4","rgba(6,182,212,0.15)"],   // cyan
  ["#8b5cf6","rgba(139,92,246,0.15)"],  // violet
  ["#ef4444","rgba(239,68,68,0.15)"],   // red
  ["#f97316","rgba(249,115,22,0.15)"],  // orange
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
      style={{ background: bg, color: fg }}
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

  /* Tab counts */
  const activeCnt = useMemo(() => rows.filter(f => !isInactive(f)).length, [rows]);
  const inactiveCnt = useMemo(() => rows.filter(f => isInactive(f)).length, [rows]);

  /* Location options — built from actual family data */
  const locationOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { id: string; name: string }[] = [{ id: "all", name: "All Locations" }];
    for (const f of rows) {
      if (f.primary_location_id && !seen.has(f.primary_location_id)) {
        seen.add(f.primary_location_id);
        opts.push({ id: f.primary_location_id, name: locationNameById[f.primary_location_id] ?? f.primary_location_id });
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
      if (sortBy === "name") { va = (a.name ?? "").toLowerCase(); vb = (b.name ?? "").toLowerCase(); }
      else if (sortBy === "balance") { va = a.balance ?? 0; vb = b.balance ?? 0; }
      else if (sortBy === "students") { va = counts[a.id] ?? 0; vb = counts[b.id] ?? 0; }
      else if (sortBy === "lifetime") { va = a.lifetime_paid_cents ?? 0; vb = b.lifetime_paid_cents ?? 0; }
      return sortDir === "asc" ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });

    /* Overdue always first within active tab */
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

  const overdueCnt = rows.filter(f => (f.overdue_balance_cents ?? 0) > 0 || (f.balance ?? 0) > 0).length;
  const lifetimeTotal = rows.reduce((s, f) => s + (f.lifetime_paid_cents ?? 0), 0);

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
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
          <Link href="/crm/families/new"
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "var(--z-accent)", color: "#000" }}>
            <span className="text-base leading-none">+</span> New Family
          </Link>
        </div>

        {/* Active / Inactive tabs */}
        <div className="flex gap-0">
          {([
            { key: "active" as const, label: "Active", count: activeCnt },
            { key: "inactive" as const, label: "Inactive", count: inactiveCnt },
          ]).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="relative px-5 py-2.5 text-sm font-semibold transition-colors"
              style={{
                color: tab === key ? "var(--z-fg)" : "var(--z-muted)",
                borderBottom: tab === key ? "2px solid var(--z-accent)" : "2px solid transparent",
                background: "transparent",
              }}
            >
              {label}
              <span
                className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  background: tab === key ? "var(--z-accent)" : "var(--z-surface)",
                  color: tab === key ? "#000" : "var(--z-muted)",
                }}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
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
        <select className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--z-surface)", color: "var(--z-fg)", border: "1px solid var(--z-border)" }}
          value={locFilter} onChange={e => setLocFilter(e.target.value)}>
          {locationOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--z-surface)", color: "var(--z-fg)", border: "1px solid var(--z-border)" }}
          value={billFilter} onChange={e => setBillFilter(e.target.value)}>
          <option value="all">All Billing</option>
          <option value="overdue">Overdue</option>
          <option value="current">Current</option>
          <option value="no invoice">No Invoice</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: "var(--z-surface)", borderBottom: "1px solid var(--z-border)" }}>
              {[
                { label: "Family", col: "name" as const, align: "left" },
                { label: "Contact", col: null, align: "left" },
                { label: "Students", col: "students" as const, align: "left" },
                { label: "Location", col: null, align: "left" },
                { label: "Billing", col: null, align: "left" },
                { label: "Balance", col: "balance" as const, align: "right" },
                { label: "Lifetime", col: "lifetime" as const, align: "right" },
                { label: "", col: null, align: "right" },
              ].map(({ label, col, align }, i) => (
                <th key={i}
                  className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${col ? "cursor-pointer select-none" : ""} text-${align}`}
                  style={{ color: "var(--z-muted)" }}
                  onClick={col ? () => toggleSort(col) : undefined}>
                  {label}{col && <SI col={col} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-20 text-center text-sm" style={{ color: "var(--z-muted)" }}>
                {search || locFilter !== "all" || billFilter !== "all"
                  ? "No families match your filters."
                  : tab === "active" ? "No active families." : "No inactive families."}
              </td></tr>
            )}
            {filtered.map(f => {
              const bs = billingStatus(f);
              const students = studentsByFamily[f.id] ?? [];
              const cnt = counts[f.id] ?? students.length;
              const locName = f.primary_location_id ? (locationNameById[f.primary_location_id] ?? f.primary_location_id) : null;
              const isOverdue = (f.overdue_balance_cents ?? 0) > 0 || (f.balance ?? 0) > 0;
              const balCents = (f.balance ?? 0) * 100;
              const familyName = f.name ?? "Unnamed";

              return (
                <tr key={f.id} className="group transition-colors"
                  style={{
                    borderBottom: "1px solid var(--z-border)",
                    background: isOverdue ? "rgba(239,68,68,0.025)" : "transparent",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = isOverdue ? "rgba(239,68,68,0.06)" : "var(--z-surface)")}
                  onMouseLeave={e => (e.currentTarget.style.background = isOverdue ? "rgba(239,68,68,0.025)" : "transparent")}>

                  {/* Family — Avatar + Name + sub-label */}
                  <td className="px-5 py-4">
                    <Link href={`/crm/families/${f.id}`} className="flex items-center gap-3 hover:opacity-90">
                      <FamilyAvatar name={familyName} />
                      <div className="min-w-0">
                        <div className="font-bold text-[15px] truncate" style={{ color: "var(--z-fg)" }}>
                          {familyName}
                        </div>
                        <div className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: "var(--z-muted)" }}>
                          {cnt > 0 && <span>{cnt} student{cnt !== 1 ? "s" : ""}</span>}
                          {cnt > 0 && locName && <span>·</span>}
                          {locName && <span>{locName}</span>}
                          {f.is_military && <span className="text-[10px]" style={{ color: "#6366f1" }}>🎖 Military</span>}
                        </div>
                      </div>
                    </Link>
                  </td>

                  {/* Contact */}
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium" style={{ color: "var(--z-fg)" }}>{pcName(f)}</div>
                    {f.primary_phone && (
                      <div className="text-xs mt-0.5" style={{ color: "var(--z-muted)" }}>{f.primary_phone}</div>
                    )}
                  </td>

                  {/* Students — instrument badges */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 items-center">
                      {students.length === 0 && (
                        <span className="text-xs" style={{ color: "var(--z-muted)" }}>—</span>
                      )}
                      {students.slice(0, 3).map(s => (
                        <span key={s.id} className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: `${instrColor(s.instrument ?? "")}20`, color: instrColor(s.instrument ?? "") }}>
                          {s.instrument ?? "—"}
                        </span>
                      ))}
                      {students.length > 3 && (
                        <span className="text-[10px]" style={{ color: "var(--z-muted)" }}>+{students.length - 3}</span>
                      )}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-5 py-4">
                    {locName
                      ? <span className="rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>{locName}</span>
                      : <span style={{ color: "var(--z-muted)" }}>—</span>}
                  </td>

                  {/* Billing */}
                  <td className="px-5 py-4">
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: bs.bg, color: bs.color }}>{bs.label}</span>
                    {f.autopay_enabled && (
                      <div className="text-[10px] mt-0.5" style={{ color: "#10b981" }}>Autopay ✓</div>
                    )}
                  </td>

                  {/* Balance */}
                  <td className="px-5 py-4 text-right">
                    <span className="font-semibold text-sm"
                      style={{ color: balCents > 0 ? "#ef4444" : "var(--z-fg)" }}>
                      {fmtBalance(balCents)}
                    </span>
                  </td>

                  {/* Lifetime */}
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm" style={{ color: "var(--z-muted)" }}>
                      {fmtLifetime(f.lifetime_paid_cents)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/crm/families/${f.id}`}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                        style={{ background: "var(--z-surface-2, var(--z-surface))", color: "var(--z-fg)", border: "1px solid var(--z-border)" }}>
                        View
                      </Link>
                      <Link href={`/invoices?family_id=${f.id}&return=family`}
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

      {/* ── Footer ── */}
      <div className="flex items-center gap-6 px-6 py-3 text-xs border-t"
        style={{ borderColor: "var(--z-border)", color: "var(--z-muted)" }}>
        <span>{filtered.length} of {tab === "active" ? activeCnt : inactiveCnt} {tab} families</span>
        <span>Total lifetime: <strong style={{ color: "var(--z-fg)" }}>{fmtLifetime(lifetimeTotal)}</strong></span>
        {overdueCnt > 0 && <span style={{ color: "#ef4444" }}>{overdueCnt} overdue</span>}
      </div>
    </div>
  );
}
