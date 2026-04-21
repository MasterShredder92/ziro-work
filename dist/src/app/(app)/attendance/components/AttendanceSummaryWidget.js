import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
const RISK_COLOR = {
    none: "#94a3b8",
    low: "#22c55e",
    moderate: "#facc15",
    high: "#f97316",
    critical: "#ef4444",
};
/**
 * Compact, read-only attendance summary. Safe to embed in any surface:
 * - Student profile
 * - Progress surface
 * - Family + Student portals
 */
export function AttendanceSummaryWidget({ summary, studentId, detailHref, className, }) {
    var _a;
    const href = detailHref !== null && detailHref !== void 0 ? detailHref : (studentId ? `/attendance/${studentId}` : null);
    const riskColor = (_a = RISK_COLOR[summary.riskLevel]) !== null && _a !== void 0 ? _a : RISK_COLOR.none;
    return (_jsxs("div", { className: `rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3 ${className !== null && className !== void 0 ? className : ""}`, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Attendance" }), _jsx("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider", style: {
                            backgroundColor: `${riskColor}22`,
                            color: riskColor,
                        }, children: summary.riskLevel })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] text-[var(--z-muted)] uppercase tracking-wider", children: "Rate" }), _jsxs("div", { className: "text-xl font-semibold text-[var(--z-fg)]", children: [summary.kpis.attendanceRate, "%"] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] text-[var(--z-muted)] uppercase tracking-wider", children: "Punctual" }), _jsxs("div", { className: "text-xl font-semibold text-[var(--z-fg)]", children: [summary.kpis.punctualityRate, "%"] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] text-[var(--z-muted)] uppercase tracking-wider", children: "Streak" }), _jsx("div", { className: "text-xl font-semibold text-[var(--z-fg)]", children: summary.currentAbsentStreak > 0
                                    ? `-${summary.currentAbsentStreak}`
                                    : summary.currentPresentStreak > 0
                                        ? `+${summary.currentPresentStreak}`
                                        : "—" })] })] }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: summary.flags.length === 0 ? (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "No flags" })) : (summary.flags.map((f) => (_jsx("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-[var(--z-muted)] border border-[var(--z-border)]", children: f.replaceAll("_", " ") }, f)))) }), href ? (_jsx(Link, { href: href, className: "inline-block text-xs font-semibold text-[#00ffd0] hover:underline", children: "View attendance \u2192" })) : null] }));
}
