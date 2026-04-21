import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import Link from "next/link";
export function AssessmentList({ summaries, canWrite, }) {
    if (summaries.length === 0) {
        return (_jsxs("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]", children: ["No assessments yet. ", canWrite ? "Create your first quiz or exam to get started." : "Check back soon."] }));
    }
    return (_jsx("div", { className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3", children: summaries.map((s) => {
            const a = s.assessment;
            return (_jsxs(Link, { href: `/assessments/${a.id}`, className: "block rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 hover:border-[#00ff88]/40 hover:bg-[color-mix(in_oklab,var(--z-surface),var(--z-accent)_4%)] transition-colors", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)] truncate", children: a.title }), _jsxs("div", { className: "mt-1 text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: [a.kind, " \u00B7 ", a.status] })] }), _jsx(StatusPill, { status: a.status })] }), a.description ? (_jsx("p", { className: "mt-2 line-clamp-2 text-xs text-[var(--z-muted)]", children: a.description })) : null, _jsxs("div", { className: "mt-3 grid grid-cols-3 gap-2 text-[11px] text-[var(--z-muted)]", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase", children: "Questions" }), _jsx("div", { className: "text-[var(--z-fg)] font-semibold", children: s.questionCount })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase", children: "Rubric" }), _jsx("div", { className: "text-[var(--z-fg)] font-semibold", children: s.rubricCount })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase", children: "Attempts" }), _jsx("div", { className: "text-[var(--z-fg)] font-semibold", children: s.attemptCount })] })] }), s.averageScorePct != null ? (_jsxs("div", { className: "mt-3 text-xs text-[var(--z-muted)]", children: ["Avg score", " ", _jsxs("span", { className: "font-semibold text-[var(--z-fg)]", children: [s.averageScorePct, "%"] })] })) : null] }, a.id));
        }) }));
}
function StatusPill({ status }) {
    const color = status === "published"
        ? "text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/30"
        : status === "draft"
            ? "text-amber-300 bg-amber-400/10 border-amber-400/30"
            : "text-[var(--z-muted)] bg-white/5 border-[var(--z-border)]";
    return (_jsx("span", { className: `shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${color}`, children: status }));
}
