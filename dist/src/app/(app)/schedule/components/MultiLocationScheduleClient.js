"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { weekWindowContaining, shiftWindowByOneWeek, eachDayInclusive, } from "@/lib/schedule/window";
import { LocationScheduleGrid } from "./LocationScheduleGrid";
import { MobileScheduleView } from "./MobileScheduleView";
import { SubModal, CallOutModal, GoVirtualModal } from "./ScheduleToolbarModals";
import { RubyScheduleBar } from "./RubyScheduleBar";
import { ScheduleRoomsPanel } from "./ScheduleRoomsPanel";
// ─── Location config ──────────────────────────────────────────────────────────
export const LOCATION_CONFIG = {
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
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatWeekLabel(start, end) {
    const s = new Date(`${start}T00:00:00Z`);
    const e = new Date(`${end}T00:00:00Z`);
    const sm = MONTH_NAMES[s.getUTCMonth()];
    const em = MONTH_NAMES[e.getUTCMonth()];
    if (sm === em) {
        return `${sm} ${s.getUTCDate()} – ${e.getUTCDate()}, ${e.getUTCFullYear()}`;
    }
    return `${sm} ${s.getUTCDate()} – ${em} ${e.getUTCDate()}, ${e.getUTCFullYear()}`;
}
function formatDayTab(isoDate, locationHours) {
    var _a;
    const d = new Date(`${isoDate}T00:00:00Z`);
    const dow = d.getUTCDay();
    const hours = locationHours[dow];
    const isClosed = (_a = hours === null || hours === void 0 ? void 0 : hours.isClosed) !== null && _a !== void 0 ? _a : false;
    const dayLabel = DAY_LABELS[dow];
    const dateNum = d.getUTCDate();
    return { label: dayLabel, sub: String(dateNum), isClosed };
}
export function MultiLocationScheduleClient({ locations, locationDataMap, initialWindow }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const [window, setWindow] = React.useState(initialWindow);
    const [activeLocationId, setActiveLocationId] = React.useState((_b = (_a = locations[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "");
    const [selectedDates, setSelectedDates] = React.useState(() => {
        var _a;
        const today = new Date().toISOString().slice(0, 10);
        const weekDays = eachDayInclusive(initialWindow.start, initialWindow.end);
        const defaultDay = weekDays.includes(today) ? today : (_a = weekDays[0]) !== null && _a !== void 0 ? _a : today;
        return Object.fromEntries(locations.map((l) => [l.id, defaultDay]));
    });
    const [blocksByLocationWindow, setBlocksByLocationWindow] = React.useState(() => {
        const out = {};
        for (const [locId, data] of Object.entries(locationDataMap)) {
            out[locId] = { [`${initialWindow.start}_${initialWindow.end}`]: data.blocks };
        }
        return out;
    });
    const [loading, setLoading] = React.useState(false);
    const [activeModal, setActiveModal] = React.useState(null);
    const [rubyEvent, setRubyEvent] = React.useState(null);
    const [activeView, setActiveView] = React.useState("schedule");
    // Auto-clear ruby event after 6 seconds
    React.useEffect(() => {
        if (!rubyEvent || rubyEvent.type === "idle")
            return;
        const t = setTimeout(() => setRubyEvent(null), 6000);
        return () => clearTimeout(t);
    }, [rubyEvent]);
    function fireRubyEvent(e) {
        setRubyEvent(Object.assign(Object.assign({}, e), { timestamp: Date.now() }));
    }
    const weekDays = React.useMemo(() => eachDayInclusive(window.start, window.end), [window.start, window.end]);
    const goWeek = React.useCallback((direction) => {
        setWindow((prev) => shiftWindowByOneWeek(prev.start, direction));
    }, []);
    const jumpToWeek = React.useCallback((isoDate) => {
        setWindow(weekWindowContaining(isoDate));
    }, []);
    // Fetch new week data for all locations when window changes
    React.useEffect(() => {
        const windowKey = `${window.start}_${window.end}`;
        const needsFetch = locations.some((loc) => { var _a; return !((_a = blocksByLocationWindow[loc.id]) === null || _a === void 0 ? void 0 : _a[windowKey]); });
        if (!needsFetch)
            return;
        setLoading(true);
        Promise.all(locations.map(async (loc) => {
            var _a;
            if ((_a = blocksByLocationWindow[loc.id]) === null || _a === void 0 ? void 0 : _a[windowKey])
                return null;
            const url = `/api/schedule-blocks?locationId=${encodeURIComponent(loc.id)}&date_from=${window.start}&date_to=${window.end}`;
            const res = await fetch(url).catch(() => null);
            if (!(res === null || res === void 0 ? void 0 : res.ok))
                return null;
            const json = await res.json().catch(() => null);
            const rawBlocks = Array.isArray(json === null || json === void 0 ? void 0 : json.data) ? json.data : Array.isArray(json) ? json : [];
            return { locId: loc.id, blocks: rawBlocks };
        })).then((results) => {
            setBlocksByLocationWindow((prev) => {
                var _a;
                const next = Object.assign({}, prev);
                for (const result of results) {
                    if (!result)
                        continue;
                    next[result.locId] = Object.assign(Object.assign({}, ((_a = next[result.locId]) !== null && _a !== void 0 ? _a : {})), { [windowKey]: result.blocks });
                }
                return next;
            });
            setLoading(false);
        });
    }, [window.start, window.end, locations, blocksByLocationWindow]);
    const activeLocConfig = LOCATION_CONFIG[activeLocationId];
    const windowKey = `${window.start}_${window.end}`;
    const activeData = locationDataMap[activeLocationId];
    const activeBlocks = (_e = (_d = (_c = blocksByLocationWindow[activeLocationId]) === null || _c === void 0 ? void 0 : _c[windowKey]) !== null && _d !== void 0 ? _d : activeData === null || activeData === void 0 ? void 0 : activeData.blocks) !== null && _e !== void 0 ? _e : [];
    const activeSelectedDate = (_f = selectedDates[activeLocationId]) !== null && _f !== void 0 ? _f : window.start;
    // Utilization for active location on selected date
    // Rules:
    //   - not_bookable (locked) blocks are excluded entirely — they are never open or booked
    //   - open_time blocks with no student = genuinely open
    //   - student_session / first_day / last_day / sub / makeup / call_out etc with a student = booked
    //   - blocks without a student that are not open_time (e.g. call_out shell) = not counted as open
    const utilization = React.useMemo(() => {
        const dayBlocks = activeBlocks.filter((b) => b.block_date === activeSelectedDate && b.block_type !== "not_bookable");
        const booked = dayBlocks.filter((b) => b.student_id && b.block_type !== "open_time").length;
        const open = dayBlocks.filter((b) => b.block_type === "open_time" && !b.student_id).length;
        const countable = booked + open;
        const pct = countable > 0 ? Math.round((booked / countable) * 100) : 0;
        return { total: countable, booked, open, pct };
    }, [activeBlocks, activeSelectedDate]);
    return (_jsxs("div", { className: "space-y-0", children: [_jsxs("div", { className: "sticky top-0 z-30 border-b border-[var(--z-border)] bg-[var(--z-bg)]/95 backdrop-blur-sm", children: [_jsxs("div", { className: "flex items-center gap-1 overflow-x-auto px-3 py-1.5 scrollbar-none", children: [locations.map((loc) => {
                                var _a, _b, _c;
                                const cfg = LOCATION_CONFIG[loc.id];
                                const isActive = loc.id === activeLocationId;
                                return (_jsx("button", { type: "button", onClick: () => { setActiveLocationId(loc.id); setActiveView("schedule"); }, style: isActive ? {
                                        borderColor: (_a = cfg === null || cfg === void 0 ? void 0 : cfg.border) !== null && _a !== void 0 ? _a : "transparent",
                                        backgroundColor: (_b = cfg === null || cfg === void 0 ? void 0 : cfg.accent) !== null && _b !== void 0 ? _b : "transparent",
                                        color: (_c = cfg === null || cfg === void 0 ? void 0 : cfg.textColor) !== null && _c !== void 0 ? _c : "inherit",
                                    } : {}, className: `shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${isActive
                                        ? "border"
                                        : "border-transparent text-[var(--z-muted)] hover:border-[var(--z-border)] hover:text-[var(--z-fg)]"}`, children: loc.name }, loc.id));
                            }), _jsxs("div", { className: "flex shrink-0 items-center gap-0.5 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] p-0.5 ml-1", children: [_jsx("button", { type: "button", onClick: () => setActiveView("schedule"), className: `rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${activeView === "schedule"
                                            ? "bg-[#00ff88]/15 text-[#00ff88]"
                                            : "text-[var(--z-muted)] hover:text-[var(--z-fg)]"}`, children: "Schedule" }), _jsx("button", { type: "button", onClick: () => setActiveView("rooms"), className: `rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${activeView === "rooms"
                                            ? "bg-[#00ff88]/15 text-[#00ff88]"
                                            : "text-[var(--z-muted)] hover:text-[var(--z-fg)]"}`, children: "Rooms" })] }), _jsx("div", { className: "flex-1 flex justify-center", children: _jsx(RubyScheduleBar, { locationName: (_j = (_g = activeLocConfig === null || activeLocConfig === void 0 ? void 0 : activeLocConfig.name) !== null && _g !== void 0 ? _g : (_h = locations.find((l) => l.id === activeLocationId)) === null || _h === void 0 ? void 0 : _h.name) !== null && _j !== void 0 ? _j : "Studio", selectedDate: activeSelectedDate, event: rubyEvent }) }), _jsxs("div", { className: "flex shrink-0 items-center gap-1.5", children: [_jsx("button", { type: "button", onClick: () => goWeek(-1), className: "rounded-md border border-[var(--z-border)] px-2 py-1 text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "\u2190" }), _jsx("span", { className: "hidden text-[11px] font-semibold text-[var(--z-fg)] sm:inline", children: formatWeekLabel(window.start, window.end) }), _jsx("button", { type: "button", onClick: () => goWeek(1), className: "rounded-md border border-[var(--z-border)] px-2 py-1 text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "\u2192" }), _jsxs("label", { className: "relative cursor-pointer", title: "Jump to week", children: [_jsx("span", { className: "pointer-events-none absolute inset-0 flex items-center justify-center text-sm select-none", children: "\uD83D\uDCC5" }), _jsx("input", { type: "date", value: window.start, onChange: (e) => e.target.value && jumpToWeek(e.target.value), className: "h-7 w-7 cursor-pointer opacity-0", title: "Jump to week" })] })] })] }), activeView === "schedule" && activeLocationId && activeData && (_jsxs("div", { className: "flex items-center gap-1 overflow-x-auto px-3 pb-1.5 pt-0.5 scrollbar-none", style: { borderTop: `1px solid ${(_k = activeLocConfig === null || activeLocConfig === void 0 ? void 0 : activeLocConfig.border) !== null && _k !== void 0 ? _k : "var(--z-border)"}40` }, children: [weekDays.map((day) => {
                                var _a, _b, _c, _d;
                                const hours = (_a = activeData.locationHours) !== null && _a !== void 0 ? _a : {};
                                const { label, sub, isClosed } = formatDayTab(day, hours);
                                const isSelected = selectedDates[activeLocationId] === day;
                                const isToday = day === new Date().toISOString().slice(0, 10);
                                return (_jsxs("button", { type: "button", disabled: isClosed, onClick: () => setSelectedDates((prev) => (Object.assign(Object.assign({}, prev), { [activeLocationId]: day }))), style: isSelected && !isClosed ? {
                                        borderColor: (_b = activeLocConfig === null || activeLocConfig === void 0 ? void 0 : activeLocConfig.border) !== null && _b !== void 0 ? _b : "var(--z-border)",
                                        backgroundColor: (_c = activeLocConfig === null || activeLocConfig === void 0 ? void 0 : activeLocConfig.accent) !== null && _c !== void 0 ? _c : "transparent",
                                        color: (_d = activeLocConfig === null || activeLocConfig === void 0 ? void 0 : activeLocConfig.textColor) !== null && _d !== void 0 ? _d : "inherit",
                                    } : {}, className: `flex min-w-[44px] flex-col items-center rounded-md border px-1.5 py-1 text-center transition-all ${isClosed
                                        ? "cursor-not-allowed border-transparent opacity-30"
                                        : isSelected
                                            ? "border"
                                            : "border-transparent text-[var(--z-muted)] hover:border-[var(--z-border)] hover:text-[var(--z-fg)]"}`, children: [_jsx("span", { className: "text-[9px] font-semibold uppercase tracking-wide", children: label }), _jsx("span", { className: `text-sm font-bold leading-none ${isToday ? "text-yellow-400" : ""}`, children: sub })] }, day));
                            }), loading && _jsx("span", { className: "ml-1 text-[10px] text-[var(--z-muted)] animate-pulse", children: "Loading\u2026" }), _jsxs("div", { className: "ml-auto flex shrink-0 items-center gap-1 pl-1", children: [_jsxs("div", { className: "flex items-center gap-1 rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1", children: [_jsx("div", { className: "h-1.5 w-1.5 rounded-full", style: { backgroundColor: utilization.pct >= 80 ? "#22c55e" : utilization.pct >= 50 ? "#eab308" : "#ef4444" } }), _jsxs("span", { className: "text-[10px] font-bold text-[var(--z-fg)]", children: [utilization.pct, "%"] }), _jsxs("span", { className: "hidden text-[9px] text-[var(--z-muted)] sm:inline", children: [utilization.open, " open"] })] }), _jsxs("button", { type: "button", onClick: () => setActiveModal("sub"), className: "flex items-center gap-1 rounded-md border border-[#00ff88]/30 bg-[#00ff88]/10 px-2 py-1 text-[10px] font-bold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors", children: [_jsx("svg", { viewBox: "0 0 14 14", fill: "none", className: "h-2.5 w-2.5", "aria-hidden": true, children: _jsx("path", { d: "M7 2v10M2 7h10", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }), "Sub"] }), _jsxs("button", { type: "button", onClick: () => setActiveModal("callout"), className: "flex items-center gap-1 rounded-md border border-orange-400/30 bg-orange-500/10 px-2 py-1 text-[10px] font-bold text-orange-300 hover:bg-orange-500/20 transition-colors", children: [_jsxs("svg", { viewBox: "0 0 14 14", fill: "none", className: "h-2.5 w-2.5", "aria-hidden": true, children: [_jsx("path", { d: "M7 2v5M7 9v1", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }), _jsx("circle", { cx: "7", cy: "7", r: "6", stroke: "currentColor", strokeWidth: "1.3" })] }), "Call Out"] }), _jsxs("button", { type: "button", onClick: () => setActiveModal("virtual"), className: "flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-300 hover:bg-sky-500/20 transition-colors", children: [_jsxs("svg", { viewBox: "0 0 14 14", fill: "none", className: "h-2.5 w-2.5", "aria-hidden": true, children: [_jsx("rect", { x: "1", y: "3", width: "12", height: "8", rx: "1.5", stroke: "currentColor", strokeWidth: "1.3" }), _jsx("path", { d: "M9 7l-4-2v4l4-2z", fill: "currentColor" })] }), "Virtual"] })] })] }))] }), activeView === "rooms" && (_jsx(ScheduleRoomsPanel, { locationId: activeLocationId, locationName: (_o = (_l = activeLocConfig === null || activeLocConfig === void 0 ? void 0 : activeLocConfig.name) !== null && _l !== void 0 ? _l : (_m = locations.find((l) => l.id === activeLocationId)) === null || _m === void 0 ? void 0 : _m.name) !== null && _o !== void 0 ? _o : "Studio", locationColor: (_p = activeLocConfig === null || activeLocConfig === void 0 ? void 0 : activeLocConfig.color) !== null && _p !== void 0 ? _p : "#00ff88", rooms: (_q = activeData === null || activeData === void 0 ? void 0 : activeData.rooms) !== null && _q !== void 0 ? _q : [], onRubyEvent: fireRubyEvent })), activeView === "schedule" && locations.map((loc) => {
                var _a, _b, _c;
                if (loc.id !== activeLocationId)
                    return null;
                const data = locationDataMap[loc.id];
                if (!data)
                    return null;
                const currentBlocks = (_b = (_a = blocksByLocationWindow[loc.id]) === null || _a === void 0 ? void 0 : _a[windowKey]) !== null && _b !== void 0 ? _b : data.blocks;
                const selectedDate = (_c = selectedDates[loc.id]) !== null && _c !== void 0 ? _c : window.start;
                const cfg = LOCATION_CONFIG[loc.id];
                const handleBlocksChange = (newBlocks) => {
                    setBlocksByLocationWindow((prev) => {
                        var _a;
                        return (Object.assign(Object.assign({}, prev), { [loc.id]: Object.assign(Object.assign({}, ((_a = prev[loc.id]) !== null && _a !== void 0 ? _a : {})), { [windowKey]: newBlocks }) }));
                    });
                };
                return (_jsxs(React.Fragment, { children: [_jsx("div", { className: "hidden sm:block", children: _jsx(LocationScheduleGrid, { locationId: loc.id, locationName: loc.name, locationConfig: cfg, selectedDate: selectedDate, blocks: currentBlocks, teachers: data.teachers, students: data.students, families: data.families, availability: data.availability, rooms: data.rooms, locationHours: data.locationHours, onBlocksChange: handleBlocksChange, onRubyEvent: fireRubyEvent }) }), _jsx("div", { className: "block sm:hidden", children: _jsx(MobileScheduleView, { locationId: loc.id, locationConfig: cfg, selectedDate: selectedDate, blocks: currentBlocks, teachers: data.teachers, students: data.students, families: data.families, locationHours: data.locationHours, onBlocksChange: handleBlocksChange }) })] }, loc.id));
            }), activeModal === "sub" && activeData && (_jsx(SubModal, { locationId: activeLocationId, selectedDate: activeSelectedDate, teachers: activeData.teachers, blocks: activeBlocks, onClose: () => setActiveModal(null), onBlocksChange: (newBlocks) => {
                    setBlocksByLocationWindow((prev) => {
                        var _a;
                        return (Object.assign(Object.assign({}, prev), { [activeLocationId]: Object.assign(Object.assign({}, ((_a = prev[activeLocationId]) !== null && _a !== void 0 ? _a : {})), { [windowKey]: newBlocks }) }));
                    });
                    fireRubyEvent({ type: "sub_added", message: "Sub block added — schedule updated." });
                    setActiveModal(null);
                } })), activeModal === "callout" && activeData && (_jsx(CallOutModal, { locationId: activeLocationId, selectedDate: activeSelectedDate, teachers: activeData.teachers, students: activeData.students, blocks: activeBlocks, onClose: () => setActiveModal(null), onBlocksChange: (newBlocks) => {
                    setBlocksByLocationWindow((prev) => {
                        var _a;
                        return (Object.assign(Object.assign({}, prev), { [activeLocationId]: Object.assign(Object.assign({}, ((_a = prev[activeLocationId]) !== null && _a !== void 0 ? _a : {})), { [windowKey]: newBlocks }) }));
                    });
                    fireRubyEvent({ type: "call_out", message: "Call-out committed — coverage blocks created and students reassigned." });
                    setActiveModal(null);
                } })), activeModal === "virtual" && activeData && (_jsx(GoVirtualModal, { locationId: activeLocationId, selectedDate: activeSelectedDate, teachers: activeData.teachers, students: activeData.students, blocks: activeBlocks, onClose: () => setActiveModal(null), onBlocksChange: (newBlocks) => {
                    setBlocksByLocationWindow((prev) => {
                        var _a;
                        return (Object.assign(Object.assign({}, prev), { [activeLocationId]: Object.assign(Object.assign({}, ((_a = prev[activeLocationId]) !== null && _a !== void 0 ? _a : {})), { [windowKey]: newBlocks }) }));
                    });
                    fireRubyEvent({ type: "go_virtual", message: "Virtual day committed — sessions updated. Meet links queued once Gmail is connected." });
                    setActiveModal(null);
                } }))] }));
}
