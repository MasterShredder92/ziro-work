"use client";

import { useState, useMemo, useEffect, useCallback, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useZiroWorkspace } from "@/components/workspace/ZiroWorkspaceContext";
import { AddFamilyModal } from "./add-family-modal";
import { FamiliesListClient } from "./families-list-client";
import type {
  Insight, InsightFilter, InsightSeverity, FamiliesKpi,
  RiskScore, RiskBand,
} from "./_insights";

// ─── Types ─────────────────────────────────────────────────────────────────

type FamilyRow = {
  id: string;
  name: string;
  status: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  primary_location_id: string | null;
  billing_status: string;
  is_military: boolean | null;
  instruments?: string[] | null;
  balance?: number | null;
  overdue_balance_cents?: number | null;
  created_at?: string | null;
};

type StudentEntry = {
  id: string;
  name: string;
  instrument?: string | null;
  status?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  teacherPhotoUrl?: string | null;
  locationId?: string | null;
};

type LocationOpt = { id: string; name: string };

type FamilyTeacherChip = { id: string; name: string; photoUrl: string | null };

type Props = {
  rows: FamilyRow[];
  counts: Record<string, number>;
  locationNameById: Record<string, string>;
  locationOptions?: LocationOpt[];
  studentsByFamily?: Record<string, StudentEntry[]>;
  teacherByFamily?: Record<string, string>;
  inlineTeachersByFamily?: Record<string, FamilyTeacherChip[]>;
  activeStudentCountByFamily?: Record<string, number>;
  missingTeacherByFamily?: Record<string, number>;
  splitSiblingsByFamily?: Record<string, boolean>;
  kpi: FamiliesKpi;
  insights: Insight[];
  nowMs: number;
  riskByFamily: Record<string, RiskScore>;
  // brief is computed server-side but no longer rendered; kept on props for compatibility.
  brief: unknown;
};

type ViewMode = "families" | "teachers";

type TeacherStudentEntry = {
  studentId: string;
  studentName: string;
  instrument: string | null;
  familyId: string;
  familyName: string;
  locationId: string | null;
};

type TeacherAggregate = {
  teacherId: string;
  teacherName: string;
  isUnassigned: boolean;
  students: TeacherStudentEntry[];
  locationIds: Set<string>;
  instruments: Map<string, number>;
};

// ─── Design tokens ────────────────────────────────────────────────────────

const FONT = "var(--z-font-sans)";
const ACCENT = "var(--z-accent, #c4f036)";
const URGENT = "#ef4444";        // true red
const URGENT_BG = "rgba(239,68,68,0.12)";
const OPP = "#f59e0b";           // amber
const OPP_BG = "rgba(245,158,11,0.12)";
const INFO = "#22d3ee";
const INFO_BG = "rgba(34,211,238,0.12)";
const VIOLET = "#a78bfa";

const FG = "var(--z-fg, #f0f0f0)";
const FG_SECONDARY = "#b8b8c0";  // brighter than the token default
const FG_TERTIARY = "#7a7a82";   // labels / eyebrow
const FG_QUIET = "#54545a";       // placeholders / empty states
const SURFACE_BORDER = "var(--z-border, #1c1c1e)";

const NUM_STYLE = { fontFamily: FONT, fontVariantNumeric: "tabular-nums" as const };

const RISK_COLORS: Record<RiskBand, { fg: string; bg: string }> = {
  critical: { fg: URGENT, bg: "rgba(239,68,68,0.14)" },
  risk:     { fg: OPP,    bg: "rgba(245,158,11,0.14)" },
  watch:    { fg: INFO,   bg: "rgba(34,211,238,0.12)" },
  fine:     { fg: "#7cffa8", bg: "rgba(124,255,168,0.08)" },
};

type SortMode = "risk" | "name" | "recent" | "overdue";
const SORT_LABELS: Record<SortMode, string> = {
  risk:    "Needs attention",
  name:    "Alphabetical",
  recent:  "Recently added",
  overdue: "Highest overdue",
};

// ─── Row-level helpers (pure) ─────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

function shortLoc(name: string | null): string {
  if (!name) return "—";
  return name.replace(/\s+Music Lessons?$/i, "").trim() || name;
}

function locDotColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const palette = ["#c4f036", "#22d3ee", "#a78bfa", "#f59e0b", "#7cffa8", "#ff8aa1"];
  return palette[h % palette.length] ?? "#c4f036";
}

const INSTRUMENT_EMOJI: Record<string, string> = {
  guitar: "🎸", bass: "🎸", piano: "🎹", keyboard: "🎹",
  drums: "🥁", percussion: "🥁", violin: "🎻", viola: "🎻",
  cello: "🎻", trumpet: "🎺", trombone: "🎺", saxophone: "🎷",
  clarinet: "🎷", flute: "🎷", voice: "🎤", vocals: "🎤",
  ukulele: "🪕", banjo: "🪕", harp: "🎵",
};
function instrEmoji(name: string): string {
  const k = name.toLowerCase();
  for (const [key, val] of Object.entries(INSTRUMENT_EMOJI)) {
    if (k.includes(key)) return val;
  }
  return "🎵";
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function relTime(iso: string | null | undefined, nowMs: number): { label: string; days: number | null } {
  if (!iso) return { label: "—", days: null };
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return { label: "—", days: null };
  const days = Math.floor((nowMs - t) / DAY_MS);
  if (days <= 0) return { label: "today", days: 0 };
  if (days === 1) return { label: "1d ago", days: 1 };
  if (days < 30) return { label: `${days}d ago`, days };
  if (days < 365) return { label: `${Math.floor(days / 30)}mo ago`, days };
  return { label: `${Math.floor(days / 365)}y ago`, days };
}

function isRowOverdue(r: FamilyRow): boolean {
  return (r.overdue_balance_cents ?? 0) > 0;
}
function isRowTrial(r: FamilyRow): boolean {
  return (r.status ?? "").toLowerCase() === "trial";
}
function isRowActive(r: FamilyRow): boolean {
  return (r.status ?? "").toLowerCase() === "active";
}
function isRowNewLast30(r: FamilyRow, nowMs: number): boolean {
  if (!r.created_at) return false;
  const t = Date.parse(r.created_at);
  if (Number.isNaN(t)) return false;
  return nowMs - t <= 30 * DAY_MS;
}

function fmtCents(cents: number | null | undefined): string {
  if (cents == null || cents === 0) return "$0";
  return `$${Math.round(cents / 100).toLocaleString()}`;
}
function fmtNumber(value: number | null | undefined): string {
  if (value == null || value === 0) return "$0";
  return `$${Math.round(value).toLocaleString()}`;
}

// ─── CSS ──────────────────────────────────────────────────────────────────

const CSS = `
  @keyframes mc-pulse-red {
    0%, 100% { box-shadow: 0 0 0 1px rgba(239,68,68,0.45); }
    50%      { box-shadow: 0 0 0 1px rgba(239,68,68,0.80), 0 0 16px rgba(239,68,68,0.25); }
  }
  @keyframes mc-pulse-amber {
    0%, 100% { box-shadow: 0 0 0 1px rgba(245,158,11,0.40); }
    50%      { box-shadow: 0 0 0 1px rgba(245,158,11,0.70), 0 0 14px rgba(245,158,11,0.20); }
  }
  @keyframes mc-blink-dot {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.35; }
  }
  @keyframes mc-fade-up {
    from { opacity: 0; transform: translateY(3px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .mc-row {
    animation: mc-fade-up 0.28s ease both;
  }
  .mc-row:hover {
    background: rgba(255,255,255,0.025);
  }
  .mc-pulse-red {
    animation: mc-pulse-red 2.4s ease-in-out infinite;
  }
  .mc-pulse-amber {
    animation: mc-pulse-amber 3s ease-in-out infinite;
  }
  .mc-dot-live {
    animation: mc-blink-dot 1.6s ease-in-out infinite;
  }
  .mc-bg {
    background:
      radial-gradient(ellipse 1400px 700px at 30% -10%, rgba(196,240,54,0.035), transparent 65%),
      radial-gradient(ellipse 1000px 500px at 100% 100%, rgba(34,211,238,0.025), transparent 65%),
      var(--z-bg, #030303);
  }
  .mc-glass {
    background: rgba(10, 10, 12, 0.7);
    backdrop-filter: blur(14px) saturate(125%);
    -webkit-backdrop-filter: blur(14px) saturate(125%);
  }
  .mc-glass-light {
    background: rgba(14, 14, 18, 0.55);
    backdrop-filter: blur(12px) saturate(120%);
    -webkit-backdrop-filter: blur(12px) saturate(120%);
  }
`;

// ─── Main ─────────────────────────────────────────────────────────────────

export function FamiliesMissionControl({
  rows,
  counts,
  locationNameById,
  locationOptions = [],
  studentsByFamily = {},
  teacherByFamily = {},
  inlineTeachersByFamily = {},
  missingTeacherByFamily = {},
  splitSiblingsByFamily = {},
  kpi,
  insights,
  nowMs,
  riskByFamily,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspace = useZiroWorkspace();
  const [showAdd, setShowAdd] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (searchParams?.get("new") === "true") setShowAdd(true);
  }, [searchParams]);

  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState<InsightFilter["status"] | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("risk");
  const [viewMode, setViewMode] = useState<ViewMode>("families");
  const [expandedFamilyIds, setExpandedFamilyIds] = useState<Set<string>>(() => new Set());
  const [expandedTeacherIds, setExpandedTeacherIds] = useState<Set<string>>(() => new Set());

  const toggleFamilyExpand = useCallback((id: string) => {
    setExpandedFamilyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleTeacherExpand = useCallback((id: string) => {
    setExpandedTeacherIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Location is now the global workspace SSOT — no local rail.
  const activeLocationId = workspace.selectedLocId;

  const filtered = useMemo(() => {
    let list = rows;

    if (activeLocationId) {
      list = list.filter((r) => r.primary_location_id === activeLocationId);
    }

    if (activeChip === "overdue") list = list.filter(isRowOverdue);
    if (activeChip === "no-teacher") list = list.filter((r) => (missingTeacherByFamily[r.id] ?? 0) > 0);
    if (activeChip === "new") list = list.filter((r) => isRowNewLast30(r, nowMs));
    if (activeChip === "trial") list = list.filter(isRowTrial);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => {
        if ((r.name ?? "").toLowerCase().includes(q)) return true;
        if ((r.primary_email ?? "").toLowerCase().includes(q)) return true;
        if ((locationNameById[r.primary_location_id ?? ""] ?? "").toLowerCase().includes(q)) return true;
        const studs = studentsByFamily[r.id] ?? [];
        if (studs.some((s) => s.name.toLowerCase().includes(q))) return true;
        const t = teacherByFamily[r.id] ?? "";
        return t.toLowerCase().includes(q);
      });
    }

    const sorted = [...list];
    if (sortMode === "risk") {
      sorted.sort((a, b) =>
        (riskByFamily[b.id]?.score ?? 0) - (riskByFamily[a.id]?.score ?? 0)
        || (a.name ?? "").localeCompare(b.name ?? ""),
      );
    } else if (sortMode === "name") {
      sorted.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    } else if (sortMode === "recent") {
      sorted.sort((a, b) => (Date.parse(b.created_at ?? "") || 0) - (Date.parse(a.created_at ?? "") || 0));
    } else if (sortMode === "overdue") {
      sorted.sort((a, b) => ((b.overdue_balance_cents ?? 0) - (a.overdue_balance_cents ?? 0)));
    }
    return sorted;
  }, [rows, activeLocationId, activeChip, search, locationNameById, studentsByFamily, teacherByFamily, missingTeacherByFamily, nowMs, sortMode, riskByFamily]);

  // Pivot to teacher rosters when in Teachers view.
  const teachersAggregate = useMemo<TeacherAggregate[]>(() => {
    if (viewMode !== "teachers") return [];
    type Acc = TeacherAggregate;
    const map = new Map<string, Acc>();
    const UNASSIGNED_KEY = "__unassigned__";
    for (const r of rows) {
      const studs = studentsByFamily[r.id] ?? [];
      for (const s of studs) {
        if ((s.status ?? "").toLowerCase() !== "active") continue;
        if (activeLocationId && s.locationId !== activeLocationId) continue;
        const tid = s.teacherId ?? UNASSIGNED_KEY;
        const tname = s.teacherName ?? (tid === UNASSIGNED_KEY ? "Unassigned" : "");
        let agg = map.get(tid);
        if (!agg) {
          agg = {
            teacherId: tid,
            teacherName: tname || "Unknown",
            isUnassigned: tid === UNASSIGNED_KEY,
            students: [],
            locationIds: new Set<string>(),
            instruments: new Map<string, number>(),
          };
          map.set(tid, agg);
        }
        agg.students.push({
          studentId: s.id,
          studentName: s.name,
          instrument: s.instrument ?? null,
          familyId: r.id,
          familyName: r.name,
          locationId: s.locationId ?? r.primary_location_id ?? null,
        });
        if (s.locationId) agg.locationIds.add(s.locationId);
        else if (r.primary_location_id) agg.locationIds.add(r.primary_location_id);
        if (s.instrument) {
          const k = s.instrument.toLowerCase();
          agg.instruments.set(k, (agg.instruments.get(k) ?? 0) + 1);
        }
      }
    }
    let arr = Array.from(map.values());

    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((agg) => {
        if (agg.teacherName.toLowerCase().includes(q)) return true;
        return agg.students.some((s) =>
          s.studentName.toLowerCase().includes(q) ||
          s.familyName.toLowerCase().includes(q),
        );
      });
    }

    arr.sort((a, b) => {
      if (a.isUnassigned !== b.isUnassigned) return a.isUnassigned ? -1 : 1;
      return b.students.length - a.students.length || a.teacherName.localeCompare(b.teacherName);
    });
    return arr;
  }, [viewMode, rows, studentsByFamily, activeLocationId, search]);

  const applyInsightFilter = useCallback((f: InsightFilter | undefined) => {
    if (!f) return;
    setViewMode("families");
    setActiveChip(f.status ?? null);
    if (typeof f.search === "string") setSearch(f.search);
    if (f.locationId !== undefined) workspace.setSelectedLocId(f.locationId);
  }, [workspace]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setActiveChip(null);
  }, []);

  const hasActiveFilters = !!(search || activeChip);
  const activeLocationLabel = activeLocationId
    ? (locationOptions.find((l) => l.id === activeLocationId)?.name ?? null)
    : null;

  if (isMobile) {
    return (
      <FamiliesListClient
        rows={rows}
        counts={counts}
        locationNameById={locationNameById}
        locationOptions={locationOptions}
        studentsByFamily={studentsByFamily}
        teacherByFamily={teacherByFamily}
      />
    );
  }

  return (
    <div className="mc-bg" style={{
      fontFamily: FONT,
      color: FG,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      minHeight: 0,
      position: "relative",
      letterSpacing: "-0.005em",
    }}>
      <style>{CSS}</style>

      <HudStrip
        rowCount={viewMode === "families" ? filtered.length : teachersAggregate.length}
        totalCount={rows.length}
        kpi={kpi}
        search={search}
        onSearch={setSearch}
        onNewFamily={() => setShowAdd(true)}
        activeLocationLabel={activeLocationLabel ? shortLoc(activeLocationLabel) : null}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === "families" && (
        <FiltersBar
          kpi={kpi}
          activeChip={activeChip}
          onChipChange={setActiveChip}
          sortMode={sortMode}
          onSortChange={setSortMode}
          hasActiveFilters={hasActiveFilters}
          onClearAll={clearFilters}
          rowCount={filtered.length}
        />
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 320px",
        gap: 0,
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        borderTop: `1px solid ${SURFACE_BORDER}`,
      }}>
        {viewMode === "families" ? (
          <FamilyTable
            rows={filtered}
            counts={counts}
            locationNameById={locationNameById}
            studentsByFamily={studentsByFamily}
            teacherByFamily={teacherByFamily}
            inlineTeachersByFamily={inlineTeachersByFamily}
            missingTeacherByFamily={missingTeacherByFamily}
            splitSiblingsByFamily={splitSiblingsByFamily}
            expandedIds={expandedFamilyIds}
            onToggleExpand={toggleFamilyExpand}
            onOpen={(id) => router.push(`/crm/families/${id}`)}
            onClearAll={clearFilters}
            hasActiveFilters={hasActiveFilters}
            nowMs={nowMs}
            riskByFamily={riskByFamily}
          />
        ) : (
          <TeacherTable
            teachers={teachersAggregate}
            locationNameById={locationNameById}
            expandedIds={expandedTeacherIds}
            onToggleExpand={toggleTeacherExpand}
            onOpenFamily={(id) => router.push(`/crm/families/${id}`)}
          />
        )}

        <IntelPanel insights={insights} onApply={applyInsightFilter} />
      </div>

      <AddFamilyModal
        open={showAdd}
        onClose={() => {
          setShowAdd(false);
          if (searchParams?.get("new") === "true") {
            router.replace("/crm/families");
          }
        }}
        locations={locationOptions}
      />
    </div>
  );
}

// ─── HUD top bar ───────────────────────────────────────────────────────────

function HudStrip({
  rowCount,
  totalCount,
  kpi,
  search,
  onSearch,
  onNewFamily,
  activeLocationLabel,
  viewMode,
  onViewModeChange,
}: {
  rowCount: number;
  totalCount: number;
  kpi: FamiliesKpi;
  search: string;
  onSearch: (v: string) => void;
  onNewFamily: () => void;
  activeLocationLabel: string | null;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
}) {
  const showingFiltered = viewMode === "families" && rowCount !== totalCount;
  return (
    <div className="mc-glass" style={{
      display: "flex",
      alignItems: "center",
      gap: 24,
      padding: "12px 24px",
      borderBottom: `1px solid ${SURFACE_BORDER}`,
      minHeight: 56,
      position: "relative",
      zIndex: 2,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <ViewToggle viewMode={viewMode} onChange={onViewModeChange} />
        {activeLocationLabel && (
          <span style={{
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 500,
            color: FG_SECONDARY,
            letterSpacing: "-0.01em",
          }}>
            · {activeLocationLabel}
          </span>
        )}
        <span style={{
          ...NUM_STYLE,
          fontSize: 12,
          fontWeight: 500,
          color: FG_SECONDARY,
          letterSpacing: "0",
        }}>
          <span className="mc-dot-live" style={{
            display: "inline-block", width: 6, height: 6, borderRadius: "50%",
            background: ACCENT, marginRight: 7, verticalAlign: "middle",
            boxShadow: `0 0 6px ${ACCENT}`,
          }} />
          {viewMode === "families"
            ? (showingFiltered ? `${rowCount} of ${totalCount}` : `${totalCount}`) + " active"
            : `${rowCount} teachers`}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "center", flexWrap: "wrap" }}>
        <MiniStat label="Overdue" value={kpi.overdue} tone={kpi.overdue > 0 ? "urgent" : "neutral"} />
        <MiniStat label="No teacher" value={kpi.noTeacher} tone={kpi.noTeacher > 0 ? "warn" : "neutral"} />
        <MiniStat label="New / 30d" value={kpi.newLast30} tone="info" />
        <MiniStat label="Active" value={`${kpi.activePct}%`} tone="accent" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <input
            type="search"
            placeholder="Search families, students, teachers…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            style={{
              fontFamily: FONT,
              padding: "8px 36px 8px 12px",
              width: 280,
              borderRadius: 7,
              border: `1px solid ${SURFACE_BORDER}`,
              background: "rgba(3,3,3,0.55)",
              color: FG,
              fontSize: 13,
              outline: "none",
              letterSpacing: "-0.005em",
            }}
          />
          <kbd style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 10,
            fontFamily: FONT,
            fontWeight: 500,
            color: FG_TERTIARY,
            border: `1px solid ${SURFACE_BORDER}`,
            borderRadius: 4,
            padding: "1px 6px",
            background: "rgba(255,255,255,0.02)",
            pointerEvents: "none",
          }}>/</kbd>
        </div>

        <button
          type="button"
          onClick={onNewFamily}
          style={{
            fontFamily: FONT,
            padding: "8px 16px",
            borderRadius: 7,
            border: `1px solid ${ACCENT}55`,
            background: "rgba(196,240,54,0.08)",
            color: ACCENT,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "-0.005em",
            boxShadow: "0 0 14px rgba(196,240,54,0.10)",
            transition: "background 0.12s, border-color 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(196,240,54,0.14)";
            e.currentTarget.style.borderColor = ACCENT;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(196,240,54,0.08)";
            e.currentTarget.style.borderColor = `${ACCENT}55`;
          }}
        >
          + Add family
        </button>
      </div>
    </div>
  );
}

function ViewToggle({ viewMode, onChange }: { viewMode: ViewMode; onChange: (m: ViewMode) => void }) {
  const items: { id: ViewMode; label: string }[] = [
    { id: "families", label: "Families" },
    { id: "teachers", label: "Teachers" },
  ];
  return (
    <div style={{
      display: "inline-flex",
      padding: 2,
      borderRadius: 8,
      border: `1px solid ${SURFACE_BORDER}`,
      background: "rgba(3,3,3,0.5)",
    }}>
      {items.map((it) => {
        const active = it.id === viewMode;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            style={{
              fontFamily: FONT,
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              background: active ? "rgba(196,240,54,0.12)" : "transparent",
              color: active ? ACCENT : FG_SECONDARY,
              fontSize: 12.5,
              fontWeight: active ? 600 : 500,
              letterSpacing: "-0.01em",
              cursor: "pointer",
              transition: "background 0.12s, color 0.12s",
            }}
            onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = FG; }}
            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = FG_SECONDARY; }}
          >{it.label}</button>
        );
      })}
    </div>
  );
}

type KpiTone = "neutral" | "urgent" | "warn" | "info" | "accent";

function MiniStat({ label, value, tone }: { label: string; value: number | string; tone: KpiTone }) {
  const tones: Record<KpiTone, { fg: string; border: string; pulse: string }> = {
    neutral: { fg: FG_SECONDARY, border: "rgba(255,255,255,0.06)", pulse: "" },
    urgent:  { fg: URGENT, border: Number(value) > 0 ? `${URGENT}55` : "rgba(255,255,255,0.06)", pulse: "mc-pulse-red" },
    warn:    { fg: OPP,    border: Number(value) > 0 ? `${OPP}55` : "rgba(255,255,255,0.06)", pulse: "mc-pulse-amber" },
    info:    { fg: INFO,   border: "rgba(255,255,255,0.06)", pulse: "" },
    accent:  { fg: ACCENT, border: "rgba(255,255,255,0.06)", pulse: "" },
  };
  const t = tones[tone];
  return (
    <div className={Number(value) > 0 ? t.pulse : ""} style={{
      padding: "5px 12px",
      borderRadius: 6,
      border: `1px solid ${t.border}`,
      display: "flex",
      alignItems: "baseline",
      gap: 7,
      whiteSpace: "nowrap",
    }}>
      <span style={{
        ...NUM_STYLE,
        fontSize: 13,
        fontWeight: 600,
        color: t.fg,
        letterSpacing: "-0.01em",
      }}>{value}</span>
      <span style={{
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 500,
        color: FG_TERTIARY,
        letterSpacing: "-0.005em",
      }}>{label}</span>
    </div>
  );
}

// ─── Filters toolbar (above table) ────────────────────────────────────────

function FiltersBar({
  kpi,
  activeChip,
  onChipChange,
  sortMode,
  onSortChange,
  hasActiveFilters,
  onClearAll,
  rowCount,
}: {
  kpi: FamiliesKpi;
  activeChip: InsightFilter["status"] | null;
  onChipChange: (s: InsightFilter["status"] | null) => void;
  sortMode: SortMode;
  onSortChange: (m: SortMode) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
  rowCount: number;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 24px",
      borderBottom: `1px solid ${SURFACE_BORDER}`,
      background: "rgba(8,8,10,0.45)",
      minHeight: 44,
    }}>
      <FilterChip
        label="Overdue"
        count={kpi.overdue}
        active={activeChip === "overdue"}
        color={URGENT}
        onClick={() => onChipChange(activeChip === "overdue" ? null : "overdue")}
      />
      <FilterChip
        label="No teacher"
        count={kpi.noTeacher}
        active={activeChip === "no-teacher"}
        color={OPP}
        onClick={() => onChipChange(activeChip === "no-teacher" ? null : "no-teacher")}
      />
      <FilterChip
        label="New / 30d"
        count={kpi.newLast30}
        active={activeChip === "new"}
        color={INFO}
        onClick={() => onChipChange(activeChip === "new" ? null : "new")}
      />
      <FilterChip
        label="Trial"
        count={null}
        active={activeChip === "trial"}
        color={VIOLET}
        onClick={() => onChipChange(activeChip === "trial" ? null : "trial")}
      />

      <div style={{ flex: 1 }} />

      <span style={{
        ...NUM_STYLE,
        fontSize: 11.5,
        fontWeight: 500,
        color: FG_TERTIARY,
        marginRight: 6,
      }}>
        {rowCount.toLocaleString()} {rowCount === 1 ? "family" : "families"}
      </span>

      <SortControl sortMode={sortMode} onChange={onSortChange} />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          style={{
            fontFamily: FONT,
            padding: "6px 12px",
            borderRadius: 6,
            border: `1px solid ${SURFACE_BORDER}`,
            background: "transparent",
            color: FG_SECONDARY,
            fontSize: 11.5,
            fontWeight: 500,
            cursor: "pointer",
            letterSpacing: "-0.005em",
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number | null;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: FONT,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 12px",
        borderRadius: 7,
        border: `1px solid ${active ? color : SURFACE_BORDER}`,
        background: active ? `${color}1c` : "transparent",
        color: active ? color : FG_SECONDARY,
        fontSize: 12,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        letterSpacing: "-0.005em",
        transition: "background 0.12s, border-color 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
          e.currentTarget.style.color = FG;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = FG_SECONDARY;
        }
      }}
    >
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: color, flexShrink: 0,
        boxShadow: active ? `0 0 6px ${color}` : "none",
      }} />
      {label}
      {count != null && count > 0 && (
        <span style={{
          ...NUM_STYLE,
          fontSize: 11,
          fontWeight: 600,
          color: active ? color : FG_TERTIARY,
          letterSpacing: 0,
        }}>{count}</span>
      )}
    </button>
  );
}

function SortControl({ sortMode, onChange }: { sortMode: SortMode; onChange: (m: SortMode) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          fontFamily: FONT,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 6,
          border: `1px solid ${SURFACE_BORDER}`,
          background: "transparent",
          color: FG_SECONDARY,
          fontSize: 11.5,
          fontWeight: 500,
          cursor: "pointer",
          letterSpacing: "-0.005em",
        }}
      >
        <span style={{ color: FG_TERTIARY }}>Sort:</span>
        <span style={{ color: FG }}>{SORT_LABELS[sortMode]}</span>
        <span style={{ color: FG_TERTIARY, fontSize: 9 }}>▾</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
          <div className="mc-glass" style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 100,
            minWidth: 200,
            padding: 6,
            borderRadius: 8,
            border: `1px solid ${SURFACE_BORDER}`,
            boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
          }}>
            {(Object.keys(SORT_LABELS) as SortMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { onChange(m); setOpen(false); }}
                style={{
                  fontFamily: FONT,
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "7px 12px",
                  borderRadius: 5,
                  border: "none",
                  background: sortMode === m ? "rgba(196,240,54,0.08)" : "transparent",
                  color: sortMode === m ? ACCENT : FG,
                  fontSize: 12.5,
                  fontWeight: sortMode === m ? 600 : 500,
                  cursor: "pointer",
                  letterSpacing: "-0.005em",
                }}
                onMouseEnter={(e) => { if (sortMode !== m) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { if (sortMode !== m) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                {SORT_LABELS[m]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Table (shared row avatar for student roster + main Teacher column) ──

function InlineStudentTeacherAvatar({
  photoUrl,
  teacherName,
  needsAssignment,
  hasTeacher,
  size = 24,
}: {
  photoUrl?: string | null;
  teacherName: string | null;
  needsAssignment: boolean;
  hasTeacher: boolean;
  size?: number;
}) {
  const border = `1px solid ${SURFACE_BORDER}`;
  if (needsAssignment) {
    return (
      <div
        title="Needs teacher"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          flexShrink: 0,
          background: "rgba(245,158,11,0.12)",
          border: `1px dashed ${OPP}66`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
          fontSize: Math.round(size * 0.45),
          fontWeight: 700,
          color: OPP,
        }}
      >
        ?
      </div>
    );
  }
  if (hasTeacher && photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={teacherName ? `Teacher: ${teacherName}` : "Teacher"}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border,
        }}
      />
    );
  }
  if (hasTeacher) {
    const ini = initials(teacherName);
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          flexShrink: 0,
          background: "rgba(255,255,255,0.06)",
          border,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
          fontSize: Math.round(size * 0.38),
          fontWeight: 700,
          color: FG_SECONDARY,
          letterSpacing: "-0.02em",
        }}
      >
        {ini}
      </div>
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: "rgba(255,255,255,0.04)",
        border: `1px dashed ${FG_QUIET}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        fontSize: Math.round(size * 0.32),
        fontWeight: 600,
        color: FG_QUIET,
      }}
    >
      —
    </div>
  );
}

function FamilyTableTeacherCell({
  chips,
  fallbackLabel,
  missingTeachers,
}: {
  chips: FamilyTeacherChip[];
  fallbackLabel: string;
  missingTeachers: number;
}) {
  const hasAssigned = chips.length > 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
      {hasAssigned ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
          flex: 1,
          overflow: "hidden",
        }}>
          {chips.map((t, i) => (
            <Fragment key={t.id}>
              {i > 0 ? (
                <span style={{
                  fontFamily: FONT,
                  fontSize: 12.5,
                  color: FG_TERTIARY,
                  flexShrink: 0,
                  letterSpacing: "-0.005em",
                }}>, </span>
              ) : null}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                minWidth: 0,
                overflow: "hidden",
                flex: chips.length > 1 ? "1 1 0" : "1 1 auto",
              }}>
                <InlineStudentTeacherAvatar
                  photoUrl={t.photoUrl}
                  teacherName={t.name}
                  needsAssignment={false}
                  hasTeacher
                  size={22}
                />
                <span style={{
                  fontFamily: FONT,
                  fontSize: 12.5,
                  color: FG_SECONDARY,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: "-0.005em",
                  minWidth: 0,
                }}>{t.name}</span>
              </div>
            </Fragment>
          ))}
        </div>
      ) : (
        <span style={{
          fontFamily: FONT,
          fontSize: 12.5,
          color: FG_QUIET,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontStyle: "italic",
          letterSpacing: "-0.005em",
          flex: 1,
          minWidth: 0,
        }}>{fallbackLabel}</span>
      )}
      {missingTeachers > 0 && hasAssigned && (
        <span
          title={`${missingTeachers} student${missingTeachers === 1 ? "" : "s"} without a teacher`}
          style={{
            fontFamily: FONT,
            fontSize: 9.5,
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: 3,
            background: `${OPP}1f`,
            color: OPP,
            letterSpacing: "0.02em",
            flexShrink: 0,
          }}
        >+{missingTeachers}</span>
      )}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────

const TABLE_GRID = "20px 44px minmax(0, 1.6fr) 80px minmax(0, 1.5fr) 100px 96px 88px 100px";

function FamilyTable({
  rows,
  counts,
  locationNameById,
  studentsByFamily,
  teacherByFamily,
  inlineTeachersByFamily,
  missingTeacherByFamily,
  splitSiblingsByFamily,
  expandedIds,
  onToggleExpand,
  onOpen,
  onClearAll,
  hasActiveFilters,
  nowMs,
  riskByFamily,
}: {
  rows: FamilyRow[];
  counts: Record<string, number>;
  locationNameById: Record<string, string>;
  studentsByFamily: Record<string, StudentEntry[]>;
  teacherByFamily: Record<string, string>;
  inlineTeachersByFamily: Record<string, FamilyTeacherChip[]>;
  missingTeacherByFamily: Record<string, number>;
  splitSiblingsByFamily: Record<string, boolean>;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onOpen: (id: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  nowMs: number;
  riskByFamily: Record<string, RiskScore>;
}) {
  return (
    <div style={{
      overflowY: "auto",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
    }}>
      <div className="mc-glass" style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        borderBottom: `1px solid ${SURFACE_BORDER}`,
        display: "grid",
        gridTemplateColumns: TABLE_GRID,
        padding: "10px 24px",
        gap: 14,
        alignItems: "center",
      }}>
        <span />
        {["Risk", "Family", "Students", "Teacher", "Location", "Balance", "Joined", "Status"].map((h) => (
          <span key={h} style={{
            fontFamily: FONT,
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: FG_TERTIARY,
            textTransform: "uppercase",
          }}>{h}</span>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState hasActiveFilters={hasActiveFilters} onClearAll={onClearAll} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {rows.map((row, idx) => (
            <TableRow
              key={row.id}
              row={row}
              studentCount={counts[row.id] ?? 0}
              students={studentsByFamily[row.id] ?? []}
              teacher={teacherByFamily[row.id] ?? ""}
              teacherChips={inlineTeachersByFamily[row.id] ?? []}
              missingTeachers={missingTeacherByFamily[row.id] ?? 0}
              splitSiblings={splitSiblingsByFamily[row.id] ?? false}
              isExpanded={expandedIds.has(row.id)}
              onToggleExpand={() => onToggleExpand(row.id)}
              locationName={locationNameById[row.primary_location_id ?? ""] ?? null}
              onOpen={() => onOpen(row.id)}
              nowMs={nowMs}
              risk={riskByFamily[row.id]}
              fadeIndex={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasActiveFilters, onClearAll }: { hasActiveFilters: boolean; onClearAll: () => void }) {
  return (
    <div style={{
      padding: "80px 24px",
      textAlign: "center",
      color: FG_SECONDARY,
      fontSize: 13,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      fontFamily: FONT,
    }}>
      <div style={{
        fontSize: 17,
        color: FG,
        fontWeight: 600,
        letterSpacing: "-0.015em",
      }}>
        {hasActiveFilters ? "No families match those filters." : "No families yet."}
      </div>
      <div style={{ fontSize: 13, maxWidth: 360, lineHeight: 1.5, color: FG_SECONDARY }}>
        {hasActiveFilters
          ? "Try widening the search, or clear the filters to see your full roster."
          : "Add your first family to get started."}
      </div>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          style={{
            fontFamily: FONT,
            padding: "8px 18px", borderRadius: 7,
            border: `1px solid ${ACCENT}55`,
            background: "rgba(196,240,54,0.08)",
            color: ACCENT,
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            letterSpacing: "-0.005em",
          }}
        >Clear filters</button>
      )}
    </div>
  );
}

function TableRow({
  row,
  studentCount,
  students,
  teacher,
  teacherChips,
  missingTeachers,
  splitSiblings,
  isExpanded,
  onToggleExpand,
  locationName,
  onOpen,
  nowMs,
  risk,
  fadeIndex,
}: {
  row: FamilyRow;
  studentCount: number;
  students: StudentEntry[];
  teacher: string;
  teacherChips: FamilyTeacherChip[];
  missingTeachers: number;
  splitSiblings: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  locationName: string | null;
  onOpen: () => void;
  nowMs: number;
  risk: RiskScore | undefined;
  fadeIndex: number;
}) {
  const overdue = isRowOverdue(row);
  const isMil = row.is_military === true;
  const isNew = isRowNewLast30(row, nowMs);
  const isTrial = isRowTrial(row);
  const isActive = isRowActive(row);
  const rt = relTime(row.created_at, nowMs);
  const status = (row.status ?? "").toLowerCase();
  const riskBand = risk?.band ?? "fine";
  const riskColor = RISK_COLORS[riskBand].fg;
  const fadeDelay = Math.min(fadeIndex, 24) * 0.012;

  const balanceDisplay = row.overdue_balance_cents && row.overdue_balance_cents > 0
    ? { label: fmtCents(row.overdue_balance_cents), color: URGENT, bold: true }
    : row.balance != null && row.balance > 0
      ? { label: fmtNumber(row.balance), color: FG, bold: false }
      : { label: "$0", color: FG_TERTIARY, bold: false };

  const instrumentSet = new Set<string>();
  for (const s of students) {
    if (s.instrument) instrumentSet.add(s.instrument.toLowerCase());
  }
  const instruments = Array.from(instrumentSet).slice(0, 4);

  const dotColor = row.primary_location_id ? locDotColor(row.primary_location_id) : FG_QUIET;

  let statusPill: { label: string; color: string } | null = null;
  if (overdue) statusPill = { label: "Overdue", color: URGENT };
  else if (isTrial) statusPill = { label: "Trial", color: VIOLET };
  else if (isNew) statusPill = { label: "New", color: INFO };
  else if (isActive) statusPill = { label: "Active", color: ACCENT };
  else if (status === "inactive" || status === "paused") statusPill = { label: status === "paused" ? "Paused" : "Inactive", color: FG_TERTIARY };
  else if (status === "archived") statusPill = { label: "Archived", color: FG_QUIET };

  const expandable = students.length > 0;
  const teacherDisplay = teacher || "Unassigned";

  return (
    <>
      <div
        className="mc-row"
        onClick={onOpen}
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: TABLE_GRID,
          gap: 14,
          padding: "12px 24px",
          alignItems: "center",
          cursor: "pointer",
          borderBottom: isExpanded ? "none" : `1px solid ${SURFACE_BORDER}`,
          background: isExpanded ? "rgba(255,255,255,0.018)" : "transparent",
          transition: "background 0.12s",
          animationDelay: `${fadeDelay}s`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0, top: 0, bottom: 0,
            width: 3,
            background: `linear-gradient(to bottom, ${riskColor}, ${riskColor}66, ${riskColor}22)`,
            opacity: riskBand === "fine" ? 0.35 : 1,
            boxShadow: riskBand === "critical" ? `0 0 10px ${riskColor}` : riskBand === "risk" ? `0 0 6px ${riskColor}88` : "none",
          }}
        />

        <button
          type="button"
          aria-label={isExpanded ? "Collapse" : "Expand"}
          onClick={(e) => { e.stopPropagation(); if (expandable) onToggleExpand(); }}
          disabled={!expandable}
          style={{
            fontFamily: FONT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20, height: 20,
            border: "none",
            background: "transparent",
            color: expandable ? FG_TERTIARY : FG_QUIET,
            cursor: expandable ? "pointer" : "default",
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease, color 0.12s",
            fontSize: 11,
          }}
          onMouseEnter={(e) => { if (expandable) (e.currentTarget as HTMLButtonElement).style.color = FG; }}
          onMouseLeave={(e) => { if (expandable) (e.currentTarget as HTMLButtonElement).style.color = FG_TERTIARY; }}
        >▶</button>

        <RiskCell risk={risk} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <FamilyAvatar name={row.name} risk={risk} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <span style={{
                fontFamily: FONT,
                fontSize: 13.5, fontWeight: 600,
                color: FG,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                maxWidth: 220,
              }}>
                {(row.name ?? "").replace(/\s+family$/i, "").trim() || row.name}
              </span>
              {isMil && (
                <span style={{
                  fontFamily: FONT,
                  fontSize: 9.5, fontWeight: 600,
                  padding: "1px 6px", borderRadius: 3,
                  background: "rgba(167,139,250,0.14)", color: VIOLET,
                  letterSpacing: "0.02em",
                }}>MIL</span>
              )}
              {splitSiblings && (
                <span
                  title="Siblings are with different teachers"
                  style={{
                    fontFamily: FONT,
                    fontSize: 9.5, fontWeight: 600,
                    padding: "1px 6px", borderRadius: 3,
                    background: "rgba(34,211,238,0.14)", color: INFO,
                    letterSpacing: "0.02em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}>
                  <span style={{ fontSize: 9 }}>⇆</span>SPLIT
                </span>
              )}
            </div>
            {row.primary_email && (
              <div style={{
                fontFamily: FONT,
                fontSize: 11,
                color: FG_TERTIARY,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                maxWidth: 260, marginTop: 2,
                letterSpacing: "-0.005em",
              }}>
                {row.primary_email}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{
            ...NUM_STYLE,
            fontSize: 14, fontWeight: 600,
            color: studentCount > 0 ? FG : FG_TERTIARY,
            minWidth: 18,
          }}>{studentCount}</span>
          <div style={{ display: "flex", gap: 0, fontSize: 13, opacity: 0.9 }}>
            {instruments.map((i, idx) => (
              <span key={idx} style={{ marginLeft: -2 }}>{instrEmoji(i)}</span>
            ))}
          </div>
        </div>

        <FamilyTableTeacherCell
          chips={teacherChips}
          fallbackLabel={teacherDisplay}
          missingTeachers={missingTeachers}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: dotColor,
            boxShadow: `0 0 5px ${dotColor}99`,
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: FONT,
            fontSize: 12,
            color: FG_SECONDARY,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            letterSpacing: "-0.005em",
          }}>{shortLoc(locationName)}</span>
        </div>

        <div style={{
          ...NUM_STYLE,
          fontSize: 13,
          fontWeight: balanceDisplay.bold ? 700 : 500,
          color: balanceDisplay.color,
          letterSpacing: "-0.01em",
          textShadow: balanceDisplay.bold ? `0 0 8px ${URGENT}55` : "none",
        }}>
          {balanceDisplay.label}
        </div>

        <div style={{
          ...NUM_STYLE,
          fontSize: 12,
          color: (rt.days ?? 0) > 60 ? URGENT : FG_SECONDARY,
          letterSpacing: "-0.005em",
        }}>
          {rt.label}
        </div>

        <div>
          {statusPill && (
            <span style={{
              fontFamily: FONT,
              display: "inline-block",
              padding: "3px 10px",
              borderRadius: 4,
              border: `1px solid ${statusPill.color}55`,
              color: statusPill.color,
              background: `${statusPill.color}14`,
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.01em",
              boxShadow: statusPill.label === "Overdue" ? `0 0 8px ${statusPill.color}33` : "none",
            }}>{statusPill.label}</span>
          )}
        </div>
      </div>

      {isExpanded && (
        <ExpandedFamilyRow
          students={students}
          onOpenFamily={onOpen}
        />
      )}
    </>
  );
}

function ExpandedFamilyRow({
  students,
  onOpenFamily,
}: {
  students: StudentEntry[];
  onOpenFamily: () => void;
}) {
  const sorted = useMemo(() => {
    return [...students].sort((a, b) => {
      const aActive = (a.status ?? "").toLowerCase() === "active";
      const bActive = (b.status ?? "").toLowerCase() === "active";
      if (aActive !== bActive) return aActive ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [students]);

  return (
    <div
      style={{
        borderBottom: `1px solid ${SURFACE_BORDER}`,
        padding: "8px 24px 14px 60px",
        background: "rgba(196,240,54,0.018)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{
        fontFamily: FONT,
        fontSize: 10.5,
        fontWeight: 600,
        color: FG_TERTIARY,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        Roster · {sorted.length} {sorted.length === 1 ? "student" : "students"}
      </div>
      {sorted.map((s) => {
        const isActive = (s.status ?? "").toLowerCase() === "active";
        const isUnassigned = !s.teacherName && !s.teacherId;
        const hasTeacher = !!(s.teacherId || s.teacherName);
        return (
          <div
            key={s.id}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1.6fr) auto",
              gap: 16,
              alignItems: "center",
              padding: "6px 10px",
              borderRadius: 5,
              background: "rgba(255,255,255,0.012)",
              opacity: isActive ? 1 : 0.55,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <InlineStudentTeacherAvatar
                photoUrl={s.teacherPhotoUrl}
                teacherName={s.teacherName ?? null}
                needsAssignment={isUnassigned && isActive}
                hasTeacher={hasTeacher}
              />
              <span style={{
                fontFamily: FONT,
                fontSize: 12.5,
                fontWeight: 600,
                color: FG,
                letterSpacing: "-0.005em",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{s.name}</span>
            </div>
            <span style={{
              fontFamily: FONT,
              fontSize: 11.5,
              color: s.instrument ? FG_SECONDARY : FG_QUIET,
              letterSpacing: "-0.005em",
              fontStyle: s.instrument ? "normal" : "italic",
            }}>
              {s.instrument ? `${instrEmoji(s.instrument)} ${s.instrument}` : "no instrument"}
            </span>
            {isUnassigned && isActive ? (
              <span style={{
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 600,
                color: OPP,
                letterSpacing: "-0.005em",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: OPP,
                  boxShadow: `0 0 6px ${OPP}aa`,
                }} />
                Needs teacher
              </span>
            ) : (
              <span style={{
                fontFamily: FONT,
                fontSize: 11.5,
                color: s.teacherName ? FG_SECONDARY : FG_QUIET,
                letterSpacing: "-0.005em",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{s.teacherName ?? (isActive ? "Unassigned" : (s.status ?? "Inactive"))}</span>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenFamily(); }}
              style={{
                fontFamily: FONT,
                fontSize: 10.5,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 4,
                border: `1px solid ${SURFACE_BORDER}`,
                background: "transparent",
                color: FG_SECONDARY,
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = FG; (e.currentTarget as HTMLButtonElement).style.borderColor = `${ACCENT}66`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = FG_SECONDARY; (e.currentTarget as HTMLButtonElement).style.borderColor = SURFACE_BORDER; }}
            >OPEN</button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Teachers lens ────────────────────────────────────────────────────────

const TEACHER_GRID = "20px minmax(0, 1.4fr) 80px minmax(0, 1.4fr) minmax(0, 1.4fr) 64px";

function TeacherTable({
  teachers,
  locationNameById,
  expandedIds,
  onToggleExpand,
  onOpenFamily,
}: {
  teachers: TeacherAggregate[];
  locationNameById: Record<string, string>;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onOpenFamily: (id: string) => void;
}) {
  return (
    <div style={{
      overflowY: "auto",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
    }}>
      <div className="mc-glass" style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        borderBottom: `1px solid ${SURFACE_BORDER}`,
        display: "grid",
        gridTemplateColumns: TEACHER_GRID,
        padding: "10px 24px",
        gap: 14,
        alignItems: "center",
      }}>
        <span />
        {["Teacher", "Load", "Instruments", "Locations", ""].map((h, i) => (
          <span key={i} style={{
            fontFamily: FONT,
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: FG_TERTIARY,
            textTransform: "uppercase",
          }}>{h}</span>
        ))}
      </div>

      {teachers.length === 0 ? (
        <div style={{
          padding: "80px 24px",
          textAlign: "center",
          color: FG_SECONDARY,
          fontSize: 13,
          fontFamily: FONT,
        }}>
          No teachers match.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {teachers.map((t, idx) => (
            <TeacherRow
              key={t.teacherId}
              teacher={t}
              locationNameById={locationNameById}
              isExpanded={expandedIds.has(t.teacherId)}
              onToggleExpand={() => onToggleExpand(t.teacherId)}
              onOpenFamily={onOpenFamily}
              fadeIndex={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TeacherRow({
  teacher,
  locationNameById,
  isExpanded,
  onToggleExpand,
  onOpenFamily,
  fadeIndex,
}: {
  teacher: TeacherAggregate;
  locationNameById: Record<string, string>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenFamily: (id: string) => void;
  fadeIndex: number;
}) {
  const load = teacher.students.length;
  const loadColor =
    teacher.isUnassigned ? OPP :
    load >= 40 ? URGENT :
    load >= 25 ? OPP :
    load >= 1 ? ACCENT :
    FG_TERTIARY;
  const fadeDelay = Math.min(fadeIndex, 24) * 0.012;

  const topInstr = Array.from(teacher.instruments.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const locNames = Array.from(teacher.locationIds)
    .map((id) => locationNameById[id])
    .filter((n): n is string => Boolean(n))
    .map(shortLoc);

  return (
    <>
      <div
        className="mc-row"
        onClick={onToggleExpand}
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: TEACHER_GRID,
          gap: 14,
          padding: "12px 24px",
          alignItems: "center",
          cursor: "pointer",
          borderBottom: isExpanded ? "none" : `1px solid ${SURFACE_BORDER}`,
          background: isExpanded ? "rgba(255,255,255,0.018)" : "transparent",
          transition: "background 0.12s",
          animationDelay: `${fadeDelay}s`,
        }}
      >
        <div style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0, width: 3,
          background: `linear-gradient(to bottom, ${loadColor}, ${loadColor}66, ${loadColor}22)`,
          opacity: teacher.isUnassigned ? 1 : load === 0 ? 0.25 : 1,
          boxShadow: teacher.isUnassigned || load >= 40 ? `0 0 10px ${loadColor}` : "none",
        }} />

        <button
          type="button"
          aria-label={isExpanded ? "Collapse" : "Expand"}
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          style={{
            fontFamily: FONT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20, height: 20,
            border: "none",
            background: "transparent",
            color: FG_TERTIARY,
            cursor: "pointer",
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease, color 0.12s",
            fontSize: 11,
          }}
        >▶</button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <TeacherAvatar name={teacher.teacherName} accent={loadColor} unassigned={teacher.isUnassigned} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{
              fontFamily: FONT,
              fontSize: 13.5,
              fontWeight: 600,
              color: teacher.isUnassigned ? OPP : FG,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              display: "block",
            }}>{teacher.teacherName}</span>
            {teacher.isUnassigned && (
              <span style={{
                fontFamily: FONT,
                fontSize: 10.5,
                color: FG_TERTIARY,
                letterSpacing: "-0.005em",
                marginTop: 2,
                display: "block",
              }}>Active students without an assigned teacher</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{
            ...NUM_STYLE,
            fontSize: 18,
            fontWeight: 700,
            color: loadColor,
            letterSpacing: "-0.02em",
            textShadow: load >= 40 || teacher.isUnassigned ? `0 0 8px ${loadColor}66` : "none",
          }}>{load}</span>
          <span style={{
            fontFamily: FONT,
            fontSize: 10.5,
            color: FG_TERTIARY,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>{load === 1 ? "student" : "students"}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {topInstr.length === 0 ? (
            <span style={{ fontFamily: FONT, fontSize: 11.5, color: FG_QUIET, fontStyle: "italic" }}>—</span>
          ) : (
            topInstr.map(([name, n]) => (
              <span key={name} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontFamily: FONT,
                fontSize: 11,
                color: FG_SECONDARY,
                padding: "2px 7px",
                borderRadius: 4,
                background: "rgba(255,255,255,0.025)",
                letterSpacing: "-0.005em",
              }}>
                <span style={{ fontSize: 12 }}>{instrEmoji(name)}</span>
                <span style={{ textTransform: "capitalize" }}>{name}</span>
                <span style={{ ...NUM_STYLE, fontWeight: 600, color: FG_TERTIARY }}>{n}</span>
              </span>
            ))
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
          {locNames.length === 0 ? (
            <span style={{ fontFamily: FONT, fontSize: 11.5, color: FG_QUIET, fontStyle: "italic" }}>—</span>
          ) : (
            locNames.slice(0, 3).map((name, i) => (
              <span key={i} style={{
                fontFamily: FONT,
                fontSize: 11,
                color: FG_SECONDARY,
                padding: "2px 7px",
                borderRadius: 4,
                background: "rgba(255,255,255,0.025)",
                letterSpacing: "-0.005em",
                whiteSpace: "nowrap",
              }}>{name}</span>
            ))
          )}
          {locNames.length > 3 && (
            <span style={{ ...NUM_STYLE, fontSize: 11, color: FG_TERTIARY }}>+{locNames.length - 3}</span>
          )}
        </div>

        <span style={{
          fontFamily: FONT,
          fontSize: 10.5,
          fontWeight: 600,
          color: FG_TERTIARY,
          letterSpacing: "0.04em",
          textAlign: "right",
        }}>
          {isExpanded ? "HIDE" : "VIEW"}
        </span>
      </div>

      {isExpanded && (
        <ExpandedTeacherRoster
          students={teacher.students}
          locationNameById={locationNameById}
          onOpenFamily={onOpenFamily}
          accent={loadColor}
        />
      )}
    </>
  );
}

function TeacherAvatar({ name, accent, unassigned }: { name: string; accent: string; unassigned: boolean }) {
  if (unassigned) {
    return (
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "rgba(245,158,11,0.12)",
        border: `1px dashed ${OPP}88`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT,
        fontSize: 14, fontWeight: 700,
        color: OPP,
        flexShrink: 0,
      }}>?</div>
    );
  }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      background: `${accent}1f`,
      border: `1px solid ${accent}66`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FONT,
      fontSize: 10.5, fontWeight: 700,
      color: accent,
      letterSpacing: "-0.005em",
      flexShrink: 0,
    }}>{initials(name)}</div>
  );
}

function ExpandedTeacherRoster({
  students,
  locationNameById,
  onOpenFamily,
  accent,
}: {
  students: TeacherStudentEntry[];
  locationNameById: Record<string, string>;
  onOpenFamily: (id: string) => void;
  accent: string;
}) {
  const sorted = useMemo(() => {
    return [...students].sort((a, b) => a.familyName.localeCompare(b.familyName) || a.studentName.localeCompare(b.studentName));
  }, [students]);

  return (
    <div style={{
      borderBottom: `1px solid ${SURFACE_BORDER}`,
      padding: "8px 24px 14px 60px",
      background: `${accent}05`,
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <div style={{
        fontFamily: FONT,
        fontSize: 10.5,
        fontWeight: 600,
        color: FG_TERTIARY,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        Roster · {sorted.length} {sorted.length === 1 ? "student" : "students"}
      </div>
      {sorted.map((s) => (
        <div
          key={s.studentId}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) auto",
            gap: 16,
            alignItems: "center",
            padding: "6px 10px",
            borderRadius: 5,
            background: "rgba(255,255,255,0.012)",
          }}
        >
          <span style={{
            fontFamily: FONT,
            fontSize: 12.5,
            fontWeight: 600,
            color: FG,
            letterSpacing: "-0.005em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{s.studentName}</span>
          <span style={{
            fontFamily: FONT,
            fontSize: 11.5,
            color: FG_SECONDARY,
            letterSpacing: "-0.005em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{s.familyName}</span>
          <span style={{
            fontFamily: FONT,
            fontSize: 11.5,
            color: s.instrument ? FG_SECONDARY : FG_QUIET,
            letterSpacing: "-0.005em",
            fontStyle: s.instrument ? "normal" : "italic",
          }}>
            {s.instrument ? `${instrEmoji(s.instrument)} ${s.instrument}` : "—"}
          </span>
          <span style={{
            fontFamily: FONT,
            fontSize: 11.5,
            color: FG_SECONDARY,
            letterSpacing: "-0.005em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{shortLoc(locationNameById[s.locationId ?? ""] ?? null)}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenFamily(s.familyId); }}
            style={{
              fontFamily: FONT,
              fontSize: 10.5,
              fontWeight: 600,
              padding: "3px 8px",
              borderRadius: 4,
              border: `1px solid ${SURFACE_BORDER}`,
              background: "transparent",
              color: FG_SECONDARY,
              cursor: "pointer",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = FG; (e.currentTarget as HTMLButtonElement).style.borderColor = `${ACCENT}66`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = FG_SECONDARY; (e.currentTarget as HTMLButtonElement).style.borderColor = SURFACE_BORDER; }}
          >OPEN</button>
        </div>
      ))}
    </div>
  );
}

function FamilyAvatar({ name, risk }: { name: string; risk: RiskScore | undefined }) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const palette: [string, string][] = [
    ["#c4f036", "rgba(196,240,54,0.14)"],
    ["#22d3ee", "rgba(34,211,238,0.14)"],
    ["#a78bfa", "rgba(167,139,250,0.14)"],
    ["#f59e0b", "rgba(245,158,11,0.14)"],
    ["#7cffa8", "rgba(124,255,168,0.14)"],
    ["#ff8aa1", "rgba(255,138,161,0.14)"],
  ];
  const [fg, bg] = palette[h % palette.length] ?? ["#c4f036", "rgba(196,240,54,0.14)"];

  const size = 32;
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const score = risk?.score ?? 0;
  const dash = Math.max(0, Math.min(99, score)) / 100 * circ;
  const band = risk?.band ?? "fine";
  const ringColor = RISK_COLORS[band].fg;
  const showRing = band !== "fine";

  return (
    <div style={{
      position: "relative",
      width: size,
      height: size,
      flexShrink: 0,
    }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", pointerEvents: "none" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
        {showRing && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth={2}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${ringColor})`, transition: "stroke-dasharray 0.4s ease" }}
          />
        )}
      </svg>
      <div style={{
        position: "absolute",
        inset: 4,
        borderRadius: "50%",
        background: bg,
        border: `1px solid ${fg}66`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT,
        fontSize: 10.5,
        fontWeight: 700,
        color: fg,
        letterSpacing: "-0.005em",
      }}>{initials(name)}</div>
    </div>
  );
}

function RiskCell({ risk }: { risk: RiskScore | undefined }) {
  if (!risk) {
    return <span style={{ ...NUM_STYLE, fontSize: 11, color: FG_TERTIARY }}>—</span>;
  }
  const c = RISK_COLORS[risk.band];
  const dim = risk.band === "fine";
  return (
    <div
      title={risk.reasons.join(" · ") || "Steady"}
      style={{
        ...NUM_STYLE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 22,
        borderRadius: 4,
        background: dim ? "transparent" : c.bg,
        border: `1px solid ${dim ? "rgba(255,255,255,0.06)" : c.fg + "55"}`,
        fontSize: 11.5,
        fontWeight: 700,
        color: dim ? FG_TERTIARY : c.fg,
        letterSpacing: "-0.01em",
      }}
    >{risk.score}</div>
  );
}

// ─── Intel panel (right rail) ─────────────────────────────────────────────

function IntelPanel({
  insights,
  onApply,
}: {
  insights: Insight[];
  onApply: (f: InsightFilter | undefined) => void;
}) {
  return (
    <aside className="mc-glass-light" style={{
      borderLeft: `1px solid ${SURFACE_BORDER}`,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 18px 12px 18px",
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        borderBottom: `1px solid ${SURFACE_BORDER}`,
      }}>
        <span style={{
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "-0.015em",
          color: FG,
        }}>
          Insights
        </span>
        <span style={{
          ...NUM_STYLE,
          fontSize: 11,
          fontWeight: 500,
          color: FG_TERTIARY,
        }}>{insights.length}</span>
      </div>

      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "14px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        {insights.length === 0 ? (
          <div style={{
            padding: "30px 12px",
            textAlign: "center",
            color: FG_TERTIARY,
            fontSize: 12,
            fontFamily: FONT,
          }}>
            All steady. Nothing to flag.
          </div>
        ) : (
          insights.map((ins) => (
            <InsightCard key={ins.id} insight={ins} onApply={() => onApply(ins.filter)} />
          ))
        )}
      </div>
    </aside>
  );
}

function InsightCard({ insight, onApply }: { insight: Insight; onApply: () => void }) {
  const sevColor = sevColorFor(insight.severity);
  const sevBg = sevBgFor(insight.severity);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onApply}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onApply(); }}
      style={{
        position: "relative",
        padding: "11px 12px 11px 16px",
        borderRadius: 7,
        background: sevBg,
        border: `1px solid ${sevColor}26`,
        cursor: "pointer",
        overflow: "hidden",
        transition: "border-color 0.14s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${sevColor}77`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${sevColor}26`; }}
    >
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: sevColor,
        boxShadow: `0 0 6px ${sevColor}66`,
      }} />
      <div style={{
        fontFamily: FONT,
        fontSize: 12.5,
        fontWeight: 600,
        color: sevColor,
        lineHeight: 1.3,
        marginBottom: 4,
        letterSpacing: "-0.01em",
      }}>{insight.title}</div>
      <div style={{
        fontFamily: FONT,
        fontSize: 11.5,
        color: FG_SECONDARY,
        lineHeight: 1.45,
        marginBottom: 6,
        letterSpacing: "-0.005em",
      }}>{insight.body}</div>
      {insight.filter && (
        <div style={{
          fontFamily: FONT,
          fontSize: 10.5,
          fontWeight: 600,
          color: sevColor,
          letterSpacing: "0.02em",
        }}>
          Apply filter ›
        </div>
      )}
    </div>
  );
}

function sevColorFor(s: InsightSeverity): string {
  if (s === "urgent") return URGENT;
  if (s === "opportunity") return OPP;
  return INFO;
}
function sevBgFor(s: InsightSeverity): string {
  if (s === "urgent") return URGENT_BG;
  if (s === "opportunity") return OPP_BG;
  return INFO_BG;
}
