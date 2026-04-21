import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function studentName(s) {
    var _a, _b, _c;
    const row = s;
    const first = (_a = row["first_name"]) !== null && _a !== void 0 ? _a : "";
    const last = (_b = row["last_name"]) !== null && _b !== void 0 ? _b : "";
    const name = `${first} ${last}`.trim();
    if (name)
        return name;
    const preferred = (_c = row["preferred_name"]) !== null && _c !== void 0 ? _c : "";
    return preferred || s.id;
}
function studentInstrument(s) {
    var _a;
    const row = s;
    return (_a = row["instrument"]) !== null && _a !== void 0 ? _a : "--";
}
function studentInitials(s) {
    var _a, _b, _c, _d;
    const row = s;
    const first = (_a = row["first_name"]) !== null && _a !== void 0 ? _a : "";
    const last = (_b = row["last_name"]) !== null && _b !== void 0 ? _b : "";
    const initials = ((_c = first[0]) !== null && _c !== void 0 ? _c : "") + ((_d = last[0]) !== null && _d !== void 0 ? _d : "");
    return initials.toUpperCase() || "S";
}
export function StudentList({ students, title = "Students", maxRows = 25, }) {
    const rows = students.slice(0, maxRows);
    return (_jsxs("section", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: title }), _jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: [students.length, " total"] })] }), rows.length === 0 ? (_jsx("div", { className: "px-4 py-8 text-center text-sm text-[var(--z-muted)]", children: "No students assigned." })) : (_jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: rows.map((s) => {
                    var _a;
                    return (_jsxs("li", { className: "flex items-center justify-between gap-3 px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-[var(--z-fg)]", children: studentInitials(s) }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-sm font-medium text-[var(--z-fg)]", children: studentName(s) }), _jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: [studentInstrument(s), s
                                                        .enrollment_type
                                                        ? ` · ${s.enrollment_type}`
                                                        : ""] })] })] }), _jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : s.status === "inactive"
                                        ? "bg-red-500/10 text-red-400"
                                        : "bg-white/[0.05] text-[var(--z-fg)]"}`, children: (_a = s.status) !== null && _a !== void 0 ? _a : "unknown" })] }, s.id));
                }) })), students.length > rows.length ? (_jsxs("div", { className: "border-t border-[var(--z-border)] px-4 py-2 text-xs text-[var(--z-muted)]", children: ["Showing ", rows.length, " of ", students.length] })) : null] }));
}
