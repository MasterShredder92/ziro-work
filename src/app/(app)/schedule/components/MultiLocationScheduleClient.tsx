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
import { type RubyEvent } from "./RubyScheduleBar";
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
  const activeSelectedDate = selectedDates[activeLocationId] ?? window.start;

  // Utilization for active location on selected date
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
      <div className="sticky top-0 z-40 border-b border-[var(--z-border)] bg-[var(--z-bg)]/95 backdrop-blur-sm">
        {/* Row 1: location tabs | Ruby (Removed) | week nav + tools */}
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

          {/* Center space (Ruby removed) */}
          <div className="flex-1" />

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
                  className={`flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 transition-all ${
                    isSelected
                      ? "bg-[var(--z-accent)] text-black"
                      : isClosed
                        ? "opacity-20 cursor-not-allowed"
                        : isToday
                          ? "bg-[var(--z-surface-2)] text-[var(--z-accent)] border border-[var(--z-accent)]/30"
                          : "text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)]"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
                  <span className="text-sm font-black leading-none">{sub}</span>
                </button>
              );
            })}

            {/* Utilization indicator */}
            <div className="mx-2 h-8 w-[1px] bg-[var(--z-border)] opacity-50" />
            <div className="flex shrink-0 flex-col justify-center px-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--z-muted)]">Utilization</span>
                <span className={`text-[10px] font-black ${utilization.pct > 85 ? "text-orange-400" : "text-[#00ff88]"}`}>
                  {utilization.pct}%
                </span>
              </div>
              <div className="text-[11px] font-bold text-[var(--z-fg)]">
                {utilization.booked} <span className="text-[var(--z-muted)] font-medium">booked ·</span> {utilization.open} <span className="text-[var(--z-muted)] font-medium">open</span>
              </div>
            </div>

            {/* Toolbar buttons */}
            <div className="ml-auto flex items-center gap-1.5 pr-1">
              <button
                type="button"
                onClick={() => setActiveModal("sub")}
                className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-[11px] font-bold text-[var(--z-fg)] hover:border-[var(--z-accent)]/50 hover:bg-[var(--z-accent)]/5 transition-all"
              >
                + Sub
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("callout")}
                className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-[11px] font-bold text-[var(--z-fg)] hover:border-red-500/50 hover:bg-red-500/5 transition-all"
              >
                Call Out
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("virtual")}
                className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-[11px] font-bold text-[var(--z-fg)] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
              >
                Virtual
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Main content area ── */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--z-bg)]/40 backdrop-blur-[1px]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--z-accent)] border-t-transparent" />
          </div>
        )}

        {activeView === "schedule" ? (
          <LocationScheduleGrid
            locationId={activeLocationId}
            locationName={activeLocConfig?.name ?? "Studio"}
            selectedDate={activeSelectedDate}
            blocks={activeBlocks.filter((b) => b.block_date === activeSelectedDate)}
            teachers={activeData?.teachers ?? []}
            students={activeData?.students ?? []}
            families={activeData?.families ?? []}
            rooms={activeData?.rooms ?? []}
            onRubyEvent={fireRubyEvent}
          />
        ) : (
          <ScheduleRoomsPanel
            locationId={activeLocationId}
            locationName={activeLocConfig?.name ?? "Studio"}
            rooms={activeData?.rooms ?? []}
            onRubyEvent={fireRubyEvent}
          />
        )}
      </div>

      {/* ── Modals ── */}
      {activeModal === "sub" && (
        <SubModal
          locationId={activeLocationId}
          onClose={() => setActiveModal(null)}
          onSuccess={(e) => { setActiveModal(null); fireRubyEvent(e); }}
        />
      )}
      {activeModal === "callout" && (
        <CallOutModal
          locationId={activeLocationId}
          onClose={() => setActiveModal(null)}
          onSuccess={(e) => { setActiveModal(null); fireRubyEvent(e); }}
        />
      )}
      {activeModal === "virtual" && (
        <GoVirtualModal
          locationId={activeLocationId}
          onClose={() => setActiveModal(null)}
          onSuccess={(e) => { setActiveModal(null); fireRubyEvent(e); }}
        />
      )}
    </div>
  );
}
