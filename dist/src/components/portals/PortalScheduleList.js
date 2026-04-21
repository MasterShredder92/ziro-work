"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { EmptyState } from "@/components/system/SurfaceStates";
import { normalizeSchedulingStatus, statusBadgeClass } from "@/lib/scheduling/colorSemantics";
function formatDateLabel(date) {
    if (!date)
        return "--";
    const d = new Date(`${date}T00:00:00`);
    if (!Number.isFinite(d.getTime()))
        return "--";
    return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}
function formatTime(value) {
    if (!value)
        return "--";
    return value.slice(0, 5);
}
function isToday(date) {
    if (!date)
        return false;
    return date === new Date().toISOString().slice(0, 10);
}
export function PortalScheduleList({ rows, title = "Schedule", maxRows = 20, emptyLabel = "No scheduled blocks.", onlyToday = false, }) {
    const filtered = onlyToday ? rows.filter((row) => isToday(row.blockDate)) : rows;
    const data = [...filtered]
        .sort((a, b) => {
        var _a, _b, _c, _d;
        const ad = (_a = a.blockDate) !== null && _a !== void 0 ? _a : "";
        const bd = (_b = b.blockDate) !== null && _b !== void 0 ? _b : "";
        if (ad !== bd)
            return ad.localeCompare(bd);
        const at = (_c = a.startTime) !== null && _c !== void 0 ? _c : "";
        const bt = (_d = b.startTime) !== null && _d !== void 0 ? _d : "";
        return at.localeCompare(bt);
    })
        .slice(0, maxRows);
    return (_jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: title }), _jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: [data.length, " ", data.length === 1 ? "block" : "blocks"] })] }), data.length === 0 ? (_jsx("div", { className: "p-4", children: _jsx(EmptyState, { title: emptyLabel, description: "New scheduling updates will appear here." }) })) : (_jsx("ul", { className: "divide-y divide-[var(--z-border)]", role: "list", children: data.map((row) => {
                    var _a, _b;
                    return (_jsxs("li", { className: "flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between z-hover-micro-subtle", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "text-sm font-medium text-[var(--z-fg)]", children: [formatDateLabel(row.blockDate), _jsx("span", { className: "mx-2 text-[var(--z-muted)]", children: "\u00B7" }), formatTime(row.startTime), " - ", formatTime(row.endTime)] }), _jsxs("div", { className: "truncate text-xs text-[var(--z-muted)]", children: [(_b = (_a = row.subject) !== null && _a !== void 0 ? _a : row.blockType) !== null && _b !== void 0 ? _b : "lesson", row.subject && row.blockType ? ` · ${row.blockType}` : "", row.room ? ` · Room ${row.room}` : "", row.isVirtual ? " · Virtual" : ""] })] }), _jsx("span", { className: `inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusBadgeClass(row.status)}`, children: normalizeSchedulingStatus(row.status) })] }, row.id));
                }) }))] }));
}
