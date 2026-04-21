import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { AttemptList } from "@/app/(app)/assessments/components";
export function AssessmentsSection({ summary, canRun = true, }) {
    const { totals, attempts } = summary;
    return (_jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [_jsx(Stat, { label: "Attempts", value: String(totals.totalAttempts) }), _jsx(Stat, { label: "Completed", value: String(totals.completed) }), _jsx(Stat, { label: "Average score", value: totals.totalAttempts > 0
                            ? `${totals.averageScorePct}%`
                            : "—" }), _jsx(Stat, { label: "Pass rate", value: totals.totalAttempts > 0 ? `${totals.passRatePct}%` : "—", accent: "text-[#00ff88]" })] }), _jsxs("div", { className: "flex items-center justify-between rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-2", children: [_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: canRun
                            ? "Ready to take an assessment? Browse the library to get started."
                            : "Viewing mode — contact your teacher to take an assessment." }), _jsx(Link, { href: "/assessments", className: "rounded-md border border-[#00ff88]/30 bg-[#00ff88]/10 px-3 py-1 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/20", children: "Browse" })] }), _jsx(AttemptList, { attempts: attempts.slice(0, 10), canGrade: false })] }));
}
function Stat({ label, value, accent, }) {
    return (_jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: `text-base font-semibold ${accent !== null && accent !== void 0 ? accent : "text-[var(--z-fg)]"}`, children: value })] }));
}
