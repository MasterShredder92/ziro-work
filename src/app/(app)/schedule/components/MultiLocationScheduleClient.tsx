"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useZiroWorkspace } from "@/components/workspace/ZiroWorkspaceContext";
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
  /** Admin / director / teacher: mutations, auto check-in, cancel. */
  canWriteSchedule?: boolean;
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
type SurfaceView = "schedule" | "rooms";

function ScheduleSurfaceToggle({
  value,
  onChange,
  density,
}: {
  value: SurfaceView;
  onChange: (v: SurfaceView) => void;
  density: "compact" | "comfortable";
}) {
  const compact = density === "compact";
  return (
    <div
      className={
        compact
          ? "flex items-center gap-0.5 rounded-full border border-white/10 bg-black/25 p-0.5"
          : "flex items-center gap-0.5 rounded-full border border-white/10 bg-black/25 p-0.5 shadow-inner"
      }
    >
      <button type="button" onClick={() => onChange("schedule")}
        className={`${compact ? "rounded-full px-2.5 py-0.5 text-[10px]" : "rounded-full px-3 py-1 text-[11px]"} font-bold transition-colors ${
          value === "schedule" ? (compact ? "bg-[#c4f036] text-black" : "bg-[#c4f036] text-black shadow-[0_0_20px_rgba(196,240,54,0.35)]") : "text-[var(--z-muted)] hover:text-[var(--z-fg)]"
        }`}>
        Timeline
      </button>
      <button type="button" onClick={() => onChange("rooms")}
        className={`${compact ? "rounded-full px-2.5 py-0.5 text-[10px]" : "rounded-full px-3 py-1 text-[11px]"} font-semibold transition-all ${
          value === "rooms" ? (compact ? "bg-[#c4f036] text-black" : "bg-[#c4f036] text-black shadow-[0_0_20px_rgba(196,240,54,0.35)]") : "text-[var(--z-muted)] hover:text-[var(--z-fg)]"
        }`}>
        Inventory
      </button>
    </div>
  );
}

export function MultiLocationScheduleClient({
  locations,
  locationDataMap,
  initialWindow,
  canWriteSchedule = false,
}: Props) {
  const router = useRouter();
  const { selectedLocId } = useZiroWorkspace();
  const initialWindowKey = `${initialWindow.start}_${initialWindow.end}`;
  const [window, setWindow] = React.useState<ScheduleWindow>(initialWindow);
  /** Resolved from left rail; schedule has no aggregate view — invalid/missing selection uses first studio. */
  const activeLocationId = React.useMemo(() => {
    if (selectedLocId && locations.some((l) => l.id === selectedLocId)) return selectedLocId;
    return locations[0]?.id ?? "";
  }, [selectedLocId, locations]);
  const activeLocationLabel =
    locations.find((l) => l.id === activeLocationId)?.name ?? "Studio";
  // Single shared date — persists across location tab switches
  const [selectedDate, setSelectedDate] = React.useState<string>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekDays = eachDayInclusive(initialWindow.start, initialWindow.end);
    return weekDays.includes(today) ? today : weekDays[0] ?? today;
  });
  /** Full window payload per location × week (same shape as SSR `loadWindowedScheduleData`). */
  const [windowDataByLoc, setWindowDataByLoc] = React.useState<
    Record<string, Record<string, WindowedScheduleData>>
  >(() => {
    const out: Record<string, Record<string, WindowedScheduleData>> = {};
    for (const [locId, data] of Object.entries(locationDataMap)) {
      out[locId] = { [initialWindowKey]: data };
    }
    return out;
  });
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const windowDataRef = React.useRef(windowDataByLoc);
  windowDataRef.current = windowDataByLoc;
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

  // Fetch full window payload for any location missing this week; idle-prefetch prev/next week.
  React.useEffect(() => {
    const windowKey = `${window.start}_${window.end}`;
    const missing = locations.filter((loc) => !windowDataRef.current[loc.id]?.[windowKey]);

    let cancelled = false;
    let idlePrefetchId: number | null = null;
    let timeoutPrefetchId: ReturnType<typeof setTimeout> | null = null;

    const clearPrefetchSchedule = () => {
      if (idlePrefetchId != null && typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(idlePrefetchId);
        idlePrefetchId = null;
      }
      if (timeoutPrefetchId != null) {
        clearTimeout(timeoutPrefetchId);
        timeoutPrefetchId = null;
      }
    };

    const fetchWindowForLocation = (locId: string, w: ScheduleWindow) => {
      const url = `/api/schedule/window?locationId=${encodeURIComponent(locId)}&start=${encodeURIComponent(w.start)}&end=${encodeURIComponent(w.end)}`;
      return fetch(url).then(async (res) => {
        const json = (await res.json().catch(() => null)) as { data?: WindowedScheduleData; error?: string };
        if (!res.ok) {
          const msg = typeof json?.error === "string" ? json.error : res.statusText;
          throw new Error(msg || "Failed to load schedule");
        }
        if (!json?.data) {
          throw new Error("Invalid schedule response");
        }
        return { locId, w, data: json.data };
      });
    };

    const mergeResult = (r: { locId: string; w: ScheduleWindow; data: WindowedScheduleData }) => {
      const k = `${r.w.start}_${r.w.end}`;
      setWindowDataByLoc((prev) => ({
        ...prev,
        [r.locId]: { ...(prev[r.locId] ?? {}), [k]: r.data },
      }));
    };

    /** Prefetch only the visible studio’s adjacent weeks (avoids 4×2 full-window storms). */
    const runPrefetch = () => {
      if (cancelled || !activeLocationId) return;
      const neighbors = [shiftWindowByOneWeek(window.start, -1), shiftWindowByOneWeek(window.start, 1)];
      for (const neighbor of neighbors) {
        const nk = `${neighbor.start}_${neighbor.end}`;
        if (windowDataRef.current[activeLocationId]?.[nk]) continue;
        fetchWindowForLocation(activeLocationId, neighbor)
          .then((r) => {
            if (cancelled) return;
            mergeResult(r);
          })
          .catch(() => {});
      }
    };

    const schedulePrefetch = () => {
      clearPrefetchSchedule();
      if (typeof requestIdleCallback !== "undefined") {
        idlePrefetchId = requestIdleCallback(runPrefetch, { timeout: 4000 });
      } else {
        timeoutPrefetchId = setTimeout(runPrefetch, 150);
      }
    };

    if (missing.length === 0) {
      setLoadError(null);
      setLoading(false);
      schedulePrefetch();
      return () => {
        cancelled = true;
        clearPrefetchSchedule();
      };
    }

    const activeInMissing =
      Boolean(activeLocationId) && missing.some((loc) => loc.id === activeLocationId);

    setLoadError(null);
    if (activeInMissing) setLoading(true);
    else setLoading(false);

    /** Do not bulk-fetch every other location for the same week — that was 3× duplicate DB+JSON work on every load. Data loads when the user picks that studio (or prefetched weeks for the active studio only, below). */
    const afterActiveWindow = () => {
      if (cancelled) return Promise.resolve();
      schedulePrefetch();
      return Promise.resolve();
    };

    let chain: Promise<void>;
    if (activeInMissing && activeLocationId) {
      chain = fetchWindowForLocation(activeLocationId, window)
        .then((r) => {
          if (cancelled) return;
          mergeResult(r);
          setLoading(false);
        })
        .then(afterActiveWindow);
    } else {
      chain = Promise.resolve().then(afterActiveWindow);
    }

    chain.catch((err: unknown) => {
      if (!cancelled) {
        setLoading(false);
        setLoadError(err instanceof Error ? err.message : "Failed to load schedule");
      }
    });

    return () => {
      cancelled = true;
      clearPrefetchSchedule();
    };
  }, [window.start, window.end, locations, activeLocationId]);

  const activeLocConfig = LOCATION_CONFIG[activeLocationId];
  const windowKey = `${window.start}_${window.end}`;
  const activeData = windowDataByLoc[activeLocationId]?.[windowKey];
  const activeBlocks = activeData?.blocks ?? [];
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

  /** Boolean guard so TS does not narrow `activeView` inside the timeline chrome branch. */
  const showTimelineChrome =
    activeView === "schedule" && Boolean(activeLocationId && activeData);

  const handleBlocksChange = (newBlocks: ScheduleBlock[]) => {
    setWindowDataByLoc((prev) => {
      const locMap = prev[activeLocationId] ?? {};
      const cur = locMap[windowKey];
      if (!cur) return prev;
      return {
        ...prev,
        [activeLocationId]: {
          ...locMap,
          [windowKey]: { ...cur, blocks: newBlocks },
        },
      };
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-0">
      {/* Single schedule chrome: glass strip + controls (replaces stacked “2002” headers). */}
      <div className="sticky top-0 z-40 border-b border-white/[0.07] bg-[color-mix(in_oklab,var(--z-bg)_88%,transparent)] shadow-[0_12px_48px_rgba(0,0,0,0.35)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--z-bg)_72%,transparent)]">

        {/* ══════════ MOBILE HEADER (hidden sm+) ══════════════════════════════ */}
        <div className="flex sm:hidden flex-col">
          {/* Mobile Row 1: hamburger | location | ◀ date ▶ | 📅 | +Sub */}
          <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ height: 44 }}>
            {/* Hamburger — triggers global sidebar via data attribute */}
            <button
              type="button"
              aria-label="Back to dashboard"
              onClick={() => {
                router.push("/dashboard");
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-fg)] active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Location label — studio is chosen via left rail */}
            <div
              className="flex min-w-0 flex-1 items-center rounded-lg border px-2.5 py-1 text-[11px] font-bold bg-[var(--z-surface-2)] truncate"
              style={{
                borderColor: LOCATION_CONFIG[activeLocationId]?.border ?? "var(--z-border)",
                color: LOCATION_CONFIG[activeLocationId]?.textColor ?? "var(--z-fg)",
              }}
              title={activeLocationLabel}
            >
              <span className="truncate">{activeLocationLabel}</span>
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
            <ScheduleSurfaceToggle value={activeView} onChange={setActiveView} density="compact" />

            {/* Util pill — COMIC BOOK POP */}
            {activeView === "schedule" && (
              <div className="flex items-center gap-2 ml-auto shrink-0 px-3 py-1.5 rounded-lg border-2 border-[#c4f036] bg-gradient-to-r from-[rgba(196,240,54,0.1)] to-[rgba(168,85,247,0.08)] shadow-[0_0_16px_rgba(196,240,54,0.3)]">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#c4f036] drop-shadow-lg">Util</span>
                <span className={`text-[11px] font-black drop-shadow-lg ${utilization.pct > 85 ? "text-orange-400" : "text-[#c4f036]"}`}>
                  {utilization.pct}%
                </span>
                <span className="text-[9px] text-[#666]">·</span>
                <span className="text-[10px] font-bold text-[#c4f036] drop-shadow-lg">{utilization.booked} booked</span>
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

        {/* ══════════ DESKTOP — one condensed control strip ══════════ */}
        <div className="hidden sm:block px-2.5 py-1.5">
          {showTimelineChrome ? (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <div className="flex shrink-0 items-center gap-1.5">
                <ScheduleSurfaceToggle value={activeView} onChange={setActiveView} density="compact" />
                {canWriteSchedule ? (
                  <Link
                    href="/schedule/rooms"
                    className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--z-muted)] transition hover:border-[#c4f036]/40 hover:text-[#c4f036]"
                  >
                    Matrix →
                  </Link>
                ) : null}
              </div>

              <div className="hidden lg:block h-5 w-px shrink-0 bg-gradient-to-b from-transparent via-white/15 to-transparent" aria-hidden />

              <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-white/10 bg-black/20 px-0.5 py-0.5">
                <button type="button" onClick={() => goWeek(-1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-[var(--z-muted)] transition hover:bg-white/10 hover:text-[var(--z-fg)]"
                  aria-label="Previous week">‹</button>
                <span className="max-w-[180px] truncate px-0.5 text-center text-[10px] font-medium tabular-nums text-[var(--z-fg)] lg:max-w-[240px]">
                  {formatWeekLabel(window.start, window.end)}
                </span>
                <button type="button" onClick={() => goWeek(1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-[var(--z-muted)] transition hover:bg-white/10 hover:text-[var(--z-fg)]"
                  aria-label="Next week">›</button>
                <label className="relative ml-0.5 cursor-pointer" title="Jump to week">
                  <span className="pointer-events-none flex h-7 w-7 items-center justify-center rounded-full text-[var(--z-muted)] transition hover:bg-white/10">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="opacity-80">
                      <rect x="2.5" y="3" width="11" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M2.5 6.25h11M6 2.5V4.5M10 2.5V4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input type="date" value={window.start}
                    onChange={(e) => e.target.value && jumpToWeek(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto scrollbar-none">
                {weekDays.map((day) => {
                  const hours = activeData.locationHours ?? {};
                  const { label, sub, isClosed } = formatDayTab(day, hours);
                  const isSelected = selectedDate === day;
                  const isToday = day === new Date().toISOString().slice(0, 10);
                  return (
                    <button key={day} type="button" disabled={isClosed} onClick={() => setSelectedDate(day)}
                      className={`flex min-w-[40px] flex-col items-center gap-0 rounded-lg px-1.5 py-1 transition-all ${
                        isSelected
                          ? "bg-[#c4f036] text-black shadow-[0_0_16px_rgba(196,240,54,0.22)]"
                          : isClosed
                            ? "cursor-not-allowed opacity-25"
                            : isToday
                              ? "border border-[#c4f036]/40 bg-[#c4f036]/10 text-[#c4f036]"
                              : "text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)]"
                      }`}>
                      <span className="text-[8px] font-bold uppercase tracking-wider">{label}</span>
                      <span className="text-[13px] font-black leading-none">{sub}</span>
                    </button>
                  );
                })}
              </div>

              <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                <div
                  className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] tabular-nums"
                  title={`${utilization.booked} booked · ${utilization.open} open`}
                >
                  <span className="text-[var(--z-muted)]">Load </span>
                  <span className={`font-bold ${utilization.pct > 85 ? "text-orange-400" : "text-[#c4f036]"}`}>
                    {utilization.pct}%
                  </span>
                  <span className="text-[var(--z-muted)]"> · </span>
                  <span className="text-[var(--z-muted)]">{utilization.booked}</span>
                  <span className="text-[var(--z-muted)]">/</span>
                  <span className="text-[var(--z-muted)]">{utilization.total}</span>
                </div>
                <button type="button" onClick={() => setActiveModal("sub")}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-[var(--z-fg)] transition hover:border-[#c4f036]/50 hover:bg-[#c4f036]/10">
                  + Sub
                </button>
                <button type="button" onClick={() => setActiveModal("callout")}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-[var(--z-fg)] transition hover:border-red-400/50 hover:bg-red-500/10">
                  Call out
                </button>
                <button type="button" onClick={() => setActiveModal("virtual")}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-[var(--z-fg)] transition hover:border-sky-400/50 hover:bg-sky-500/10">
                  Virtual
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <ScheduleSurfaceToggle value={activeView} onChange={setActiveView} density="compact" />
              {canWriteSchedule ? (
                <Link
                  href="/schedule/rooms"
                  className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--z-muted)] transition hover:border-[#c4f036]/40 hover:text-[#c4f036]"
                >
                  Room matrix →
                </Link>
              ) : null}
            </div>
          )}
        </div>

      </div>
      {/* Main content area */}
      <div className="relative">
        {loadError ? (
          <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-sm text-red-200">
            {loadError}
          </div>
        ) : null}
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
                canWriteSchedule={canWriteSchedule}
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
                canWriteSchedule={canWriteSchedule}
              />
            </div>
          </>
        ) : (
          <ScheduleRoomsPanel
            key={`${activeLocationId}:${(activeData?.rooms ?? [])
              .map((r) => r.id)
              .sort()
              .join(",")}`}
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
