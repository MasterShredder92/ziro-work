"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";

// ─── Location config ──────────────────────────────────────────────────────────
const LOCATION_CONFIG: Record<string, { color: string; accent: string; border: string }> = {
  "f7b52dd5-12ee-437f-9c60-f8adf454ac31": { color: "#7C3AED", accent: "rgba(124,58,237,0.15)", border: "rgba(124,58,237,0.4)" },
  "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": { color: "#16A34A", accent: "rgba(22,163,74,0.15)",  border: "rgba(22,163,74,0.4)"  },
  "cebd97d4-c241-4de2-8ade-49e5cc0070d5": { color: "#0EA5E9", accent: "rgba(14,165,233,0.15)", border: "rgba(14,165,233,0.4)" },
  "d48229c1-b70a-4d29-893e-5079887dab76": { color: "#DC2626", accent: "rgba(220,38,38,0.15)",  border: "rgba(220,38,38,0.4)"  },
};
const DEFAULT_LOC = { color: "#606068", accent: "rgba(96,96,104,0.1)", border: "rgba(96,96,104,0.3)" };
function locStyle(id: string | null | undefined) {
  return id ? (LOCATION_CONFIG[id] ?? DEFAULT_LOC) : DEFAULT_LOC;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  instrument: string | null;
  status: string;
  location_id: string | null;
  teacher_id: string | null;
  rate_per_session: number | null;
  blocks_per_week: number | null;
  is_military: boolean | null;
  start_date: string | null;
  family_id: string | null;
  total_lessons_taken: number | null;
  fifth_weeks_used: number | null;
  total_callouts: number;
}

interface FamilyRow {
  id: string;
  name: string;
  primary_email: string | null;
  primary_phone: string | null;
  primary_location_id: string | null;
  card_last_four: string | null;
  card_brand: string | null;
  square_customer_id: string | null;
  autopay_enabled: boolean | null;
  billing_status: string | null;
  rate_tier: number | null;
  balance: number | null;
  overdue_balance_cents: number | null;
  lifetime_paid_cents: number | null;
  is_military: boolean;
  parent_name: string | null;
  primary_contact_name: string | null;
}

interface LocationStat {
  id: string;
  name: string;
  shortName: string;
  studentCount: number;
  familyCount: number;
  monthlyRevenue: number;
}

interface RosterClientProps {
  families: FamilyRow[];
  students: StudentRow[];
  teacherNames: Record<string, string>;
  locationStats: LocationStat[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip " Family" suffix and return just the meaningful name part */
function displayName(raw: string): string {
  return raw.replace(/\s+family$/i, "").trim() || raw;
}

/** Contact name to show below the family name (only if it adds info) */
function contactSub(family: FamilyRow): string | null {
  const raw = family.primary_contact_name ?? family.parent_name;
  if (!raw) return null;
  // strip "Family" from both for comparison
  const cleanFamily = displayName(family.name).toLowerCase();
  const cleanContact = raw.toLowerCase().replace(/\s+family$/i, "").trim();
  if (cleanContact === cleanFamily) return null;
  return raw;
}

function monthlyForFamily(students: StudentRow[], family: FamilyRow): number {
  const active = students.filter((s) => s.family_id === family.id && s.status === "active");
  if (active.length === 0) return 0;
  const rate = (family.rate_tier ?? 4500) / 100;
  return active.reduce((sum, s) => sum + (s.blocks_per_week ?? 1) * 4 * rate, 0);
}

function normalizeCard(family: FamilyRow): { label: string; type: "visa" | "mc" | "amex" | "sq" | "none" } {
  if (family.card_last_four) {
    const brand = (family.card_brand ?? "").toLowerCase();
    const last = family.card_last_four;
    if (brand.includes("visa"))       return { label: `VISA ···${last}`,       type: "visa" };
    if (brand.includes("master"))     return { label: `MC ···${last}`,          type: "mc"   };
    if (brand.includes("amex") || brand.includes("american")) return { label: `AMEX ···${last}`, type: "amex" };
    return { label: `···${last}`, type: "sq" };
  }
  if (family.square_customer_id) return { label: "Square on file", type: "sq" };
  return { label: "No card", type: "none" };
}

const CARD_COLORS = { visa: "#60A5FA", mc: "#FB923C", amex: "#34D399", sq: "#9CA3AF", none: "#F87171" };

/** Color-coded student count pill */
function StudentPill({ count }: { count: number }) {
  const cfg =
    count === 0 ? { bg: "rgba(100,100,120,0.15)", color: "#555" } :
    count === 1 ? { bg: "rgba(96,165,250,0.18)",  color: "#60A5FA" } :
    count === 2 ? { bg: "rgba(74,222,128,0.18)",  color: "#4ADE80" } :
    count === 3 ? { bg: "rgba(251,191,36,0.18)",  color: "#FBBF24" } :
                  { bg: "rgba(192,132,252,0.18)", color: "#C084FC" };
  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {count} student{count !== 1 ? "s" : ""}
    </span>
  );
}

// ─── Location Stat Card ───────────────────────────────────────────────────────
function LocationCard({ stat, isActive, onClick }: { stat: LocationStat; isActive: boolean; onClick: () => void }) {
  const s = locStyle(stat.id);
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:scale-[1.02]"
      style={{
        background: isActive ? s.accent : "var(--z-surface)",
        borderColor: isActive ? s.color : "var(--z-border)",
        boxShadow: isActive ? `0 0 0 1px ${s.color}` : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: s.color }}>{stat.shortName}</span>
        {isActive && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: s.color, color: "#fff" }}>
            Filtered
          </span>
        )}
      </div>
      <div className="flex gap-4">
        <div>
          <div className="text-2xl font-extrabold text-[var(--z-fg)]">{stat.studentCount}</div>
          <div className="text-[11px] text-[var(--z-muted)]">students</div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-[var(--z-fg)]">{stat.familyCount}</div>
          <div className="text-[11px] text-[var(--z-muted)]">families</div>
        </div>
      </div>
      <div className="text-xs font-semibold" style={{ color: s.color }}>
        ~${stat.monthlyRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}/mo
      </div>
    </button>
  );
}

// ─── Student inline row (expanded) ───────────────────────────────────────────
function StudentInlineRow({ student, teacherName }: { student: StudentRow; teacherName: string }) {
  const s = locStyle(student.location_id);
  const calloutBank = Math.max(0, 4 - (student.total_callouts ?? 0));
  const instrument = student.instrument
    ? student.instrument.charAt(0).toUpperCase() + student.instrument.slice(1)
    : "—";

  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border px-4 py-2.5 text-sm"
      style={{ background: "var(--z-bg)", borderColor: s.border, borderLeftWidth: "3px" }}
    >
      <div className="min-w-[140px] font-semibold">
        <Link href={`/crm/students/${student.id}`} className="hover:underline" style={{ color: s.color }}>
          {[student.first_name, student.last_name].filter(Boolean).join(" ") || "Unnamed"}
        </Link>
      </div>
      <div className="min-w-[80px] text-[var(--z-muted)]">{instrument}</div>
      <div className="min-w-[120px] text-[var(--z-muted)]">{teacherName || "Unassigned"}</div>
      <div className="min-w-[80px]">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
          style={{
            background: student.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            color: student.status === "active" ? "#22C55E" : "#EF4444",
          }}
        >
          {student.status}
        </span>
      </div>
      <div className="min-w-[70px] text-xs text-[var(--z-muted)]">{student.blocks_per_week ?? 1}×/wk</div>
      <div className="min-w-[80px] text-xs text-[var(--z-muted)]">
        {student.rate_per_session != null ? `$${student.rate_per_session}/block` : "—"}
      </div>
      <div className="ml-auto flex items-center gap-1 text-[10px] text-[var(--z-muted)]">
        <span title="Callout bank remaining">🎫 {calloutBank}/4</span>
        <span className="mx-1 opacity-30">·</span>
        <span title="Total lessons taken">{student.total_lessons_taken ?? 0} lessons</span>
      </div>
    </div>
  );
}

// ─── Family Row ───────────────────────────────────────────────────────────────
function FamilyTableRow({
  family,
  students,
  teacherNames,
  isExpanded,
  onToggle,
  showContactSub,
}: {
  family: FamilyRow;
  students: StudentRow[];
  teacherNames: Record<string, string>;
  isExpanded: boolean;
  onToggle: () => void;
  showContactSub: boolean;
}) {
  const ls = locStyle(family.primary_location_id);
  const card = normalizeCard(family);
  const cardColor = CARD_COLORS[card.type];
  const familyStudents = students.filter((s) => s.family_id === family.id);
  const activeStudents = familyStudents.filter((s) => s.status === "active");
  const monthly = monthlyForFamily(students, family);
  const sub = showContactSub ? contactSub(family) : null;
  const hasOverdue = (family.overdue_balance_cents ?? 0) > 0 || (family.balance ?? 0) < 0;
  const isInactive = (family.billing_status ?? "active").toLowerCase() !== "active";

  return (
    <>
      {/* ── Desktop row ── */}
      <div
        className="hidden sm:grid relative cursor-pointer border-b transition-colors hover:bg-white/[0.02]"
        style={{
          gridTemplateColumns: "4px 1.8fr 110px 100px 1fr 130px 150px",
          minHeight: "48px",
          alignItems: "center",
          columnGap: "12px",
          paddingLeft: 0,
          paddingRight: "14px",
          borderColor: "var(--z-border)",
          opacity: isInactive ? 0.45 : 1,
        }}
        onClick={onToggle}
      >
        {/* Color bar */}
        <div className="self-stretch rounded-l" style={{ background: ls.color, width: "4px" }} />

        {/* Name */}
        <div className="overflow-hidden py-2">
          <div className="flex items-center gap-1.5 overflow-hidden">
            {/* Expand chevron */}
            <svg
              className={`h-2.5 w-2.5 flex-shrink-0 text-[var(--z-muted)] transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <Link
              href={`/crm/families/${family.id}`}
              className="truncate text-[13px] font-bold text-[var(--z-fg)] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {displayName(family.name)}
            </Link>
            {hasOverdue && (
              <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide bg-[rgba(248,113,113,0.15)] text-[#F87171]">
                Overdue
              </span>
            )}
            {family.is_military && (
              <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide bg-[rgba(96,165,250,0.15)] text-[#60A5FA]">
                Military
              </span>
            )}
          </div>
          {sub && <div className="mt-0.5 truncate text-[11px] text-[var(--z-muted)]">{sub}</div>}
        </div>

        {/* Student pill */}
        <div><StudentPill count={activeStudents.length} /></div>

        {/* Monthly */}
        <div className={`text-[13px] font-bold whitespace-nowrap ${monthly > 0 ? "text-[var(--z-fg)]" : "text-[var(--z-muted)]"}`}>
          {monthly > 0 ? `$${monthly.toLocaleString("en-US", { maximumFractionDigits: 0 })}/mo` : "—"}
        </div>

        {/* Email */}
        <div className="truncate text-[11px] text-[var(--z-muted)]">{family.primary_email ?? "—"}</div>

        {/* Phone */}
        <div className="text-[11px] text-[var(--z-muted)] whitespace-nowrap">{family.primary_phone ?? "—"}</div>

        {/* Card */}
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: cardColor }} />
          <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: cardColor }}>{card.label}</span>
        </div>
      </div>

      {/* ── Mobile card ── */}
      <div
        className="sm:hidden border-b border-l-4 px-4 py-3 cursor-pointer transition-colors hover:bg-white/[0.02]"
        style={{
          borderColor: "var(--z-border)",
          borderLeftColor: ls.color,
          opacity: isInactive ? 0.45 : 1,
        }}
        onClick={onToggle}
      >
        {/* Name row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <svg
            className={`h-2.5 w-2.5 flex-shrink-0 text-[var(--z-muted)] transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[14px] font-bold text-[var(--z-fg)]">{displayName(family.name)}</span>
          {hasOverdue && (
            <span className="rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide bg-[rgba(248,113,113,0.15)] text-[#F87171]">Overdue</span>
          )}
          {family.is_military && (
            <span className="rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide bg-[rgba(96,165,250,0.15)] text-[#60A5FA]">Military</span>
          )}
        </div>
        {sub && <div className="mt-0.5 text-[11px] text-[var(--z-muted)]">{sub}</div>}

        {/* Meta row: pill + monthly + card */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <StudentPill count={activeStudents.length} />
          <span className="text-[13px] font-bold text-[var(--z-fg)]">
            {monthly > 0 ? `$${monthly.toLocaleString("en-US", { maximumFractionDigits: 0 })}/mo` : "—"}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: cardColor }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: cardColor }} />
            {card.label}
          </span>
        </div>

        {/* Contact row */}
        {(family.primary_email || family.primary_phone) && (
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--z-muted)]">
            {family.primary_email && <span className="truncate">{family.primary_email}</span>}
            {family.primary_phone && <span>{family.primary_phone}</span>}
          </div>
        )}
      </div>

      {/* ── Expanded student rows (both breakpoints) ── */}
      {isExpanded && (
        <div
          className="border-b px-6 py-3 space-y-2"
          style={{ borderColor: "var(--z-border)", background: "var(--z-surface-2)" }}
        >
          {familyStudents.length === 0 ? (
            <p className="text-xs text-[var(--z-muted)]">No students linked to this family.</p>
          ) : (
            familyStudents.map((s) => (
              <StudentInlineRow
                key={s.id}
                student={s}
                teacherName={s.teacher_id ? (teacherNames[s.teacher_id] ?? "Unknown") : "Unassigned"}
              />
            ))
          )}
          <div className="flex gap-3 pt-1">
            <Link
              href={`/crm/families/${family.id}`}
              className="text-xs font-semibold hover:underline"
              style={{ color: "var(--z-accent)" }}
            >
              View family →
            </Link>
            <button
              className="text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]"
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
            >
              Collapse
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Roster Client ───────────────────────────────────────────────────────
export function RosterClient({ families, students, teacherNames, locationStats }: RosterClientProps) {
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");

  const toggleFamily = (id: string) =>
    setExpandedFamilies((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleLocation = (id: string) =>
    setActiveLocationId((prev) => (prev === id ? null : id));

  const filteredFamilies = useMemo(() => {
    let result = families;
    if (activeLocationId) {
      const inLoc = new Set(
        students.filter((s) => s.location_id === activeLocationId).map((s) => s.family_id).filter(Boolean) as string[]
      );
      result = result.filter((f) => f.primary_location_id === activeLocationId || inLoc.has(f.id));
    }
    if (statusFilter !== "all") {
      result = result.filter((f) => (f.billing_status ?? "active").toLowerCase() === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (f) =>
          (f.name ?? "").toLowerCase().includes(q) ||
          (f.primary_email ?? "").toLowerCase().includes(q) ||
          (f.primary_phone ?? "").includes(q) ||
          (f.primary_contact_name ?? "").toLowerCase().includes(q) ||
          (f.parent_name ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [families, students, activeLocationId, statusFilter, search]);

  // Auto-disambiguate: find last names (after stripping "Family") that appear more than once
  const duplicateNames = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of filteredFamilies) {
      const key = displayName(f.name).toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return new Set(Object.entries(counts).filter(([, v]) => v > 1).map(([k]) => k));
  }, [filteredFamilies]);

  // Summary stats
  const totalActive = students.filter((s) => s.status === "active").length;
  const totalFamilies = families.filter((f) => (f.billing_status ?? "active").toLowerCase() === "active").length;
  const totalMonthly = families.reduce((sum, f) => sum + monthlyForFamily(students, f), 0);
  const noCard = families.filter(
    (f) => !f.card_last_four && !f.square_customer_id && (f.billing_status ?? "active").toLowerCase() === "active"
  ).length;

  return (
    <PageShell title="Roster">
      <div className="space-y-6">
        {/* ── Summary bar ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { val: totalActive,   label: "Active students",  color: "var(--z-accent)" },
            { val: totalFamilies, label: "Active families",  color: "var(--z-fg)"     },
            { val: `$${totalMonthly.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, label: "Monthly revenue", color: "#4ADE80" },
            { val: noCard,        label: "No card on file",  color: "#F87171"          },
          ].map(({ val, label, color }) => (
            <div key={label} className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
              <div className="text-2xl font-extrabold" style={{ color }}>{val}</div>
              <div className="text-xs text-[var(--z-muted)]">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Location cards ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--z-muted)]">
            Click a studio to filter
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {locationStats.map((stat) => (
              <LocationCard key={stat.id} stat={stat} isActive={activeLocationId === stat.id} onClick={() => toggleLocation(stat.id)} />
            ))}
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search families, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-64 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
          />
          <div className="flex overflow-hidden rounded-lg border border-[var(--z-border)] text-sm">
            {(["active", "all", "inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 capitalize transition-colors"
                style={{
                  background: statusFilter === s ? "var(--z-accent)" : "var(--z-surface)",
                  color: statusFilter === s ? "var(--z-on-accent)" : "var(--z-muted)",
                  fontWeight: statusFilter === s ? 700 : 400,
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="ml-auto text-sm text-[var(--z-muted)]">{filteredFamilies.length} families</span>
          <Link href="/crm/families" className="text-xs font-semibold hover:underline" style={{ color: "var(--z-accent)" }}>
            Full CRM view →
          </Link>
        </div>

        {/* ── Pill legend ── */}
        <div className="flex flex-wrap gap-4 text-[11px] text-[var(--z-muted)]">
          {[
            { color: "#60A5FA", label: "1 student"  },
            { color: "#4ADE80", label: "2 students" },
            { color: "#FBBF24", label: "3 students" },
            { color: "#C084FC", label: "4+ students"},
            { color: "#555",    label: "0 students" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border border-[var(--z-border)] overflow-hidden">
          {/* Desktop header */}
          <div
            className="hidden sm:grid px-0 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--z-muted)]"
            style={{
              gridTemplateColumns: "4px 1.8fr 110px 100px 1fr 130px 150px",
              columnGap: "12px",
              paddingRight: "14px",
              background: "var(--z-surface)",
              borderBottom: "1px solid var(--z-border)",
              alignItems: "center",
            }}
          >
            <div />
            <div className="pl-5">Name</div>
            <div>Students</div>
            <div>Monthly</div>
            <div>Email</div>
            <div>Phone</div>
            <div>Card</div>
          </div>

          {/* Rows */}
          <div>
            {filteredFamilies.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-[var(--z-muted)]">
                No families match your filters.
              </div>
            ) : (
              filteredFamilies.map((family) => (
                <FamilyTableRow
                  key={family.id}
                  family={family}
                  students={students}
                  teacherNames={teacherNames}
                  isExpanded={expandedFamilies.has(family.id)}
                  onToggle={() => toggleFamily(family.id)}
                  showContactSub={duplicateNames.has(displayName(family.name).toLowerCase())}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
