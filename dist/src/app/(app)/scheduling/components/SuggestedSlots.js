import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function teacherName(teacher) {
    var _a, _b;
    if (!teacher)
        return "Teacher";
    const t = teacher;
    return (t.display_name ||
        `${(_a = t.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = t.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() ||
        "Teacher");
}
export function SuggestedSlots({ suggestions, teachers, rooms, limit = 12, }) {
    const teacherById = new Map();
    for (const t of teachers)
        teacherById.set(t.id, t);
    const roomById = new Map();
    for (const r of rooms)
        roomById.set(r.id, r);
    if (!suggestions || suggestions.length === 0) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "No suggested slots" }), _jsx("div", { className: "mt-1 text-xs text-[var(--z-muted)]", children: "Try a different window or widen your criteria." })] }));
    }
    const rows = suggestions.slice(0, limit);
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b border-[var(--z-border)]", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Suggested slots" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Top ", rows.length, " of ", suggestions.length] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3", children: rows.map((s, idx) => {
                    var _a;
                    const teacher = teacherById.get(s.teacherId);
                    const room = s.roomId ? roomById.get(s.roomId) : null;
                    return (_jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3 flex flex-col gap-2", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)] truncate", children: teacherName(teacher) }), _jsx("div", { className: "text-[11px] text-[var(--z-muted)] truncate", children: (_a = room === null || room === void 0 ? void 0 : room.name) !== null && _a !== void 0 ? _a : (s.roomId ? s.roomId : "Any room") })] }), _jsx("span", { className: "inline-flex items-center rounded-full border border-[#00ff88]/30 bg-[#00ff88]/10 px-2 py-0.5 text-[10px] font-semibold text-[#00ff88]", children: s.score })] }), _jsxs("div", { className: "text-xs text-[var(--z-fg)]", children: [s.blockDate, " \u00B7 ", s.startTime.slice(0, 5), "\u2013", s.endTime.slice(0, 5), " \u00B7 ", s.durationMinutes, "m"] }), _jsx("div", { className: "text-[11px] text-[var(--z-muted)]", children: s.rationale })] }, `${s.teacherId}-${s.blockDate}-${s.startTime}-${idx}`));
                }) })] }));
}
