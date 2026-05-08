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
import { ScheduleRoomsPanel } from "./ScheduleRoomsPanel";
import { useOperatorSession } from "../hooks/useOperatorSession";

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
  // Single shared date — persists across location tab switches
  const [selectedDate, setSelectedDate] = React.useState<string>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekDays = eachDayInclusive(initialWindow.start, initialWindow.end);
    return weekDays.includes(today) ? today : weekDays[0] ?? today;
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
  const [activeView, setActiveView] = React.useState<"schedule" | "rooms">("schedule");
  const [focusedBlockId, setFocusedBlockId] = React.useState<string | null>(null);

  // Sync state to Supabase
  useOperatorSession({
    activeLocationId,
    activeDate: selectedDate ?? null,
    activeView,
    activeModal: activeModal ?? "none",
    focusedBlockId,
  });


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
        const url = `/api/schedule-blocks?locationId=${encodeURIComponent(loc.id)}&date_from=${window.start}&date_to=${window.end}`;
        const res = await fetch(url).catch(() => null);
        if (!res?.ok) return null;
        const json = await res.json().catch(() => null);
        const rawBlocks = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        return { locId: loc.id, blocks: rawBlocks as ScheduleBlock[] };
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
  // activeSelectedDate is now just selectedDate — shared across all locations

  // Utilization for active location on selected date
  const utilization = React.useMemo(() => {
    const dayBlocks = activeBlocks.filter(
      (b) => b.block_date === selectedDate && b.block_type !== "not_bookable",
    );
    const booked = dayBlocks.filter(
      (b) => b.student_id && b.block_type !== "open_time",
    ).length;
    const open = dayBlocks.filter(
      (b) => b.block_type === "open_time" && !b.student_id,
    ).length;
    const countable = booked + open;
    const pct = countable > 0 ? Math.round((booked / countable) * 100) : 0;
    return { total: countable, booked, open, pct };
  }, [activeBlocks, selectedDate]);

  const handleBlocksChange = (newBlocks: ScheduleBlock[]) => {
    setBlocksByLocationWindow((prev) => ({
      ...prev,
      [activeLocationId]: {
        ...(prev[activeLocationId] ?? {}),
        [windowKey]: newBlocks,
      },
    }));
  };

  return (
    <div className="space-y-0">
      {/* ─── Unified compact header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-[var(--z-border)] bg-[var(--z-bg)]/95 backdrop-blur-sm">

        {/* ══════════ MOBILE HEADER (hidden sm+) ══════════════════════════════ */}
        <div className="flex sm:hidden flex-col">
          {/* Mobile Row 1: hamburger | location | ◀ date ▶ | 📅 | +Sub */}
          <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ height: 44 }}>
            {/* Hamburger — triggers global sidebar via data attribute */}
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => {
                // Dispatch a custom event that CleanLayout listens to
                window.dispatchEvent(new CustomEvent("zw:toggle-nav"));
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-fg)] active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Location dropdown */}
            <div className="relative flex-1 min-w-0">
              <select
                value={activeLocationId}
                onChange={(e) => { setActiveLocationId(e.target.value); setActiveView("schedule"); }}
                className="w-full appearance-none rounded-lg border px-2.5 py-1 pr-6 text-[11px] font-bold bg-[var(--z-surface-2)] focus:outline-none cursor-pointer truncate"
                style={{
                  borderColor: LOCATION_CONFIG[activeLocationId]?.border ?? "var(--z-border)",
                  color: LOCATION_CONFIG[activeLocationId]?.textColor ?? "var(--z-fg)",
                }}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} style={{ background: "#0a0a0c", color: "#e0e0e6" }}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px]"
                style={{ color: LOCATION_CONFIG[activeLocationId]?.textColor ?? "var(--z-muted)" }}>▾</span>
            </div>

            {/* Date nav: ◀ selected date ▶ */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button type="button"
                onClick={() => {
                  const d = new Date(`${selectedDate}T00:00:00Z`);
                  d.setUTCDate(d.getUTCDate() - 1);
                  const prev = d.toISOString().slice(0, 10);
                  if (!weekDays.includes(prev)) goWeek(-1);
                  setSelectedDate(prev);
                }}
                className="flex h-7 w-6 items-center justify-center rounded border border-[var(--z-border)] text-[var(--z-muted)] active:scale-95 text-sm font-bold"
              >‹</button>
              <div className="flex flex-col items-center px-1 min-w-[40px]">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--z-muted)] leading-none">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(`${selectedDate}T00:00:00Z`).getUTCDay()]}
                </span>
                <span className="text-[13px] font-black text-[var(--z-fg)] leading-none">
                  {new Date(`${selectedDate}T00:00:00Z`).getUTCDate()}
                </span>
              </div>
              <button type="button"
                onClick={() => {
                  const d = new Date(`${selectedDate}T00:00:00Z`);
                  d.setUTCDate(d.getUTCDate() + 1);
                  const next = d.toISOString().slice(0, 10);
                  if (!weekDays.includes(next)) goWeek(1);
                  setSelectedDate(next);
                }}
                className="flex h-7 w-6 items-center justify-center rounded border border-[var(--z-border)] text-[var(--z-muted)] active:scale-95 text-sm font-bold"
              >›</button>
            </div>

            {/* Calendar jump */}
            <label className="relative shrink-0 cursor-pointer">
              <span className="pointer-events-none flex h-7 w-7 items-center justify-center rounded border border-[var(--z-border)] text-[var(--z-muted)] text-sm">📅</span>
              <input type="date" value={selectedDate}
                onChange={(e) => { if (e.target.value) { jumpToWeek(e.target.value); setSelectedDate(e.target.value); } }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            </label>

            {/* +Sub button */}
            {activeView === "schedule" && (
              <button type="button" onClick={() => setActiveModal("sub")}
                className="shrink-0 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[10px] font-black text-[#c4f036] active:scale-95 whitespace-nowrap"
                style={{ borderColor: "rgba(196,240,54,0.3)" }}>
                +Sub
              </button>
            )}
          </div>

          {/* Mobile Row 2: Schedule | Rooms toggle + util pill */}
          <div className="flex items-center gap-1.5 px-2 pb-1.5" style={{ borderTop: "1px solid var(--z-border)" }}>
            {/* Schedule / Rooms pill toggle */}
            <div className="flex items-center gap-0.5 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] p-0.5">
              <button type="button" onClick={() => setActiveView("schedule")}
                className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                  activeView === "schedule" ? "bg-[#c4f036]/15 text-[#c4f036]" : "text-[var(--z-muted)]"
                }`}>
                Schedule
              </button>
              <button type="button" onClick={() => setActiveView("rooms")}
                className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                  activeView === "rooms" ? "bg-[#c4f036]/15 text-[#c4f036]" : "text-[var(--z-muted)]"
                }`}>
                Rooms
              </button>
            </div>

            {/* Util pill */}
            {activeView === "schedule" && (
              <div className="flex items-center gap-1.5 ml-auto shrink-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--z-muted)]">Util</span>
                <span className={`text-[10px] font-black ${utilization.pct > 85 ? "text-orange-400" : "text-[#c4f036]"}`}>
                  {utilization.pct}%
                </span>
                <span className="text-[9px] text-[var(--z-muted)]">·</span>
                <span className="text-[9px] font-bold text-[var(--z-fg)]">{utilization.booked} booked</span>
              </div>
            )}

            {/* Call Out + Virtual — icon-only on mobile */}
            {activeView === "schedule" && (
              <div className="flex items-center gap-1 ml-1">
                <button type="button" onClick={() => setActiveModal("callout")}
                  className="flex h-6 w-6 items-center justify-center rounded border border-[var(--z-border)] bg-[var(--z-surface-2)] text-[10px] active:scale-95"
                  title="Call Out">📵</button>
                <button type="button" onClick={() => setActiveModal("virtual")}
                  className="flex h-6 w-6 items-center justify-center rounded border border-[var(--z-border)] bg-[var(--z-surface-2)] text-[10px] active:scale-95"
                  title="Go Virtual">💻</button>
              </div>
            )}
          </div>
        </div>

        {/* ══════════ DESKTOP HEADER (hidden on mobile) ════════════════════════ */}
        <div className="hidden sm:block">
          {/* Row 1: location selector | view toggle | toolbar actions */}
          <div className="flex items-center gap-1 overflow-x-auto px-3 py-1.5 scrollbar-none">
            {/* Desktop: location pills */}
            {locations.map((loc) => {
              const cfg = LOCATION_CONFIG[loc.id];
              const isActive = loc.id === activeLocationId;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    setActiveLocationId(loc.id);
                    setActiveView("schedule");
                  }}
                  style={isActive ? {
                    borderColor: cfg?.border ?? "transparent",
                    backgroundColor: cfg?.accent ?? "transparent",
                    color: cfg?.textColor ?? "inherit",
                  } : {}}
                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "border"
                      : "border-transparent text-[var(--z-muted)] hover:border-[var(--z-border)] hover:text-[var(--z-fg)]"
                  }`}
                >
                  {loc.name}
                </button>
              );
            })}
            <div className="mx-1 h-5 w-[1px] bg-[var(--z-border)] opacity-60 shrink-0" />
            {/* Schedule / Rooms toggle */}
            <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] p-0.5">
              <button type="button" onClick={() => setActiveView("schedule")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  activeView === "schedule" ? "bg-[#c4f036]/15 text-[#c4f036]" : "text-[var(--z-muted)] hover:text-[var(--z-fg)]"
                }`}>Schedule</button>
              <button type="button" onClick={() => setActiveView("rooms")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  activeView === "rooms" ? "bg-[#c4f036]/15 text-[#c4f036]" : "text-[var(--z-muted)] hover:text-[var(--z-fg)]"
                }`}>Rooms</button>
            </div>
            <div className="flex-1" />
            {/* Toolbar actions */}
            {activeView === "schedule" && (
              <div className="flex shrink-0 items-center gap-1.5">
                <button type="button" onClick={() => setActiveModal("sub")}
                  className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-[11px] font-bold text-[var(--z-fg)] hover:border-[var(--z-accent)]/50 hover:bg-[var(--z-accent)]/5 transition-all">
                  + Sub
                </button>
                <button type="button" onClick={() => setActiveModal("callout")}
                  className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-[11px] font-bold text-[var(--z-fg)] hover:border-red-500/50 hover:bg-red-500/5 transition-all">
                  Call Out
                </button>
                <button type="button" onClick={() => setActiveModal("virtual")}
                  className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-[11px] font-bold text-[var(--z-fg)] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
                  Virtual
                </button>
              </div>
            )}
          </div>
          {/* Row 2: week nav inline + day pills + utilization */}
          {activeView === "schedule" && activeLocationId && activeData && (
            <div
              className="flex items-center gap-1 overflow-x-auto px-3 pb-1.5 pt-0.5 scrollbar-none"
              style={{ borderTop: `1px solid ${activeLocConfig?.border ?? "var(--z-border)"}40` }}
            >
              <button type="button" onClick={() => goWeek(-1)}
                className="shrink-0 rounded-md border border-[var(--z-border)] px-2 py-1 text-xs font-bold text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors"
                aria-label="Previous week">&#8249;</button>
              <span className="shrink-0 text-[11px] font-semibold text-[var(--z-fg)] px-1 whitespace-nowrap">
                {formatWeekLabel(window.start, window.end)}
              </span>
              <button type="button" onClick={() => goWeek(1)}
                className="shrink-0 rounded-md border border-[var(--z-border)] px-2 py-1 text-xs font-bold text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors"
                aria-label="Next week">&#8250;</button>
              <label className="relative shrink-0 cursor-pointer" title="Jump to date">
                <span className="pointer-events-none flex h-7 w-7 items-center justify-center rounded-md border border-[var(--z-border)] text-sm select-none text-[var(--z-muted)]">&#128197;</span>
                <input type="date" value={window.start}
                  onChange={(e) => e.target.value && jumpToWeek(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0" title="Jump to week" />
              </label>
              <div className="mx-1.5 h-6 w-[1px] bg-[var(--z-border)] opacity-50 shrink-0" />
              {weekDays.map((day) => {
                const hours = activeData.locationHours ?? {};
                const { label, sub, isClosed } = formatDayTab(day, hours);
                const isSelected = selectedDate === day;
                const isToday = day === new Date().toISOString().slice(0, 10);
                return (
                  <button key={day} type="button" disabled={isClosed} onClick={() => setSelectedDate(day)}
                    className={`flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 transition-all ${
                      isSelected ? "bg-[var(--z-accent)] text-black"
                        : isClosed ? "opacity-20 cursor-not-allowed"
                        : isToday ? "bg-[var(--z-surface-2)] text-[var(--z-accent)] border border-[var(--z-accent)]/30"
                        : "text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)]"
                    }`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
                    <span className="text-sm font-black leading-none">{sub}</span>
                  </button>
                );
              })}
              <div className="mx-2 h-8 w-[1px] bg-[var(--z-border)] opacity-50 shrink-0" />
              <div className="flex shrink-0 flex-col justify-center px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--z-muted)]">Util</span>
                  <span className={`text-[10px] font-black ${utilization.pct > 85 ? "text-orange-400" : "text-[#c4f036]"}`}>
                    {utilization.pct}%
                  </span>
                </div>
                <div className="text-[11px] font-bold text-[var(--z-fg)]">
                  {utilization.booked} <span className="text-[var(--z-muted)] font-medium">booked</span>{" "}
                  <span className="text-[var(--z-muted)]">&middot;</span>{" "}
                  {utilization.open} <span className="text-[var(--z-muted)] font-medium">open</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
      {/* Main content area */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--z-bg)]/40 backdrop-blur-[1px]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--z-accent)] border-t-transparent" />
          </div>
        )}
        {activeView === "schedule" ? (
          <>
            {/* ── Desktop grid (hidden on mobile) ── */}
            <div className="hidden sm:block">
              <LocationScheduleGrid
                locationId={activeLocationId}
                locationName={activeLocConfig?.name ?? "Studio"}
                selectedDate={selectedDate}
                blocks={activeBlocks.filter((b) => b.block_date === selectedDate)}
                teachers={activeData?.teachers ?? []}
                students={activeData?.students ?? []}
                families={activeData?.families ?? []}
                availability={activeData?.availability ?? []}
                rooms={activeData?.rooms ?? []}
                locationHours={activeData?.locationHours ?? {}}
                onBlocksChange={handleBlocksChange}
              />
            </div>
            {/* ── Mobile view (hidden on sm+) — same data source, optimized layout ── */}
            <div className="block sm:hidden">
              <MobileScheduleView
                locationId={activeLocationId}
                locationConfig={activeLocConfig}
                selectedDate={selectedDate}
                blocks={activeBlocks.filter((b) => b.block_date === selectedDate)}
                teachers={activeData?.teachers ?? []}
                students={activeData?.students ?? []}
                families={activeData?.families ?? []}
                rooms={activeData?.rooms ?? []}
                locationHours={activeData?.locationHours ?? {}}
                onBlocksChange={handleBlocksChange}
              />
            </div>
          </>
        ) : (
          <ScheduleRoomsPanel
            locationId={activeLocationId}
            locationName={activeLocConfig?.name ?? "Studio"}
            locationColor={activeLocConfig?.color ?? "#7C3AED"}
            rooms={activeData?.rooms ?? []}
          />
        )}
      </div>
      {/* Modals */}
      {activeModal === "sub" && (
        <SubModal
          locationId={activeLocationId}
          selectedDate={selectedDate}
          teachers={activeData?.teachers ?? []}
          blocks={activeBlocks}
          onClose={() => setActiveModal(null)}
          onBlocksChange={handleBlocksChange}
        />
      )}
      {activeModal === "callout" && (
        <CallOutModal
          locationId={activeLocationId}
          selectedDate={selectedDate}
          teachers={activeData?.teachers ?? []}
          students={activeData?.students ?? []}
          blocks={activeBlocks}
          onClose={() => setActiveModal(null)}
          onBlocksChange={handleBlocksChange}
        />
      )}
      {activeModal === "virtual" && (
        <GoVirtualModal
          locationId={activeLocationId}
          selectedDate={selectedDate}
          teachers={activeData?.teachers ?? []}
          students={activeData?.students ?? []}
          blocks={activeBlocks}
          onClose={() => setActiveModal(null)}
          onBlocksChange={handleBlocksChange}
        />
      )}
    </div>
  );
}
