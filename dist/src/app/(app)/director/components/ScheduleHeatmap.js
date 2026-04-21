import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment } from "react";
import { Card } from "@/components/ui/Card";
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);
function hourLabel(hour) {
    const suffix = hour >= 12 ? "p" : "a";
    const h = ((hour + 11) % 12) + 1;
    return `${h}${suffix}`;
}
export function ScheduleHeatmap({ schedule }) {
    const cellMap = new Map();
    let max = 0;
    for (const cell of schedule.heatmap) {
        cellMap.set(`${cell.dayOfWeek}:${cell.hour}`, cell.count);
        if (cell.count > max)
            max = cell.count;
    }
    const denom = Math.max(1, max);
    const peakLabel = schedule.peakDayOfWeek != null && schedule.peakHour != null
        ? `${DAY_LABELS[schedule.peakDayOfWeek]} ${hourLabel(schedule.peakHour)}`
        : "—";
    return (_jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Schedule heatmap" }), _jsx("div", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Lesson density" })] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Peak: ", _jsx("span", { className: "text-[var(--z-fg)] font-medium", children: peakLabel })] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("div", { className: "grid gap-1 min-w-[640px]", style: {
                        gridTemplateColumns: `48px repeat(${HOURS.length}, minmax(28px, 1fr))`,
                    }, children: [_jsx("div", {}), HOURS.map((h) => (_jsx("div", { className: "text-[10px] text-center text-[var(--z-muted)] uppercase tracking-wider", children: hourLabel(h) }, `head-${h}`))), DAY_LABELS.map((dayLabel, day) => (_jsxs(Fragment, { children: [_jsx("div", { className: "text-[11px] font-semibold text-[var(--z-muted)] uppercase tracking-wider flex items-center", children: dayLabel }), HOURS.map((h) => {
                                    var _a;
                                    const count = (_a = cellMap.get(`${day}:${h}`)) !== null && _a !== void 0 ? _a : 0;
                                    const intensity = count === 0 ? 0 : 0.15 + (count / denom) * 0.85;
                                    return (_jsx("div", { title: `${dayLabel} ${hourLabel(h)} · ${count} lesson${count === 1 ? "" : "s"}`, className: "h-7 rounded-sm border border-[var(--z-border)] transition-colors", style: {
                                            backgroundColor: count === 0
                                                ? "color-mix(in oklab, var(--z-surface), transparent 60%)"
                                                : `color-mix(in oklab, #00ff88, transparent ${Math.round((1 - intensity) * 100)}%)`,
                                        } }, `cell-${day}-${h}`));
                                })] }, `row-${day}`)))] }) }), _jsxs("div", { className: "mt-3 flex items-center gap-2 text-[11px] text-[var(--z-muted)]", children: [_jsx("span", { children: "Less" }), [0.2, 0.4, 0.6, 0.8, 1].map((v) => (_jsx("span", { className: "h-3 w-5 rounded-sm border border-[var(--z-border)]", style: {
                            backgroundColor: `color-mix(in oklab, #00ff88, transparent ${Math.round((1 - v) * 100)}%)`,
                        } }, v))), _jsx("span", { children: "More" }), _jsxs("span", { className: "ml-auto", children: [schedule.blocks.length, " blocks \u00B7 ", schedule.startDate, " \u2192 ", schedule.endDate] })] })] }));
}
