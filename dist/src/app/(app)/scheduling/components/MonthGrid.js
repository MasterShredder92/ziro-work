"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function startOfMonthGrid(focusDate) {
    const first = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
}
function sameDay(a, b) {
    return (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate());
}
export function MonthGrid({ focusDate, appointments, onSelectDay }) {
    const gridStart = startOfMonthGrid(focusDate);
    const today = new Date();
    const days = Array.from({ length: 42 }, (_, idx) => {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + idx);
        d.setHours(0, 0, 0, 0);
        return d;
    });
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsx("div", { className: "grid grid-cols-7 border-b border-[var(--z-border)] bg-[var(--z-surface-2)]", children: DAY_LABELS.map((label) => (_jsx("div", { className: "px-2 py-2 text-xs font-semibold text-[var(--z-muted)]", children: label }, label))) }), _jsx("div", { className: "grid grid-cols-7", role: "grid", "aria-label": "Month view", children: days.map((day) => {
                    const inCurrentMonth = day.getMonth() === focusDate.getMonth();
                    const dayAppointments = appointments.filter((appt) => sameDay(new Date(appt.startsAt), day));
                    return (_jsxs("button", { type: "button", className: [
                            "min-h-24 border-b border-r border-[var(--z-border)] p-2 text-left z-hover-micro-subtle",
                            inCurrentMonth ? "bg-transparent" : "bg-black/10",
                            "hover:bg-white/[0.04]",
                        ].join(" "), onClick: () => onSelectDay(day), children: [_jsx("div", { className: [
                                    "text-xs",
                                    sameDay(day, today) ? "font-semibold text-[#00ff88]" : "text-[var(--z-fg)]",
                                ].join(" "), children: day.getDate() }), _jsx("div", { className: "mt-2 flex flex-wrap gap-1", children: dayAppointments.slice(0, 6).map((appt) => (_jsx("span", { className: "h-1.5 w-1.5 rounded-full", style: { backgroundColor: appt.color || "#22c55e" }, title: appt.title }, appt.id))) })] }, day.toISOString()));
                }) })] }));
}
