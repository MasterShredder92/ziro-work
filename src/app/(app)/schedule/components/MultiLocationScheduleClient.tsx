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
import { RubyScheduleBar, type RubyEvent } from "./RubyScheduleBar";
import { ScheduleRoomsPanel } from "./ScheduleRoomsPanel";

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
  const [rubyEvent, setRubyEvent] = React.useState<RubyEvent | null>(null);
  const [activeView, setActiveView] = React.useState<"schedule" | "rooms">("schedule");

  // Auto-clear ruby event after 6 seconds
  React.useEffect(() => {
    if (!rubyEvent || rubyEvent.type === "idle") return;
    const t = setTimeout(() => setRubyEvent(null), 6000);
    return () => clearTimeout(t);
  }, [rubyEvent]);

  function fireRubyEvent(e: RubyEvent) {
    setRubyEvent({ ...e, timestamp: Date.now() });
  }

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
  // Rules:
  //   - not_bookable (locked) blocks are excluded entirely — they are never open or booked
  //   - open_time blocks with no student = genuinely open
  //   - student_session / first_day / last_day / sub / makeup / call_out etc with a student = booked
  //   - blocks without a student that are not open_time (e.g. call_out shell) = not counted as open
  const utilization = React.useMemo(() => {
    const dayBlocks = activeBlocks.filter(
      (b) => b.block_date === activeSelectedDate && b.block_type !== "not_bookable",
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
  }, [activeBlocks, activeSelectedDate]);

  return (
    <div className="space-y-0">
      {/* ── Single compact top bar ── */}
      <div className="sticky top-0 z-30 border-b border-[var(--z-border)] bg-[var(--z-bg)]/95 backdrop-blur-sm">
        {/* Row 1: location tabs | Ruby | week nav + tools */}
        <div className="flex items-center gap-1 overflow-x-auto px-3 py-1.5 scrollbar-none">
          {/* Location pills */}
          {locations.map((loc) => {
            const cfg = LOCATION_CONFIG[loc.id];
            const isActive = loc.id === activeLocationId;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => { setActiveLocationId(loc.id); setActiveView("schedule"); }}
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

          {/* Schedule / Rooms view toggle */}
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] p-0.5 ml-1">
            <button
              type="button"
              onClick={() => setActiveView("schedule")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                activeView === "schedule"
                  ? "bg-[#00ff88]/15 text-[#00ff88]"
                  : "text-[var(--z-muted)] hover:text-[var(--z-fg)]"
              }`}
            >
              Schedule
            </button>
            <button
              type="button"
              onClick={() => setActiveView("rooms")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                activeView === "rooms"
                  ? "bg-[#00ff88]/15 text-[#00ff88]"
                  : "text-[var(--z-muted)] hover:text-[var(--z-fg)]"
              }`}
            >
              Rooms
            </button>
          </div>

          {/* Ruby — centered, inline */}
          <div className="flex-1 flex justify-center">
            <RubyScheduleBar
              locationName={activeLocConfig?.name ?? locations.find((l) => l.id === activeLocationId)?.name ?? "Studio"}
              selectedDate={activeSelectedDate}
              event={rubyEvent}
            />
          </div>

          {/* Week nav + date jump */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => goWeek(-1)}
              className="rounded-md border border-[var(--z-border)] px-2 py-1 text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]"
            >
              ←
            </button>
            <span className="hidden text-[11px] font-semibold text-[var(--z-fg)] sm:inline">
              {formatWeekLabel(window.start, window.end)}
            </span>
            <button
              type="button"
              onClick={() => goWeek(1)}
              className="rounded-md border border-[var(--z-border)] px-2 py-1 text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]"
            >
              →
            </button>
            <label className="relative cursor-pointer" title="Jump to week">
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm select-none">📅</span>
              <input
                type="date"
                value={window.start}
                onChange={(e) => e.target.value && jumpToWeek(e.target.value)}
                className="h-7 w-7 cursor-pointer opacity-0"
                title="Jump to week"
              />
            </label>
          </div>
        </div>

        {/* Row 2: day tabs + utilization + toolbar (only in schedule view) */}
        {activeView === "schedule" && activeLocationId && activeData && (
          <div
            className="flex items-center gap-1 overflow-x-auto px-3 pb-1.5 pt-0.5 scrollbar-none"
            style={{ borderTop: `1px solid ${activeLocConfig?.border ?? "var(--z-border)"}40` }}
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
                  className={`flex min-w-[44px] flex-col items-center rounded-md border px-1.5 py-1 text-center transition-all ${
                    isClosed
                      ? "cursor-not-allowed border-transparent opacity-30"
                      : isSelected
                      ? "border"
                      : "border-transparent text-[var(--z-muted)] hover:border-[var(--z-border)] hover:text-[var(--z-fg)]"
                  }`}
                >
                  <span className="text-[9px] font-semibold uppercase tracking-wide">{label}</span>
                  <span className={`text-sm font-bold leading-none ${isToday ? "text-yellow-400" : ""}`}>{sub}</span>
                </button>
              );
            })}
            {loading && <span className="ml-1 text-[10px] text-[var(--z-muted)] animate-pulse">Loading…</span>}

            {/* Toolbar */}
            <div className="ml-auto flex shrink-0 items-center gap-1 pl-1">
              {/* Utilization */}
              <div className="flex items-center gap-1 rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: utilization.pct >= 80 ? "#22c55e" : utilization.pct >= 50 ? "#eab308" : "#ef4444" }} />
                <span className="text-[10px] font-bold text-[var(--z-fg)]">{utilization.pct}%</span>
                <span className="hidden text-[9px] text-[var(--z-muted)] sm:inline">{utilization.open} open</span>
              </div>
              <button type="button" onClick={() => setActiveModal("sub")} className="flex items-center gap-1 rounded-md border border-[#00ff88]/30 bg-[#00ff88]/10 px-2 py-1 text-[10px] font-bold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors">
                <svg viewBox="0 0 14 14" fill="none" className="h-2.5 w-2.5" aria-hidden><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Sub
              </button>
              <button type="button" onClick={() => setActiveModal("callout")} className="flex items-center gap-1 rounded-md border border-orange-400/30 bg-orange-500/10 px-2 py-1 text-[10px] font-bold text-orange-300 hover:bg-orange-500/20 transition-colors">
                <svg viewBox="0 0 14 14" fill="none" className="h-2.5 w-2.5" aria-hidden><path d="M7 2v5M7 9v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/></svg>
                Call Out
              </button>
              <button type="button" onClick={() => setActiveModal("virtual")} className="flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-300 hover:bg-sky-500/20 transition-colors">
                <svg viewBox="0 0 14 14" fill="none" className="h-2.5 w-2.5" aria-hidden><rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9 7l-4-2v4l4-2z" fill="currentColor"/></svg>
                Virtual
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Rooms view ── */}
      {activeView === "rooms" && (
        <ScheduleRoomsPanel
          locationId={activeLocationId}
          locationName={activeLocConfig?.name ?? locations.find((l) => l.id === activeLocationId)?.name ?? "Studio"}
          locationColor={activeLocConfig?.color ?? "#00ff88"}
          rooms={activeData?.rooms ?? []}
          onRubyEvent={fireRubyEvent}
        />
      )}

      {/* ── Active location grid ── */}
      {activeView === "schedule" && locations.map((loc) => {
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
                onRubyEvent={fireRubyEvent}
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
            fireRubyEvent({ type: "sub_added", message: "Sub block added — schedule updated." });
            setActiveModal(null);
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
            fireRubyEvent({ type: "call_out", message: "Call-out committed — coverage blocks created and students reassigned." });
            setActiveModal(null);
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
            fireRubyEvent({ type: "go_virtual", message: "Virtual day committed — sessions updated. Meet links queued once Gmail is connected." });
            setActiveModal(null);
          }}
        />
      )}
    </div>
  );
}
