import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function formatDateLabel(date) {
    if (!date)
        return "--";
    const d = new Date(`${date}T00:00:00`);
    return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
function studentLookup(students) {
    const map = new Map();
    if (!students)
        return map;
    for (const s of students)
        map.set(s.id, s);
    return map;
}
function studentName(s) {
    var _a, _b, _c;
    if (!s)
        return "Student";
    const row = s;
    const first = (_a = row["first_name"]) !== null && _a !== void 0 ? _a : "";
    const last = (_b = row["last_name"]) !== null && _b !== void 0 ? _b : "";
    const name = `${first} ${last}`.trim();
    if (name)
        return name;
    return (_c = row["preferred_name"]) !== null && _c !== void 0 ? _c : s.id;
}
export function LessonNotesList({ lessons, students, title = "Recent Lesson Notes", maxRows = 10, }) {
    const rows = lessons.slice(0, maxRows);
    const index = studentLookup(students);
    return (_jsxs("section", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: title }), _jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: [rows.length, " ", rows.length === 1 ? "entry" : "entries"] })] }), rows.length === 0 ? (_jsx("div", { className: "px-4 py-8 text-center text-sm text-[var(--z-muted)]", children: "No lesson notes yet." })) : (_jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: rows.map((l) => {
                    var _a, _b, _c, _d, _e;
                    const student = l.student_id ? index.get(l.student_id) : undefined;
                    const note = (_c = (_b = (_a = l["lesson_notes"]) !== null && _a !== void 0 ? _a : l["teacher_note"]) !== null && _b !== void 0 ? _b : l["ai_summary"]) !== null && _c !== void 0 ? _c : "";
                    const workedOn = (_d = l["worked_on"]) !== null && _d !== void 0 ? _d : [];
                    return (_jsxs("li", { className: "flex flex-col gap-2 px-4 py-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-sm font-medium text-[var(--z-fg)]", children: studentName(student) }), _jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: [formatDateLabel(l.block_date), l.instrument ? ` · ${l.instrument}` : "", typeof l.engagement_level === "number"
                                                        ? ` · Engagement ${l.engagement_level}/5`
                                                        : ""] })] }), _jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${l.status === "completed"
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : l.status === "missed"
                                                ? "bg-red-500/10 text-red-400"
                                                : "bg-white/[0.05] text-[var(--z-fg)]"}`, children: (_e = l.status) !== null && _e !== void 0 ? _e : "logged" })] }), note ? (_jsx("p", { className: "text-sm text-[var(--z-fg)]/90 whitespace-pre-wrap", children: note })) : null, workedOn.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-1", children: workedOn.map((tag, i) => (_jsx("span", { className: "rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-[var(--z-fg)]/80", children: tag }, `${l.id}-wo-${i}`))) })) : null] }, l.id));
                }) }))] }));
}
