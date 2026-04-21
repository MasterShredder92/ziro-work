import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
const RISK_STYLES = {
    none: { bg: "rgba(148,163,184,0.1)", fg: "#94a3b8", label: "none" },
    low: { bg: "rgba(34,197,94,0.1)", fg: "#22c55e", label: "low" },
    moderate: { bg: "rgba(250,204,21,0.12)", fg: "#facc15", label: "moderate" },
    high: { bg: "rgba(249,115,22,0.12)", fg: "#f97316", label: "high" },
    critical: { bg: "rgba(239,68,68,0.14)", fg: "#ef4444", label: "critical" },
};
function RiskPill({ level }) {
    var _a;
    const style = (_a = RISK_STYLES[level]) !== null && _a !== void 0 ? _a : RISK_STYLES.none;
    return (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider", style: { backgroundColor: style.bg, color: style.fg }, children: style.label }));
}
export function AttendanceStudentTable({ rows, emptyLabel, }) {
    if (rows.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: emptyLabel !== null && emptyLabel !== void 0 ? emptyLabel : "No students to display." }));
    }
    return (_jsx("div", { className: "overflow-x-auto rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-[color-mix(in_oklab,var(--z-surface-2),transparent_10%)]", children: _jsxs("tr", { className: "text-left text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: [_jsx("th", { className: "px-4 py-2", children: "Student" }), _jsx("th", { className: "px-4 py-2", children: "Rate" }), _jsx("th", { className: "px-4 py-2", children: "Punctual" }), _jsx("th", { className: "px-4 py-2", children: "Present" }), _jsx("th", { className: "px-4 py-2", children: "Tardy" }), _jsx("th", { className: "px-4 py-2", children: "Absent" }), _jsx("th", { className: "px-4 py-2", children: "Streak" }), _jsx("th", { className: "px-4 py-2", children: "Risk" }), _jsx("th", { className: "px-4 py-2", children: "Flags" }), _jsx("th", { className: "px-4 py-2" })] }) }), _jsx("tbody", { children: rows.map(({ student, summary }) => {
                        const s = student;
                        const name = [s.first_name, s.last_name].filter(Boolean).join(" ");
                        return (_jsxs("tr", { className: "border-t border-[var(--z-border)] hover:bg-white/5", children: [_jsx("td", { className: "px-4 py-2 text-[var(--z-fg)] font-medium", children: name || s.id }), _jsxs("td", { className: "px-4 py-2 text-[var(--z-fg)]", children: [summary.kpis.attendanceRate, "%"] }), _jsxs("td", { className: "px-4 py-2 text-[var(--z-fg)]", children: [summary.kpis.punctualityRate, "%"] }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: summary.kpis.presentCount }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: summary.kpis.tardyCount }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: summary.kpis.absentCount }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: summary.currentAbsentStreak > 0
                                        ? `-${summary.currentAbsentStreak}`
                                        : summary.currentPresentStreak > 0
                                            ? `+${summary.currentPresentStreak}`
                                            : "—" }), _jsx("td", { className: "px-4 py-2", children: _jsx(RiskPill, { level: summary.riskLevel }) }), _jsx("td", { className: "px-4 py-2 text-[11px] text-[var(--z-muted)]", children: summary.flags.length === 0
                                        ? "—"
                                        : summary.flags.slice(0, 3).join(", ") }), _jsx("td", { className: "px-4 py-2 text-right", children: _jsx(Link, { href: `/attendance/${s.id}`, className: "text-[#00ffd0] hover:underline text-xs font-semibold", children: "View \u2192" }) })] }, s.id));
                    }) })] }) }));
}
