"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AddFamilyModal } from "./add-family-modal";
import { FamiliesListClient } from "./families-list-client";
import type { Insight, InsightFilter, InsightSeverity, FamiliesKpi } from "./_insights";

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
  teacherName?: string | null;
};

type LocationOpt = { id: string; name: string };

type Props = {
  rows: FamilyRow[];
  counts: Record<string, number>;
  locationNameById: Record<string, string>;
  locationOptions?: LocationOpt[];
  studentsByFamily?: Record<string, StudentEntry[]>;
  teacherByFamily?: Record<string, string>;
  kpi: FamiliesKpi;
  insights: Insight[];
  /** Server-rendered timestamp used as the stable "now" reference for relative time + new-family detection. */
  nowMs: number;
};

const ACCENT = "var(--z-accent, #c4f036)";
const URGENT = "#ff3b6b";
const URGENT_DIM = "rgba(255,59,107,0.14)";
const OPP = "#ffaa2a";
const OPP_DIM = "rgba(255,170,42,0.14)";
const INFO = "#22d3ee";
const INFO_DIM = "rgba(34,211,238,0.14)";

const DAY_MS = 24 * 60 * 60 * 1000;

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

function shortLoc(name: string | null): string {
  if (!name) return "—";
  return name.replace(/\s+Music Lessons?$/i, "").trim() || name;
}

function locDotColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const palette = ["#c4f036", "#22d3ee", "#ff66cc", "#ffaa2a", "#9b7cff", "#00e5cc", "#ff7a7a", "#7cffaa"];
  return palette[h % palette.length] ?? "#c4f036";
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
  const status = (r.billing_status ?? "").toLowerCase();
  if (status === "overdue") return true;
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

function hasNoTeacher(
  r: FamilyRow,
  studentsByFamily: Record<string, StudentEntry[]>,
  teacherByFamily: Record<string, string>,
  counts: Record<string, number>,
): boolean {
  if ((counts[r.id] ?? 0) === 0) return false;
  const t = teacherByFamily[r.id] ?? "";
  if (t.trim()) return false;
  const studs = studentsByFamily[r.id] ?? [];
  return studs.every((s) => !s.teacherName);
}

function fmtBalanceCents(cents: number | null | undefined): string {
  if (cents == null || cents === 0) return "$0";
  const dollars = Math.round(cents / 100);
  return `$${dollars.toLocaleString()}`;
}

function fmtBalance(value: number | null | undefined): string {
  if (value == null || value === 0) return "$0";
  return `$${Math.round(value).toLocaleString()}`;
}

const CSS = `
  @keyframes mc-scanline {
    0% { transform: translateX(-100%); opacity: 0; }
    20% { opacity: 0.9; }
    100% { transform: translateX(100%); opacity: 0; }
  }
  @keyframes mc-pulse-red {
    0%, 100% { box-shadow: 0 0 0 1px rgba(255,59,107,0.55), 0 0 18px rgba(255,59,107,0.25), inset 0 0 14px rgba(255,59,107,0.10); }
    50%      { box-shadow: 0 0 0 1px rgba(255,59,107,0.85), 0 0 28px rgba(255,59,107,0.45), inset 0 0 18px rgba(255,59,107,0.18); }
  }
  @keyframes mc-pulse-amber {
    0%, 100% { box-shadow: 0 0 0 1px rgba(255,170,42,0.45), 0 0 14px rgba(255,170,42,0.18); }
    50%      { box-shadow: 0 0 0 1px rgba(255,170,42,0.70), 0 0 22px rgba(255,170,42,0.32); }
  }
  @keyframes mc-blink-dot {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.35; }
  }
  .mc-row:hover .mc-scan {
    animation: mc-scanline 0.9s ease-out;
  }
  .mc-row:hover {
    background: var(--z-surface-hover, rgba(255,255,255,0.025));
  }
  .mc-row:hover .mc-rail {
    opacity: 1;
  }
  .mc-kpi-alert {
    animation: mc-pulse-red 2.4s ease-in-out infinite;
  }
  .mc-kpi-warn {
    animation: mc-pulse-amber 3s ease-in-out infinite;
  }
  .mc-dot-live {
    animation: mc-blink-dot 1.6s ease-in-out infinite;
  }
  .mc-grid-bg {
    background-image:
      linear-gradient(to right, rgba(196,240,54,0.025) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(196,240,54,0.025) 1px, transparent 1px);
    background-size: 32px 32px;
  }
`;

export function FamiliesMissionControl({
  rows,
  counts,
  locationNameById,
  locationOptions = [],
  studentsByFamily = {},
  teacherByFamily = {},
  kpi,
  insights,
  nowMs,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState<InsightFilter["status"] | null>(null);
  const [askValue, setAskValue] = useState("");

  const locationCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) {
      const id = r.primary_location_id ?? "__none__";
      m[id] = (m[id] ?? 0) + 1;
    }
    return m;
  }, [rows]);

  const locationsForRail = useMemo(() => {
    return locationOptions
      .map((l) => ({ id: l.id, name: l.name, count: locationCounts[l.id] ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [locationOptions, locationCounts]);

  const filtered = useMemo(() => {
    let list = rows;

    if (activeLocationId) {
      list = list.filter((r) => r.primary_location_id === activeLocationId);
    }

    if (activeChip === "overdue") list = list.filter(isRowOverdue);
    if (activeChip === "no-teacher") list = list.filter((r) => hasNoTeacher(r, studentsByFamily, teacherByFamily, counts));
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

    return list;
  }, [rows, activeLocationId, activeChip, search, locationNameById, studentsByFamily, teacherByFamily, counts, nowMs]);

  const applyInsightFilter = useCallback((f: InsightFilter | undefined) => {
    if (!f) return;
    setActiveChip(f.status ?? null);
    setActiveLocationId(f.locationId ?? null);
    if (typeof f.search === "string") setSearch(f.search);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setActiveLocationId(null);
    setActiveChip(null);
  }, []);

  const hasActiveFilters = !!(search || activeLocationId || activeChip);

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
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: "var(--z-fg, #f0f0f0)",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      minHeight: 0,
      background: "var(--z-bg, #030303)",
    }}>
      <style>{CSS}</style>

      <HudStrip
        kpi={kpi}
        rowCount={filtered.length}
        totalCount={rows.length}
        search={search}
        onSearch={setSearch}
        onNewFamily={() => setShowAdd(true)}
        onClearAll={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <div style={{
        display: "grid",
        gridTemplateColumns: "220px minmax(0, 1fr) 320px",
        gap: 0,
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        borderTop: "1px solid var(--z-border, #1c1c1e)",
      }}>
        <LocationRail
          locations={locationsForRail}
          totalCount={rows.length}
          activeLocationId={activeLocationId}
          onSelect={setActiveLocationId}
          activeChip={activeChip}
          onChipChange={setActiveChip}
          kpi={kpi}
        />

        <FamilyTable
          rows={filtered}
          counts={counts}
          locationNameById={locationNameById}
          studentsByFamily={studentsByFamily}
          teacherByFamily={teacherByFamily}
          onOpen={(id) => router.push(`/crm/families/${id}`)}
          onClearAll={clearFilters}
          hasActiveFilters={hasActiveFilters}
          nowMs={nowMs}
        />

        <IntelPanel
          insights={insights}
          onApply={applyInsightFilter}
          ask={askValue}
          onAskChange={setAskValue}
          onAskSubmit={() => {
            const q = askValue.trim();
            if (!q) return;
            setSearch(q);
            setAskValue("");
          }}
        />
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

// ─── HUD top bar ────────────────────────────────────────────────────────────

function HudStrip({
  kpi,
  rowCount,
  totalCount,
  search,
  onSearch,
  onNewFamily,
  onClearAll,
  hasActiveFilters,
}: {
  kpi: FamiliesKpi;
  rowCount: number;
  totalCount: number;
  search: string;
  onSearch: (v: string) => void;
  onNewFamily: () => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}) {
  const showingFiltered = rowCount !== totalCount;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 20,
      padding: "10px 20px",
      background: "var(--z-surface, #080808)",
      borderBottom: "1px solid var(--z-border, #1c1c1e)",
      minHeight: 64,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "var(--z-muted, #505055)" }}>
          CRM
        </span>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--z-fg, #f0f0f0)" }}>
          FAMILIES
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
          fontSize: 11,
          fontWeight: 600,
          color: ACCENT,
          letterSpacing: "0.05em",
          padding: "2px 8px",
          background: "rgba(196,240,54,0.06)",
          borderRadius: 4,
          border: `1px solid rgba(196,240,54,0.18)`,
          whiteSpace: "nowrap",
        }}>
          <span className="mc-dot-live" style={{
            display: "inline-block", width: 6, height: 6, borderRadius: "50%",
            background: ACCENT, marginRight: 6, verticalAlign: "middle",
            boxShadow: `0 0 8px ${ACCENT}`,
          }} />
          {showingFiltered ? `${rowCount} / ${totalCount}` : `${totalCount}`} ACTIVE
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" }}>
        <KpiTile label="TOTAL" value={kpi.total} tone="neutral" />
        <KpiTile label="OVERDUE" value={kpi.overdue} tone={kpi.overdue > 0 ? "urgent" : "neutral"} />
        <KpiTile label="NO TEACHER" value={kpi.noTeacher} tone={kpi.noTeacher > 0 ? "warn" : "neutral"} />
        <KpiTile label="NEW / 30D" value={kpi.newLast30} tone="info" />
        <KpiTile label="ACTIVE" value={`${kpi.activePct}%`} tone="accent" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <input
            type="search"
            placeholder="Search families, students, teachers…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            style={{
              padding: "7px 36px 7px 12px",
              width: 280,
              borderRadius: 6,
              border: "1px solid var(--z-border, #1c1c1e)",
              background: "var(--z-bg, #030303)",
              color: "var(--z-fg, #f0f0f0)",
              fontSize: 12,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <span style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            color: "var(--z-muted, #505055)",
            border: "1px solid var(--z-border, #1c1c1e)",
            borderRadius: 3,
            padding: "1px 5px",
            background: "var(--z-surface, #080808)",
            pointerEvents: "none",
          }}>/</span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            style={{
              padding: "7px 10px",
              borderRadius: 6,
              border: "1px solid var(--z-border, #1c1c1e)",
              background: "transparent",
              color: "var(--z-muted, #909098)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Clear
          </button>
        )}

        <button
          type="button"
          onClick={onNewFamily}
          style={{
            padding: "7px 14px",
            borderRadius: 6,
            border: `1px solid ${ACCENT}`,
            background: "rgba(196,240,54,0.08)",
            color: ACCENT,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.04em",
            fontFamily: "inherit",
            boxShadow: "0 0 12px rgba(196,240,54,0.15)",
          }}
        >
          + ADD FAMILY
        </button>
      </div>
    </div>
  );
}

type KpiTone = "neutral" | "urgent" | "warn" | "info" | "accent";

function KpiTile({ label, value, tone }: { label: string; value: number | string; tone: KpiTone }) {
  const colors: Record<KpiTone, { fg: string; bg: string; border: string }> = {
    neutral: { fg: "var(--z-fg, #f0f0f0)", bg: "var(--z-bg, #030303)", border: "var(--z-border, #1c1c1e)" },
    urgent:  { fg: URGENT, bg: URGENT_DIM,  border: URGENT },
    warn:    { fg: OPP,    bg: OPP_DIM,     border: OPP },
    info:    { fg: INFO,   bg: INFO_DIM,    border: "rgba(34,211,238,0.45)" },
    accent:  { fg: ACCENT, bg: "rgba(196,240,54,0.08)", border: "rgba(196,240,54,0.45)" },
  };
  const c = colors[tone];
  const alertClass = tone === "urgent" && Number(value) > 0 ? "mc-kpi-alert" : tone === "warn" && Number(value) > 0 ? "mc-kpi-warn" : "";
  return (
    <div className={alertClass} style={{
      padding: "6px 14px",
      minWidth: 92,
      borderRadius: 6,
      border: `1px solid ${c.border}`,
      background: c.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 1,
    }}>
      <span style={{
        fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
        fontSize: 18,
        fontWeight: 700,
        color: c.fg,
        lineHeight: 1.1,
        fontVariantNumeric: "tabular-nums",
      }}>{value}</span>
      <span style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: "var(--z-muted, #505055)",
        textTransform: "uppercase",
      }}>{label}</span>
    </div>
  );
}

// ─── Left location rail ─────────────────────────────────────────────────────

function LocationRail({
  locations,
  totalCount,
  activeLocationId,
  onSelect,
  activeChip,
  onChipChange,
  kpi,
}: {
  locations: { id: string; name: string; count: number }[];
  totalCount: number;
  activeLocationId: string | null;
  onSelect: (id: string | null) => void;
  activeChip: InsightFilter["status"] | null;
  onChipChange: (s: InsightFilter["status"] | null) => void;
  kpi: FamiliesKpi;
}) {
  return (
    <aside style={{
      borderRight: "1px solid var(--z-border, #1c1c1e)",
      background: "var(--z-surface, #080808)",
      overflowY: "auto",
      padding: "16px 0",
      display: "flex",
      flexDirection: "column",
      gap: 18,
    }}>
      <RailSection title="Locations">
        <RailRow
          label="All Locations"
          count={totalCount}
          active={activeLocationId === null}
          dotColor={ACCENT}
          onClick={() => onSelect(null)}
        />
        {locations.map((l) => (
          <RailRow
            key={l.id}
            label={shortLoc(l.name)}
            count={l.count}
            active={activeLocationId === l.id}
            dotColor={locDotColor(l.id)}
            onClick={() => onSelect(activeLocationId === l.id ? null : l.id)}
          />
        ))}
      </RailSection>

      <RailSection title="Filters">
        <RailChip
          label="Overdue"
          count={kpi.overdue}
          active={activeChip === "overdue"}
          color={URGENT}
          onClick={() => onChipChange(activeChip === "overdue" ? null : "overdue")}
        />
        <RailChip
          label="No Teacher"
          count={kpi.noTeacher}
          active={activeChip === "no-teacher"}
          color={OPP}
          onClick={() => onChipChange(activeChip === "no-teacher" ? null : "no-teacher")}
        />
        <RailChip
          label="New / 30d"
          count={kpi.newLast30}
          active={activeChip === "new"}
          color={INFO}
          onClick={() => onChipChange(activeChip === "new" ? null : "new")}
        />
        <RailChip
          label="Trial"
          count={null}
          active={activeChip === "trial"}
          color="#9b7cff"
          onClick={() => onChipChange(activeChip === "trial" ? null : "trial")}
        />
      </RailSection>
    </aside>
  );
}

function RailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{
        padding: "0 16px 6px 16px",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.16em",
        color: "var(--z-muted, #505055)",
        textTransform: "uppercase",
      }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

function RailRow({
  label,
  count,
  active,
  dotColor,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  dotColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 16px",
        background: active ? "rgba(196,240,54,0.06)" : "transparent",
        border: "none",
        borderLeft: active ? `2px solid ${ACCENT}` : "2px solid transparent",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        color: active ? "var(--z-fg, #f0f0f0)" : "var(--z-fg-secondary, #909098)",
        fontFamily: "inherit",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.025)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: dotColor,
        boxShadow: active ? `0 0 10px ${dotColor}` : `0 0 4px ${dotColor}88`,
        flexShrink: 0,
      }} />
      <span style={{ flex: 1, fontSize: 12, fontWeight: active ? 600 : 500 }}>
        {label}
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 600,
        color: active ? ACCENT : "var(--z-muted, #505055)",
        fontVariantNumeric: "tabular-nums",
      }}>{count}</span>
    </button>
  );
}

function RailChip({
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
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 16px",
        background: active ? `${color}1c` : "transparent",
        border: "none",
        borderLeft: active ? `2px solid ${color}` : "2px solid transparent",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        fontFamily: "inherit",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.025)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }} />
      <span style={{
        flex: 1,
        fontSize: 11,
        fontWeight: active ? 700 : 500,
        color: active ? color : "var(--z-fg-secondary, #909098)",
        letterSpacing: "0.02em",
      }}>{label}</span>
      {count != null && count > 0 && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          color: active ? color : "var(--z-muted, #505055)",
          fontVariantNumeric: "tabular-nums",
        }}>{count}</span>
      )}
    </button>
  );
}

// ─── Center: dense table ────────────────────────────────────────────────────

const TABLE_GRID = "minmax(0, 1.6fr) 64px minmax(0, 2fr) 92px 84px 88px 96px";

function FamilyTable({
  rows,
  counts,
  locationNameById,
  studentsByFamily,
  teacherByFamily,
  onOpen,
  onClearAll,
  hasActiveFilters,
  nowMs,
}: {
  rows: FamilyRow[];
  counts: Record<string, number>;
  locationNameById: Record<string, string>;
  studentsByFamily: Record<string, StudentEntry[]>;
  teacherByFamily: Record<string, string>;
  onOpen: (id: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  nowMs: number;
}) {
  return (
    <div
      className="mc-grid-bg"
      style={{
        background: "var(--z-bg, #030303)",
        overflowY: "auto",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "var(--z-surface, #080808)",
        borderBottom: "1px solid var(--z-border, #1c1c1e)",
        display: "grid",
        gridTemplateColumns: TABLE_GRID,
        padding: "8px 20px",
        gap: 12,
        alignItems: "center",
      }}>
        {["Family", "Students", "Teacher", "Location", "Balance", "Last Contact", "Status"].map((h) => (
          <span key={h} style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "var(--z-muted, #505055)",
            textTransform: "uppercase",
          }}>{h}</span>
        ))}
      </div>

      {rows.length === 0 ? (
        <div style={{
          padding: "60px 0",
          textAlign: "center",
          color: "var(--z-muted, #909098)",
          fontSize: 13,
        }}>
          <div style={{ marginBottom: 10 }}>No families match the current filters.</div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearAll}
              style={{
                padding: "6px 14px", borderRadius: 6,
                border: `1px solid ${ACCENT}`,
                background: "rgba(196,240,54,0.06)",
                color: ACCENT,
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >Clear filters</button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              row={row}
              studentCount={counts[row.id] ?? 0}
              students={studentsByFamily[row.id] ?? []}
              teacher={teacherByFamily[row.id] ?? ""}
              locationName={locationNameById[row.primary_location_id ?? ""] ?? null}
              onOpen={() => onOpen(row.id)}
              nowMs={nowMs}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TableRow({
  row,
  studentCount,
  students,
  teacher,
  locationName,
  onOpen,
  nowMs,
}: {
  row: FamilyRow;
  studentCount: number;
  students: StudentEntry[];
  teacher: string;
  locationName: string | null;
  onOpen: () => void;
  nowMs: number;
}) {
  const overdue = isRowOverdue(row);
  const isMil = row.is_military === true;
  const isNew = isRowNewLast30(row, nowMs);
  const isTrial = isRowTrial(row);
  const isActive = isRowActive(row);
  const rt = relTime(row.created_at, nowMs);

  const balanceDisplay = row.overdue_balance_cents && row.overdue_balance_cents > 0
    ? { label: fmtBalanceCents(row.overdue_balance_cents), color: URGENT, bold: true }
    : row.balance != null && row.balance > 0
      ? { label: fmtBalance(row.balance), color: "var(--z-fg, #f0f0f0)", bold: false }
      : { label: "$0", color: "var(--z-muted, #505055)", bold: false };

  const instrumentSet = new Set<string>();
  for (const s of students) {
    if (s.instrument) instrumentSet.add(s.instrument.toLowerCase());
  }
  const instruments = Array.from(instrumentSet).slice(0, 4);

  const dotColor = row.primary_location_id ? locDotColor(row.primary_location_id) : "#505055";

  const status = (row.status ?? "").toLowerCase();
  let statusPill: { label: string; color: string } | null = null;
  if (overdue) statusPill = { label: "OVERDUE", color: URGENT };
  else if (isTrial) statusPill = { label: "TRIAL", color: "#9b7cff" };
  else if (isNew) statusPill = { label: "NEW", color: INFO };
  else if (isActive) statusPill = { label: "ACTIVE", color: ACCENT };
  else if (status === "inactive" || status === "paused") statusPill = { label: status.toUpperCase(), color: "#707078" };
  else if (status === "archived") statusPill = { label: "ARCHIVED", color: "#505055" };

  return (
    <div
      className="mc-row"
      onClick={onOpen}
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: TABLE_GRID,
        gap: 12,
        padding: "10px 20px",
        alignItems: "center",
        cursor: "pointer",
        borderBottom: "1px solid var(--z-border, #1c1c1e)",
        background: "transparent",
        transition: "background 0.1s",
      }}
    >
      <div
        className="mc-rail"
        style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: 2,
          background: overdue ? URGENT : isTrial ? "#9b7cff" : ACCENT,
          opacity: overdue ? 1 : 0,
          transition: "opacity 0.1s",
          boxShadow: overdue ? `0 0 8px ${URGENT}` : "none",
        }}
      />
      <div
        className="mc-scan"
        style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: 60,
          background: `linear-gradient(90deg, transparent, ${ACCENT}26, transparent)`,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <FamilyAvatar name={row.name} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: "var(--z-fg, #f0f0f0)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              maxWidth: 200,
            }}>
              {(row.name ?? "").replace(/\s+family$/i, "").trim() || row.name}
            </span>
            {isMil && (
              <span style={{
                fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 3,
                background: "rgba(155,124,255,0.14)", color: "#9b7cff",
                letterSpacing: "0.06em",
              }}>MIL</span>
            )}
          </div>
          {row.primary_email && (
            <div style={{
              fontSize: 10,
              color: "var(--z-fg-tertiary, #505055)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              maxWidth: 220, marginTop: 1,
            }}>
              {row.primary_email}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13, fontWeight: 700,
          color: studentCount > 0 ? "var(--z-fg, #f0f0f0)" : "var(--z-muted, #505055)",
          fontVariantNumeric: "tabular-nums",
          minWidth: 18,
        }}>{studentCount}</span>
        <div style={{ display: "flex", gap: 0, fontSize: 12, opacity: 0.9 }}>
          {instruments.map((i, idx) => (
            <span key={idx} style={{ marginLeft: -2 }}>{instrEmoji(i)}</span>
          ))}
        </div>
      </div>

      <div style={{
        fontSize: 11.5,
        color: teacher ? "var(--z-fg-secondary, #909098)" : "var(--z-fg-tertiary, #505055)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        fontStyle: teacher ? "normal" : "italic",
      }}>
        {teacher || "Unassigned"}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: dotColor,
          boxShadow: `0 0 4px ${dotColor}88`,
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: 11,
          color: "var(--z-fg-secondary, #909098)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{shortLoc(locationName)}</span>
      </div>

      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        fontWeight: balanceDisplay.bold ? 700 : 500,
        color: balanceDisplay.color,
        fontVariantNumeric: "tabular-nums",
        textShadow: balanceDisplay.bold ? `0 0 8px ${URGENT}66` : "none",
      }}>
        {balanceDisplay.label}
      </div>

      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: (rt.days ?? 0) > 60 ? URGENT : "var(--z-fg-secondary, #909098)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {rt.label}
      </div>

      <div>
        {statusPill && (
          <span style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: 3,
            border: `1px solid ${statusPill.color}`,
            color: statusPill.color,
            background: `${statusPill.color}14`,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            boxShadow: statusPill.label === "OVERDUE" ? `0 0 8px ${statusPill.color}55` : "none",
          }}>{statusPill.label}</span>
        )}
      </div>
    </div>
  );
}

function FamilyAvatar({ name }: { name: string }) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const palette: [string, string][] = [
    ["#c4f036", "rgba(196,240,54,0.14)"],
    ["#22d3ee", "rgba(34,211,238,0.14)"],
    ["#ff66cc", "rgba(255,102,204,0.14)"],
    ["#ffaa2a", "rgba(255,170,42,0.14)"],
    ["#9b7cff", "rgba(155,124,255,0.14)"],
    ["#00e5cc", "rgba(0,229,204,0.14)"],
  ];
  const [fg, bg] = palette[h % palette.length] ?? ["#c4f036", "rgba(196,240,54,0.14)"];
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 6,
      background: bg,
      border: `1px solid ${fg}66`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      fontWeight: 800,
      color: fg,
      letterSpacing: "0.02em",
    }}>{initials(name)}</div>
  );
}

// ─── Right: INTEL panel ────────────────────────────────────────────────────

function IntelPanel({
  insights,
  onApply,
  ask,
  onAskChange,
  onAskSubmit,
}: {
  insights: Insight[];
  onApply: (f: InsightFilter | undefined) => void;
  ask: string;
  onAskChange: (v: string) => void;
  onAskSubmit: () => void;
}) {
  return (
    <aside style={{
      borderLeft: "1px solid var(--z-border, #1c1c1e)",
      background: "var(--z-surface, #080808)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 16px 10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderBottom: "1px solid var(--z-border, #1c1c1e)",
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.18em",
          color: ACCENT,
        }}>
          ◆ INTEL
        </span>
        <span style={{
          fontSize: 10,
          color: "var(--z-muted, #505055)",
          fontFamily: "'JetBrains Mono', monospace",
        }}>{insights.length} ACTIVE</span>
      </div>

      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "12px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        {insights.length === 0 ? (
          <div style={{
            padding: "30px 12px",
            textAlign: "center",
            color: "var(--z-muted, #505055)",
            fontSize: 11,
          }}>
            No insights right now. All systems steady.
          </div>
        ) : (
          insights.map((ins) => (
            <InsightCard key={ins.id} insight={ins} onApply={() => onApply(ins.filter)} />
          ))
        )}
      </div>

      <div style={{
        borderTop: "1px solid var(--z-border, #1c1c1e)",
        padding: 10,
        background: "var(--z-bg, #030303)",
      }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={ask}
            onChange={(e) => onAskChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onAskSubmit(); }}
            placeholder="Ask anything about your roster…"
            style={{
              width: "100%",
              padding: "9px 36px 9px 30px",
              borderRadius: 6,
              border: `1px solid ${ACCENT}33`,
              background: "rgba(196,240,54,0.04)",
              color: "var(--z-fg, #f0f0f0)",
              fontSize: 11.5,
              outline: "none",
              fontFamily: "inherit",
              boxShadow: "0 0 10px rgba(196,240,54,0.05) inset",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = ACCENT; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(196,240,54,0.33)"; }}
          />
          <span style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: ACCENT,
            fontSize: 12,
            pointerEvents: "none",
          }}>◆</span>
          {ask.trim() && (
            <button
              type="button"
              onClick={onAskSubmit}
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                padding: "3px 8px",
                borderRadius: 3,
                border: "none",
                background: ACCENT,
                color: "#0d1400",
                fontSize: 10,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.06em",
              }}
            >
              ASK
            </button>
          )}
        </div>
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
        padding: "10px 12px 10px 16px",
        borderRadius: 6,
        background: sevBg,
        border: `1px solid ${sevColor}33`,
        cursor: "pointer",
        overflow: "hidden",
        transition: "border-color 0.12s, background 0.12s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${sevColor}88`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${sevColor}33`; }}
    >
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: sevColor,
        boxShadow: `0 0 6px ${sevColor}`,
      }} />
      <div style={{
        fontSize: 11.5,
        fontWeight: 700,
        color: sevColor,
        lineHeight: 1.3,
        marginBottom: 3,
      }}>{insight.title}</div>
      <div style={{
        fontSize: 10.5,
        color: "var(--z-fg-secondary, #909098)",
        lineHeight: 1.4,
        marginBottom: 6,
      }}>{insight.body}</div>
      {insight.filter && (
        <div style={{
          fontSize: 9.5,
          fontWeight: 700,
          color: sevColor,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
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
  if (s === "urgent") return URGENT_DIM;
  if (s === "opportunity") return OPP_DIM;
  return INFO_DIM;
}
