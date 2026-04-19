"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";

// ─── Location config ────────────────────────────────────────────────────────
const LOCATION_CONFIG: Record<string, { color: string; accent: string; border: string }> = {
  "f7b52dd5-12ee-437f-9c60-f8adf454ac31": {
    color: "#7C3AED",
    accent: "rgba(124,58,237,0.15)",
    border: "rgba(124,58,237,0.5)",
  }, // Bellevue — purple
  "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": {
    color: "#16A34A",
    accent: "rgba(22,163,74,0.15)",
    border: "rgba(22,163,74,0.5)",
  }, // Gretna — green
  "cebd97d4-c241-4de2-8ade-49e5cc0070d5": {
    color: "#0EA5E9",
    accent: "rgba(14,165,233,0.15)",
    border: "rgba(14,165,233,0.5)",
  }, // Elkhorn — light blue
  "d48229c1-b70a-4d29-893e-5079887dab76": {
    color: "#DC2626",
    accent: "rgba(220,38,38,0.15)",
    border: "rgba(220,38,38,0.5)",
  }, // Omaha — red
};

function getLocationStyle(locationId: string | null | undefined) {
  if (!locationId) return { color: "#606068", accent: "rgba(96,96,104,0.1)", border: "rgba(96,96,104,0.3)" };
  return LOCATION_CONFIG[locationId] ?? { color: "#606068", accent: "rgba(96,96,104,0.1)", border: "rgba(96,96,104,0.3)" };
}

// ─── Types ───────────────────────────────────────────────────────────────────
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
  is_military: boolean;
  start_date: string | null;
  family_id: string | null;
  total_lessons_taken: number;
  fifth_weeks_used: number;
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
  autopay_enabled: boolean;
  billing_status: string | null;
  rate_tier: number | null;
  balance: number | null;
  overdue_balance_cents: number | null;
  lifetime_paid_cents: number | null;
  is_military: boolean;
  parent_name: string | null;
  primary_contact_name: string | null;
  status: string | null;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCurrency(cents: number | null | undefined): string {
  if (cents == null || isNaN(cents)) return "—";
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatRate(rate: number | null | undefined): string {
  if (rate == null) return "—";
  return `$${rate}/mo`;
}

function cardLabel(family: FamilyRow): { label: string; color: string } {
  if (family.card_last_four) {
    return {
      label: `${family.card_brand ?? "Card"} ···${family.card_last_four}`,
      color: "#22C55E",
    };
  }
  if (family.square_customer_id) {
    return { label: "Square on file", color: "#F59E0B" };
  }
  return { label: "No card", color: "#EF4444" };
}

function monthlyForFamily(students: StudentRow[], family: FamilyRow): number {
  const active = students.filter((s) => s.family_id === family.id && s.status === "active");
  if (active.length === 0) return 0;
  const rate = (family.rate_tier ?? 4500) / 100;
  const totalBlocks = active.reduce((sum, s) => sum + (s.blocks_per_week ?? 1) * 4, 0);
  return totalBlocks * rate;
}

function instrumentLabel(instrument: string | null | undefined): string {
  if (!instrument) return "—";
  return instrument.charAt(0).toUpperCase() + instrument.slice(1);
}

// ─── Location Stat Card ───────────────────────────────────────────────────────
function LocationCard({
  stat,
  isActive,
  onClick,
}: {
  stat: LocationStat;
  isActive: boolean;
  onClick: () => void;
}) {
  const style = getLocationStyle(stat.id);
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:scale-[1.02]"
      style={{
        background: isActive ? style.accent : "var(--z-surface)",
        borderColor: isActive ? style.color : "var(--z-border)",
        boxShadow: isActive ? `0 0 0 1px ${style.color}` : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: style.color }}>
          {stat.shortName}
        </span>
        {isActive && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: style.color, color: "#fff" }}
          >
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
      <div className="text-xs font-semibold" style={{ color: style.color }}>
        ~${stat.monthlyRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}/mo
      </div>
    </button>
  );
}

// ─── Student Row (inside expanded family) ────────────────────────────────────
function StudentInlineRow({
  student,
  teacherName,
}: {
  student: StudentRow;
  teacherName: string;
}) {
  const locStyle = getLocationStyle(student.location_id);
  const calloutBank = Math.max(0, 4 - (student.total_callouts ?? 0));

  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border px-4 py-2.5 text-sm"
      style={{
        background: "var(--z-bg)",
        borderColor: locStyle.border,
        borderLeftWidth: "3px",
      }}
    >
      <div className="min-w-[140px] font-semibold text-[var(--z-fg)]">
        <Link
          href={`/crm/students/${student.id}`}
          className="hover:underline"
          style={{ color: locStyle.color }}
        >
          {[student.first_name, student.last_name].filter(Boolean).join(" ") || "Unnamed"}
        </Link>
      </div>
      <div className="min-w-[80px] text-[var(--z-muted)]">
        {instrumentLabel(student.instrument)}
      </div>
      <div className="min-w-[120px] text-[var(--z-muted)]">
        {teacherName || "Unassigned"}
      </div>
      <div className="min-w-[80px]">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
          style={{
            background:
              student.status === "active"
                ? "rgba(34,197,94,0.15)"
                : "rgba(239,68,68,0.15)",
            color: student.status === "active" ? "#22C55E" : "#EF4444",
          }}
        >
          {student.status}
        </span>
      </div>
      <div className="min-w-[70px] text-xs text-[var(--z-muted)]">
        {student.blocks_per_week ?? 1}×/wk
      </div>
      <div className="min-w-[80px] text-xs text-[var(--z-muted)]">
        {student.rate_per_session != null ? `$${student.rate_per_session}/block` : "—"}
      </div>
      <div className="ml-auto flex items-center gap-1 text-[10px] text-[var(--z-muted)]">
        <span title="Callout bank remaining">
          🎫 {calloutBank}/4
        </span>
        <span className="mx-1 opacity-30">·</span>
        <span title="Total lessons taken">{student.total_lessons_taken} lessons</span>
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
}: {
  family: FamilyRow;
  students: StudentRow[];
  teacherNames: Record<string, string>;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const locStyle = getLocationStyle(family.primary_location_id);
  const card = cardLabel(family);
  const familyStudents = students.filter((s) => s.family_id === family.id);
  const activeStudents = familyStudents.filter((s) => s.status === "active");
  const monthly = monthlyForFamily(students, family);
  const contactName =
    family.primary_contact_name ?? family.parent_name ?? family.name;
  const hasOverdue =
    (family.overdue_balance_cents ?? 0) > 0 || (family.balance ?? 0) < 0;

  return (
    <>
      {/* Main family row */}
      <div
        className="group relative flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-3 transition-colors hover:bg-white/[0.02]"
        style={{ borderColor: "var(--z-border)" }}
        onClick={onToggle}
      >
        {/* Location color bar */}
        <div
          className="absolute left-0 top-0 h-full w-1 rounded-l"
          style={{ background: locStyle.color }}
        />

        {/* Expand toggle */}
        <div className="flex w-5 items-center justify-center text-[var(--z-muted)] transition-transform">
          <svg
            className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Family name */}
        <div className="min-w-[160px] flex-1">
          <Link
            href={`/crm/families/${family.id}`}
            className="font-bold text-[var(--z-fg)] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {family.name}
          </Link>
          {contactName && contactName !== family.name && (
            <div className="text-xs text-[var(--z-muted)]">{contactName}</div>
          )}
        </div>

        {/* Student count badge */}
        <div className="flex items-center gap-1">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-bold"
            style={{
              background: locStyle.accent,
              color: locStyle.color,
              border: `1px solid ${locStyle.border}`,
            }}
          >
            {activeStudents.length} student{activeStudents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Monthly revenue */}
        <div className="min-w-[90px] text-sm font-semibold text-[var(--z-fg)]">
          {monthly > 0 ? `$${monthly.toLocaleString("en-US", { maximumFractionDigits: 0 })}/mo` : "—"}
        </div>

        {/* Email */}
        <div className="hidden min-w-[200px] truncate text-xs text-[var(--z-muted)] md:block">
          {family.primary_email ?? "—"}
        </div>

        {/* Phone */}
        <div className="hidden min-w-[130px] text-xs text-[var(--z-muted)] lg:block">
          {family.primary_phone ?? "—"}
        </div>

        {/* Card status */}
        <div className="min-w-[130px]">
          <span className="text-xs font-medium" style={{ color: card.color }}>
            {card.label}
          </span>
        </div>

        {/* Overdue badge */}
        {hasOverdue && (
          <div>
            <span className="rounded-full bg-[rgba(239,68,68,0.15)] px-2 py-0.5 text-[10px] font-bold text-[#EF4444]">
              OVERDUE
            </span>
          </div>
        )}

        {/* Military badge */}
        {family.is_military && (
          <div>
            <span className="rounded-full bg-[rgba(14,165,233,0.15)] px-2 py-0.5 text-[10px] font-bold text-[#0EA5E9]">
              MILITARY
            </span>
          </div>
        )}
      </div>

      {/* Expanded student rows */}
      {isExpanded && (
        <div className="border-b px-6 py-3 space-y-2" style={{ borderColor: "var(--z-border)", background: "var(--z-surface-2)" }}>
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
export function RosterClient({
  families,
  students,
  teacherNames,
  locationStats,
}: RosterClientProps) {
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");

  const toggleFamily = (id: string) => {
    setExpandedFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleLocation = (id: string) => {
    setActiveLocationId((prev) => (prev === id ? null : id));
  };

  const filteredFamilies = useMemo(() => {
    let result = families;

    // Location filter
    if (activeLocationId) {
      const familyIdsInLocation = new Set(
        students
          .filter((s) => s.location_id === activeLocationId)
          .map((s) => s.family_id)
          .filter(Boolean) as string[]
      );
      result = result.filter(
        (f) =>
          f.primary_location_id === activeLocationId ||
          familyIdsInLocation.has(f.id)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((f) => (f.status ?? "active") === statusFilter);
    }

    // Search
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

  // Summary stats
  const totalActive = students.filter((s) => s.status === "active").length;
  const totalFamilies = families.filter((f) => (f.status ?? "active") === "active").length;
  const totalMonthly = families.reduce((sum, f) => sum + monthlyForFamily(students, f), 0);
  const noCard = families.filter((f) => !f.card_last_four && !f.square_customer_id && (f.status ?? "active") === "active").length;

  return (
    <PageShell title="Roster">
      <div className="space-y-6">
        {/* ── Top summary bar ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <div className="text-2xl font-extrabold text-[var(--z-accent)]">{totalActive}</div>
            <div className="text-xs text-[var(--z-muted)]">Active students</div>
          </div>
          <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <div className="text-2xl font-extrabold text-[var(--z-fg)]">{totalFamilies}</div>
            <div className="text-xs text-[var(--z-muted)]">Active families</div>
          </div>
          <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <div className="text-2xl font-extrabold text-[#22C55E]">
              ${totalMonthly.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-[var(--z-muted)]">Monthly revenue</div>
          </div>
          <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <div className="text-2xl font-extrabold text-[#EF4444]">{noCard}</div>
            <div className="text-xs text-[var(--z-muted)]">No card on file</div>
          </div>
        </div>

        {/* ── Location cards ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--z-muted)]">
            Click a studio to filter
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {locationStats.map((stat) => (
              <LocationCard
                key={stat.id}
                stat={stat}
                isActive={activeLocationId === stat.id}
                onClick={() => toggleLocation(stat.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Search & filters ── */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search families, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-72 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
          />
          <div className="flex rounded-lg border border-[var(--z-border)] overflow-hidden text-sm">
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
          <span className="ml-auto text-sm text-[var(--z-muted)]">
            {filteredFamilies.length} families
          </span>
          <Link
            href="/crm/families"
            className="text-xs font-semibold hover:underline"
            style={{ color: "var(--z-accent)" }}
          >
            Full CRM view →
          </Link>
        </div>

        {/* ── Table header ── */}
        <div className="rounded-xl border border-[var(--z-border)] overflow-hidden">
          <div
            className="grid px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)]"
            style={{
              gridTemplateColumns: "24px 1fr 100px 90px 200px 130px 130px",
              background: "var(--z-surface)",
              borderBottom: "1px solid var(--z-border)",
            }}
          >
            <div />
            <div>Family</div>
            <div>Students</div>
            <div>Monthly</div>
            <div className="hidden md:block">Email</div>
            <div className="hidden lg:block">Phone</div>
            <div>Card</div>
          </div>

          {/* ── Rows ── */}
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
                />
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
