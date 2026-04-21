import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function StudentList({ students, title = "Students", maxRows = 25, }) {
    const rows = students.slice(0, maxRows);
    return (_jsxs("section", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: title }), _jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: [students.length, " total"] })] }), rows.length === 0 ? (_jsx("div", { className: "px-4 py-8 text-center text-sm text-[var(--z-muted)]", children: "No students on this family account yet." })) : (_jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: rows.map((s) => {
                    var _a, _b;
                    return (_jsxs("li", { className: "flex items-center justify-between gap-3 px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-[var(--z-fg)]", children: s.initials }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-sm font-medium text-[var(--z-fg)]", children: s.display_name }), _jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: [(_a = s.instrument) !== null && _a !== void 0 ? _a : "Instrument TBD", s.teacher_name ? ` · ${s.teacher_name}` : "", s.enrollment_type ? ` · ${s.enrollment_type}` : ""] })] })] }), _jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : s.status === "inactive"
                                        ? "bg-red-500/10 text-red-400"
                                        : "bg-white/[0.05] text-[var(--z-fg)]"}`, children: (_b = s.status) !== null && _b !== void 0 ? _b : "unknown" })] }, s.id));
                }) })), students.length > rows.length ? (_jsxs("div", { className: "border-t border-[var(--z-border)] px-4 py-2 text-xs text-[var(--z-muted)]", children: ["Showing ", rows.length, " of ", students.length] })) : null] }));
}
