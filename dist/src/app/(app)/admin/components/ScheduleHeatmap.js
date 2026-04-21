import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function formatHour(h) {
    const am = h < 12;
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}${am ? "a" : "p"}`;
}
function intensityColor(ratio) {
    if (ratio <= 0)
        return "transparent";
    const alpha = Math.min(0.85, 0.15 + ratio * 0.7);
    return `color-mix(in oklab, var(--z-accent), transparent ${Math.round((1 - alpha) * 100)}%)`;
}
export function ScheduleHeatmap({ cells, startHour = 8, endHour = 21, }) {
    const map = new Map();
    for (const c of cells)
        map.set(`${c.day}:${c.hour}`, c.count);
    const max = cells.reduce((m, c) => (c.count > m ? c.count : m), 0);
    const hours = [];
    for (let h = startHour; h <= endHour; h += 1)
        hours.push(h);
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Schedule heatmap" }), _jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "Lessons by weekday and hour" })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-[var(--z-muted)]", children: [_jsx("span", { children: "Less" }), _jsx("div", { className: "flex gap-1", children: [0.15, 0.35, 0.55, 0.75, 0.95].map((r) => (_jsx("span", { className: "h-3 w-3 rounded-sm border border-[var(--z-border)]", style: { backgroundColor: intensityColor(r) } }, r))) }), _jsx("span", { children: "More" })] })] }), _jsx("div", { className: "mt-5 overflow-x-auto", children: _jsxs("div", { className: "grid gap-1 text-[11px]", style: {
                        gridTemplateColumns: `64px repeat(${hours.length}, minmax(24px, 1fr))`,
                    }, children: [_jsx("div", {}), hours.map((h) => (_jsx("div", { className: "text-center text-[var(--z-muted)]", children: formatHour(h) }, `h-${h}`))), DAYS.map((label, dayIdx) => (_jsxs("div", { className: "contents", children: [_jsx("div", { className: "flex items-center text-[var(--z-muted)]", children: label }), hours.map((h) => {
                                    var _a;
                                    const count = (_a = map.get(`${dayIdx}:${h}`)) !== null && _a !== void 0 ? _a : 0;
                                    const ratio = max > 0 ? count / max : 0;
                                    return (_jsx("div", { className: "flex aspect-square items-center justify-center rounded-sm border border-[var(--z-border)] text-[10px] text-[var(--z-fg)]", style: { backgroundColor: intensityColor(ratio) }, title: `${label} ${formatHour(h)} — ${count} lessons`, children: count > 0 ? count : "" }, `c-${dayIdx}-${h}`));
                                })] }, `row-${dayIdx}`)))] }) })] }));
}
