import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Link from "next/link";
function name(student) {
    var _a;
    const row = student;
    const first = typeof row["first_name"] === "string" ? row["first_name"] : "";
    const last = typeof row["last_name"] === "string" ? row["last_name"] : "";
    const full = `${first} ${last}`.trim();
    return full.length > 0 ? full : ((_a = student.id.slice(0, 8)) !== null && _a !== void 0 ? _a : "Student");
}
function instrument(student) {
    const row = student;
    const val = row["instrument"];
    return typeof val === "string" ? val : null;
}
export function StudentSelector({ students, summaries, selectedStudentId, }) {
    const summaryMap = new Map(summaries.map((s) => [s.studentId, s]));
    if (students.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)] text-center", children: "No students found for this workspace yet." }));
    }
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "border-b border-[var(--z-border)] px-4 py-3 flex items-center justify-between", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Students" }), _jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: [students.length, " total"] })] }), _jsx("ul", { className: "divide-y divide-[var(--z-border)] max-h-[520px] overflow-y-auto", children: students.slice(0, 200).map((student) => {
                    var _a;
                    const summary = summaryMap.get(student.id);
                    const href = `/progress/${student.id}`;
                    const isSelected = selectedStudentId === student.id;
                    return (_jsx("li", { className: `px-4 py-3 ${isSelected ? "bg-[#00ff88]/10" : ""}`, children: _jsxs(Link, { href: href, className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-sm font-medium text-[var(--z-fg)]", children: name(student) }), _jsx("div", { className: "truncate text-xs text-[var(--z-muted)]", children: (_a = instrument(student)) !== null && _a !== void 0 ? _a : "—" })] }), _jsx("div", { className: "flex items-center gap-3 shrink-0 text-xs text-[var(--z-muted)]", children: summary ? (_jsxs(_Fragment, { children: [_jsxs("span", { title: "Goals completed", children: [summary.kpis.goalsCompleted, "/", summary.kpis.totalGoals, " ", "goals"] }), _jsxs("span", { title: "Skills mastered", children: [summary.kpis.skillsMastered, "/", summary.kpis.totalSkills, " ", "skills"] })] })) : (_jsx("span", { children: "\u2014" })) })] }) }, student.id));
                }) })] }));
}
