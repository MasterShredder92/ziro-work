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
function Bar({ pct }) {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    const tone = clamped >= 85
        ? "bg-red-500/70"
        : clamped >= 65
            ? "bg-amber-500/70"
            : "bg-[#00ff88]/70";
    return (_jsx("div", { className: "h-1.5 w-full rounded-full bg-[var(--z-surface-2)] overflow-hidden", children: _jsx("div", { className: `h-full ${tone}`, style: { width: `${clamped}%` } }) }));
}
export function AvailabilityPanel({ teachers, rooms, teacherAvailability, roomAvailability, }) {
    const teacherById = new Map();
    for (const t of teachers)
        teacherById.set(t.id, t);
    const roomById = new Map();
    for (const r of rooms)
        roomById.set(r.id, r);
    const sortedTeachers = [...teacherAvailability].sort((a, b) => b.utilizationPct - a.utilizationPct);
    const sortedRooms = [...roomAvailability].sort((a, b) => b.utilizationPct - a.utilizationPct);
    return (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("div", { className: "px-4 py-3 border-b border-[var(--z-border)] flex items-center justify-between", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Teacher availability" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [sortedTeachers.length, " teachers"] })] }), _jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: sortedTeachers.length === 0 ? (_jsx("li", { className: "px-4 py-6 text-sm text-[var(--z-muted)] text-center", children: "No teacher availability data" })) : (sortedTeachers.slice(0, 20).map((t) => (_jsxs("li", { className: "px-4 py-3 space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("div", { className: "text-sm font-medium text-[var(--z-fg)] truncate", children: teacherName(teacherById.get(t.teacherId)) }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [t.weeklyHours.toFixed(1), "h \u00B7 ", t.utilizationPct, "%"] })] }), _jsx(Bar, { pct: t.utilizationPct })] }, t.teacherId)))) })] }), _jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("div", { className: "px-4 py-3 border-b border-[var(--z-border)] flex items-center justify-between", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Room availability" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: [sortedRooms.length, " rooms"] })] }), _jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: sortedRooms.length === 0 ? (_jsx("li", { className: "px-4 py-6 text-sm text-[var(--z-muted)] text-center", children: "No room availability data" })) : (sortedRooms.slice(0, 20).map((r) => {
                            var _a;
                            const room = roomById.get(r.roomId);
                            const name = (_a = room === null || room === void 0 ? void 0 : room.name) !== null && _a !== void 0 ? _a : r.roomId;
                            const roomType = room === null || room === void 0 ? void 0 : room.room_type;
                            return (_jsxs("li", { className: "px-4 py-3 space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-medium text-[var(--z-fg)] truncate", children: name }), roomType ? (_jsx("div", { className: "text-[11px] text-[var(--z-muted)] truncate", children: roomType })) : null] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)] text-right shrink-0", children: [Math.round(r.totalMinutes / 60), "h \u00B7 ", r.utilizationPct, "%"] })] }), _jsx(Bar, { pct: r.utilizationPct })] }, r.roomId));
                        })) })] })] }));
}
