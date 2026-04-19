"use client";
import * as React from "react";
import type { Family, ScheduleBlock, Student, Teacher } from "@/lib/types/entities";
import type { TeacherAvailabilityRow, WindowedScheduleData } from "@/lib/schedule/windowedData";
import type { ScheduleRoom } from "@/lib/schedule/types";
import type { ScheduleWindow } from "@/lib/schedule/window";
import {
  weekWindowContaining,
  shiftWindowByOneWeek,
  eachDayInclusive,
} from "@/lib/schedule/window";
import type { LocationHoursMap } from "@/lib/schedule/locationHoursUtils";
import { LocationScheduleGrid } from "./LocationScheduleGrid";
import { MobileScheduleView } from "./MobileScheduleView";
import { SubModal, CallOutModal, GoVirtualModal } from "./ScheduleToolbarModals";

// ─── Location config ──────────────────────────────────────────────────────────
export const LOCATION_CONFIG: Record<string, {
  name: string;
  color: string;
  accent: string;
  border: string;
  bg: string;
  textColor: string;
}> = {
  "f7b52dd5-12ee-437f-9c60-f8adf454ac31": {
    name: "Bellevue",
    color: "#7C3AED",
    accent: "rgba(124,58,237,0.12)",
    border: "rgba(124,58,237,0.35)",
    bg: "rgba(124,58,237,0.06)",
    textColor: "#c4b5fd",
  },
  "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": {
    name: "Gretna",
    color: "#16A34A",
    accent: "rgba(22,163,74,0.12)",
    border: "rgba(22,163,74,0.35)",
    bg: "rgba(22,163,74,0.06)",
    textColor: "#86efac",
  },
  "cebd97d4-c241-4de2-8ade-49e5cc0070d5": {
    name: "Elkhorn",
    color: "#0EA5E9",
    accent: "rgba(14,165,233,0.12)",
    border: "rgba(14,165,233,0.35)",
    bg: "rgba(14,165,233,0.06)",
    textColor: "#7dd3fc",
  },
  "d48229c1-b70a-4d29-893e-5079887dab76": {
    name: "Omaha",
    color: "#DC2626",
    accent: "rgba(220,38,38,0.12)",
    border: "rgba(220,38,38,0.35)",
    bg: "rgba(220,38,38,0.06)",
    textColor: "#fca5a5",
  },
};

export type LocationData = WindowedScheduleData & {
  locationId: string;
  locationName: string;
};

type Props = {
  locations: Array<{ id: string; name: string }>;
  locationDataMap: Record<string, WindowedScheduleData>;
  initialWindow: ScheduleWindow;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatWeekLabel(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  const sm = MONTH_NAMES[s.getUTCMonth()];
  const em = MONTH_NAMES[e.getUTCMonth()];
  if (sm === em) {
    return `${sm} ${s.getUTCDate()} – ${e.getUTCDate()}, ${e.getUTCFullYear()}`;
  }
  return `${sm} ${s.getUTCDate()} – ${em} ${e.getUTCDate()}, ${e.getUTCFullYear()}`;
}

function formatDayTab(isoDate: string, locationHours: LocationHoursMap): {
  label: string;
  sub: string;
  isClosed: boolean;
} {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const dow = d.getUTCDay();
  const hours = locationHours[dow];
  const isClosed = hours?.isClosed ?? false;
  const dayLabel = DAY_LABELS[dow];
  const dateNum = d.getUTCDate();
  return { label: dayLabel, sub: String(dateNum), isClosed };
}

type ToolModal = "sub" | "callout" | "virtual" | null;

export function MultiLocationScheduleClient({ locations, locationDataMap, initialWindow }: Props) {
  const [window, setWindow] = React.useState<ScheduleWindow>(initialWindow);
  const [activeLocationId, setActiveLocationId] = React.useState<string>(locations[0]?.id ?? "");
  const [selectedDates, setSelectedDates] = React.useState<Record<string, string>>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekDays = eachDayInclusive(initialWindow.start, initialWindow.end);
    const defaultDay = weekDays.includes(today) ? today : weekDays[0] ?? today;
    return Object.fromEntries(locations.map((l) => [l.id, defaultDay]));
  });
  const [blocksByLocationWindow, setBlocksByLocationWindow] = React.useState<
    Record<string, Record<string, ScheduleBlock[]>>
  >(() => {
    const out: Record<string, Record<string, ScheduleBlock[]>> = {};
    for (const [locId, data] of Object.entries(locationDataMap)) {
      out[locId] = { [`${initialWindow.start}_${initialWindow.end}`]: data.blocks };
    }
    return out;
  });
  const [loading, setLoading] = React.useState(false);
  const [activeModal, setActiveModal] = React.useState<ToolModal>(null);

  const weekDays = React.useMemo(
    () => eachDayInclusive(window.start, window.end),
    [window.start, window.end],
  );

  const goWeek = React.useCallback((direction: 1 | -1) => {
    setWindow((prev) => shiftWindowByOneWeek(prev.start, direction));
  }, []);

  const jumpToWeek = React.useCallback((isoDate: string) => {
    setWindow(weekWindowContaining(isoDate));
  }, []);

  // Fetch new week data for all locations when window changes
  React.useEffect(() => {
    const windowKey = `${window.start}_${window.end}`;
    const needsFetch = locations.some((loc) => !blocksByLocationWindow[loc.id]?.[windowKey]);
    if (!needsFetch) return;

    setLoading(true);
    Promise.all(
      locations.map(async (loc) => {
        if (blocksByLocationWindow[loc.id]?.[windowKey]) return null;
        const url = `/api/schedule-blocks?locationId=${encodeURIComponent(loc.id)}&start=${window.start}&end=${window.end}`;
        const res = await fetch(url).catch(() => null);
        if (!res?.ok) return null;
        const json = await res.json().catch(() => null);
        return { locId: loc.id, blocks: (json?.blocks ?? json ?? []) as ScheduleBlock[] };
      }),
    ).then((results) => {
      setBlocksByLocationWindow((prev) => {
        const next = { ...prev };
        for (const result of results) {
          if (!result) continue;
          next[result.locId] = { ...(next[result.locId] ?? {}), [windowKey]: result.blocks };
        }
        return next;
      });
      setLoading(false);
    });
  }, [window.start, window.end, locations, blocksByLocationWindow]);

  const activeLocConfig = LOCATION_CONFIG[activeLocationId];
  const windowKey = `${window.start}_${window.end}`;
  const activeData = locationDataMap[activeLocationId];
  const activeBlocks = blocksByLocationWindow[activeLocationId]?.[windowKey] ?? activeData?.blocks ?? [];
  const activeSelectedDate = selectedDates[activeLocationId] ?? window.start;

  // Utilization for active location on selected date
  const utilization = React.useMemo(() => {
    const dayBlocks = activeBlocks.filter((b) => b.block_date === activeSelectedDate);
    const total = dayBlocks.length;
    const booked = dayBlocks.filter((b) => b.student_id && b.block_type !== "open_time").length;
    const open = dayBlocks.filter((b) => !b.student_id || b.block_type === "open_time").length;
    const pct = total > 0 ? Math.round((booked / total) * 100) : 0;
    return { total, booked, open, pct };
  }, [activeBlocks, activeSelectedDate]);

  return (
    <div className="space-y-0">
      {/* ── Top bar: location tabs + week nav ── */}
      <div className="sticky top-0 z-30 border-b border-[var(--z-border)] bg-[var(--z-bg)]/95 backdrop-blur-sm">
        {/* Row 1: location tabs + week nav */}
        <div className="flex items-center gap-1 px-4 pt-3">
          {locations.map((loc) => {
            const cfg = LOCATION_CONFIG[loc.id];
            const isActive = loc.id === activeLocationId;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => setActiveLocationId(loc.id)}
                style={isActive ? {
                  borderColor: cfg?.border ?? "transparent",
                  backgroundColor: cfg?.accent ?? "transparent",
                  color: cfg?.textColor ?? "inherit",
                } : {}}
                className={`rounded-t-lg border-x border-t px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "border-b-[var(--z-bg)]"
                    : "border-transparent text-[var(--z-muted)] hover:text-[var(--z-fg)]"
                }`}
              >
                {loc.name}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => goWeek(-1)}
              className="rounded-md border border-[var(--z-border)] px-2.5 py-1 text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]"
            >
              ← Prev
            </button>
            <span className="text-xs font-semibold text-[var(--z-fg)]">
              {formatWeekLabel(window.start, window.end)}
            </span>
            <button
              type="button"
              onClick={() => goWeek(1)}
              className="rounded-md border border-[var(--z-border)] px-2.5 py-1 text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]"
            >
              Next →
            </button>
            <input
              type="date"
              value={window.start}
              onChange={(e) => e.target.value && jumpToWeek(e.target.value)}
              className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-xs text-[var(--z-fg)]"
              title="Jump to week"
            />
          </div>
        </div>

        {/* Row 2: day tabs + toolbar actions */}
        {activeLocationId && activeData && (
          <div
            className="flex items-center gap-1 overflow-x-auto px-4 pb-2 pt-1"
            style={{ borderTop: `1px solid ${activeLocConfig?.border ?? "var(--z-border)"}` }}
          >
            {weekDays.map((day) => {
              const hours = activeData.locationHours ?? {};
              const { label, sub, isClosed } = formatDayTab(day, hours);
              const isSelected = selectedDates[activeLocationId] === day;
              const isToday = day === new Date().toISOString().slice(0, 10);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isClosed}
                  onClick={() => setSelectedDates((prev) => ({ ...prev, [activeLocationId]: day }))}
                  style={isSelected && !isClosed ? {
                    borderColor: activeLocConfig?.border ?? "var(--z-border)",
                    backgroundColor: activeLocConfig?.accent ?? "transparent",
                    color: activeLocConfig?.textColor ?? "inherit",
                  } : {}}
                  className={`flex min-w-[52px] flex-col items-center rounded-lg border px-2 py-1.5 text-center transition-all ${
                    isClosed
                      ? "cursor-not-allowed border-transparent opacity-30"
                      : isSelected
                      ? "border"
                      : "border-transparent text-[var(--z-muted)] hover:border-[var(--z-border)] hover:text-[var(--z-fg)]"
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
                  <span className={`text-base font-bold ${isToday ? "text-yellow-400" : ""}`}>{sub}</span>
                  {isClosed && <span className="text-[9px] text-[var(--z-muted)]">Closed</span>}
                </button>
              );
            })}
            {loading && (
              <span className="ml-2 text-xs text-[var(--z-muted)] animate-pulse">Loading…</span>
            )}

            {/* ── Toolbar action buttons ── */}
            <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-2">
              {/* Utilization badge */}
              <div className="flex items-center gap-1.5 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2.5 py-1.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: utilization.pct >= 80 ? "#22c55e" : utilization.pct >= 50 ? "#eab308" : "#ef4444",
                  }}
                />
                <span className="text-[11px] font-bold text-[var(--z-fg)]">{utilization.pct}%</span>
                <span className="hidden text-[10px] text-[var(--z-muted)] sm:inline">
                  {utilization.booked}/{utilization.total} · {utilization.open} open
                </span>
              </div>

              {/* + Sub */}
              <button
                type="button"
                onClick={() => setActiveModal("sub")}
                className="flex items-center gap-1.5 rounded-lg border border-[#00ff88]/30 bg-[#00ff88]/10 px-2.5 py-1.5 text-[11px] font-bold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors"
              >
                <svg viewBox="0 0 14 14" fill="none" className="h-3 w-3" aria-hidden>
                  <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Sub
              </button>

              {/* Call Out */}
              <button
                type="button"
                onClick={() => setActiveModal("callout")}
                className="flex items-center gap-1.5 rounded-lg border border-orange-400/30 bg-orange-500/10 px-2.5 py-1.5 text-[11px] font-bold text-orange-300 hover:bg-orange-500/20 transition-colors"
              >
                <svg viewBox="0 0 14 14" fill="none" className="h-3 w-3" aria-hidden>
                  <path d="M7 2v5M7 9v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                Call Out
              </button>

              {/* Go Virtual */}
              <button
                type="button"
                onClick={() => setActiveModal("virtual")}
                className="flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-sky-500/20 transition-colors"
              >
                <svg viewBox="0 0 14 14" fill="none" className="h-3 w-3" aria-hidden>
                  <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M9 7l-4-2v4l4-2z" fill="currentColor"/>
                </svg>
                Virtual
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--z-border)] px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Legend</span>
        {[
          { color: "#EAB308", label: "Booked" },
          { color: "#3B82F6", label: "First Day" },
          { color: "#EF4444", label: "Last Day" },
          { color: "#F97316", label: "Call Out" },
          { color: "#EC4899", label: "Makeup" },
          { color: "#14B8A6", label: "Meet & Greet" },
          { color: "#22C55E", label: "Sub" },
          { color: "#8B5CF6", label: "Training" },
          { color: "#6B7280", label: "Locked" },
          { color: "#10B981", label: "Open" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-[11px] text-[var(--z-muted)]">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* ── Active location grid ── */}
      {locations.map((loc) => {
        if (loc.id !== activeLocationId) return null;
        const data = locationDataMap[loc.id];
        if (!data) return null;
        const currentBlocks = blocksByLocationWindow[loc.id]?.[windowKey] ?? data.blocks;
        const selectedDate = selectedDates[loc.id] ?? window.start;
        const cfg = LOCATION_CONFIG[loc.id];
        const handleBlocksChange = (newBlocks: ScheduleBlock[]) => {
          setBlocksByLocationWindow((prev) => ({
            ...prev,
            [loc.id]: { ...(prev[loc.id] ?? {}), [windowKey]: newBlocks },
          }));
        };
        return (
          <React.Fragment key={loc.id}>
            {/* Desktop grid */}
            <div className="hidden sm:block">
              <LocationScheduleGrid
                locationId={loc.id}
                locationName={loc.name}
                locationConfig={cfg}
                selectedDate={selectedDate}
                blocks={currentBlocks}
                teachers={data.teachers}
                students={data.students}
                families={data.families}
                availability={data.availability}
                rooms={data.rooms}
                locationHours={data.locationHours}
                onBlocksChange={handleBlocksChange}
              />
            </div>
            {/* Mobile horizontal timeline */}
            <div className="block sm:hidden">
              <MobileScheduleView
                locationId={loc.id}
                locationConfig={cfg}
                selectedDate={selectedDate}
                blocks={currentBlocks}
                teachers={data.teachers}
                students={data.students}
                families={data.families}
                locationHours={data.locationHours}
                onBlocksChange={handleBlocksChange}
              />
            </div>
          </React.Fragment>
        );
      })}

      {/* ── Toolbar Modals ── */}
      {activeModal === "sub" && activeData && (
        <SubModal
          locationId={activeLocationId}
          selectedDate={activeSelectedDate}
          teachers={activeData.teachers}
          blocks={activeBlocks}
          onClose={() => setActiveModal(null)}
          onBlocksChange={(newBlocks) => {
            setBlocksByLocationWindow((prev) => ({
              ...prev,
              [activeLocationId]: { ...(prev[activeLocationId] ?? {}), [windowKey]: newBlocks },
            }));
          }}
        />
      )}
      {activeModal === "callout" && activeData && (
        <CallOutModal
          locationId={activeLocationId}
          selectedDate={activeSelectedDate}
          teachers={activeData.teachers}
          students={activeData.students}
          blocks={activeBlocks}
          onClose={() => setActiveModal(null)}
          onBlocksChange={(newBlocks) => {
            setBlocksByLocationWindow((prev) => ({
              ...prev,
              [activeLocationId]: { ...(prev[activeLocationId] ?? {}), [windowKey]: newBlocks },
            }));
          }}
        />
      )}
      {activeModal === "virtual" && activeData && (
        <GoVirtualModal
          locationId={activeLocationId}
          selectedDate={activeSelectedDate}
          teachers={activeData.teachers}
          students={activeData.students}
          blocks={activeBlocks}
          onClose={() => setActiveModal(null)}
          onBlocksChange={(newBlocks) => {
            setBlocksByLocationWindow((prev) => ({
              ...prev,
              [activeLocationId]: { ...(prev[activeLocationId] ?? {}), [windowKey]: newBlocks },
            }));
          }}
        />
      )}
    </div>
  );
}
