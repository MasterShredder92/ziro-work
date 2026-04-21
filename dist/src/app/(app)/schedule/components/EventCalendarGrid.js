import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { EmptyState } from "@/components/system/SurfaceStates";
import { eventCardClass, SCHEDULING_ACCENT_HEX, } from "@/lib/scheduling/colorSemantics";
function startOfWeek(d) {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    const dow = copy.getDay();
    copy.setDate(copy.getDate() - dow);
    return copy;
}
function sameDay(a, b) {
    return (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate());
}
function hhmm(dt) {
    return dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
export function EventCalendarGrid({ events, weekStart, title, }) {
    var _a, _b;
    const anchor = weekStart !== null && weekStart !== void 0 ? weekStart : startOfWeek(new Date());
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(anchor);
        d.setDate(anchor.getDate() + i);
        return d;
    });
    const byDay = new Map();
    for (const ev of events) {
        const start = new Date(ev.startTime);
        const key = start.toDateString();
        const arr = (_a = byDay.get(key)) !== null && _a !== void 0 ? _a : [];
        arr.push(ev);
        byDay.set(key, arr);
    }
    for (const arr of byDay.values()) {
        arr.sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
    }
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden", children: [_jsxs("header", { className: "flex items-center justify-between px-4 py-3 border-b border-[var(--z-border)]", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Week" }), _jsxs("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: [title !== null && title !== void 0 ? title : anchor.toLocaleDateString(), " \u00B7 ", (_b = days[6]) === null || _b === void 0 ? void 0 : _b.toLocaleDateString()] })] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [events.length, " event", events.length === 1 ? "" : "s"] })] }), events.length === 0 ? (_jsx("div", { className: "p-4", children: _jsx(EmptyState, { title: "No events in this window", description: "Create an event to populate the weekly calendar." }) })) : null, _jsx("div", { className: "grid grid-cols-7 text-xs", children: days.map((day) => {
                    var _a;
                    const key = day.toDateString();
                    const list = (_a = byDay.get(key)) !== null && _a !== void 0 ? _a : [];
                    const isToday = sameDay(day, new Date());
                    return (_jsxs("div", { className: "border-r last:border-r-0 border-t border-[var(--z-border)] min-h-[140px] p-2 space-y-1.5", children: [_jsx("div", { className: "text-[11px] font-semibold", style: { color: isToday ? SCHEDULING_ACCENT_HEX : "var(--z-muted)" }, children: day.toLocaleDateString(undefined, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                }) }), events.length > 0 && list.length === 0 ? (_jsx("div", { className: "text-[11px] text-[var(--z-muted)]/60 italic", children: "\u2014" })) : (list.map((ev) => {
                                const start = new Date(ev.startTime);
                                const end = new Date(ev.endTime);
                                return (_jsxs(Link, { href: `/schedule/events/${ev.id}`, className: `block rounded border px-2 py-1 leading-tight hover:brightness-110 z-hover-micro-subtle ${eventCardClass(ev.status)}`, children: [_jsx("div", { className: "font-medium truncate", children: ev.title }), _jsxs("div", { className: "text-[10px] opacity-70", children: [hhmm(start), " \u2013 ", hhmm(end)] })] }, ev.id));
                            }))] }, key));
                }) })] }));
}
