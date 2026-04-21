import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function formatTime(t) {
    if (!t)
        return "--";
    return t.slice(0, 5);
}
function formatDate(d) {
    if (!d)
        return "--";
    return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}
export function LocationSchedule({ blocks, title = "Upcoming schedule", maxRows = 20, }) {
    const rows = blocks.slice(0, maxRows);
    return (_jsxs("section", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: title }), _jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: [rows.length, " upcoming"] })] }), rows.length === 0 ? (_jsx("div", { className: "px-4 py-8 text-center text-sm text-[var(--z-muted)]", children: "No upcoming blocks for this location." })) : (_jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: rows.map((b) => {
                    var _a;
                    return (_jsxs("li", { className: "grid grid-cols-[120px_1fr_auto] items-center gap-3 px-4 py-2.5 text-sm", children: [_jsx("span", { className: "font-medium text-[var(--z-fg)]", children: formatDate(b.block_date) }), _jsxs("span", { className: "truncate text-[var(--z-fg)]", children: [(_a = b.block_type) !== null && _a !== void 0 ? _a : "Session", b.status ? ` · ${b.status}` : ""] }), _jsxs("span", { className: "shrink-0 text-xs text-[var(--z-muted)]", children: [formatTime(b.start_time), "\u2013", formatTime(b.end_time)] })] }, b.id));
                }) }))] }));
}
