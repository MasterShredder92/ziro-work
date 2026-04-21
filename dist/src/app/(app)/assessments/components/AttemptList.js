import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
export function AttemptList({ attempts, canGrade, }) {
    if (attempts.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]", children: "No attempts yet." }));
    }
    return (_jsx("div", { className: "overflow-x-auto rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-[var(--z-border)] text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: [_jsx("th", { className: "px-3 py-2", children: "Student" }), _jsx("th", { className: "px-3 py-2", children: "Status" }), _jsx("th", { className: "px-3 py-2 text-right", children: "Score" }), _jsx("th", { className: "px-3 py-2", children: "Submitted" }), _jsx("th", { className: "px-3 py-2 text-right", children: "Actions" })] }) }), _jsx("tbody", { children: attempts.map((att) => {
                        var _a;
                        const pct = att.max_score && att.score != null
                            ? Math.round((((_a = att.score) !== null && _a !== void 0 ? _a : 0) / att.max_score) * 100)
                            : null;
                        return (_jsxs("tr", { className: "border-b border-[var(--z-border)] last:border-b-0", children: [_jsx("td", { className: "px-3 py-2 font-medium text-[var(--z-fg)] truncate max-w-[180px]", children: att.student_id }), _jsx("td", { className: "px-3 py-2 text-[var(--z-muted)]", children: att.status }), _jsx("td", { className: "px-3 py-2 text-right text-[var(--z-fg)]", children: pct != null ? `${pct}%` : "—" }), _jsx("td", { className: "px-3 py-2 text-[var(--z-muted)]", children: att.submitted_at
                                        ? new Date(att.submitted_at).toLocaleString()
                                        : "—" }), _jsx("td", { className: "px-3 py-2 text-right", children: _jsx(Link, { href: `/assessments/attempt/${att.id}`, className: "text-xs font-semibold text-[#00ff88] hover:underline", children: canGrade ? "Grade" : "View" }) })] }, att.id));
                    }) })] }) }));
}
