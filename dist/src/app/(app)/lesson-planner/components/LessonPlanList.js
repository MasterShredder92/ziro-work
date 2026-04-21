import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import Link from "next/link";
export function LessonPlanList({ summaries, canWrite, }) {
    if (summaries.length === 0) {
        return (_jsxs("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]", children: ["No lesson plans yet.", " ", canWrite
                    ? "Draft your first plan — try the AI draft panel to get started in seconds."
                    : "Check back once plans have been created."] }));
    }
    return (_jsx("div", { className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3", children: summaries.map((s) => {
            const plan = s.plan;
            return (_jsxs(Link, { href: `/lesson-planner/${plan.id}`, className: "block rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 hover:border-[#00ff88]/40 hover:bg-[color-mix(in_oklab,var(--z-surface),var(--z-accent)_4%)] transition-colors", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)] truncate", children: plan.title }), _jsxs("div", { className: "mt-1 text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: [plan.source === "ai_draft" ? "AI draft · " : "", plan.status, plan.grade_level ? ` · ${plan.grade_level}` : ""] })] }), _jsx(StatusPill, { status: plan.status })] }), plan.summary ? (_jsx("p", { className: "mt-2 line-clamp-2 text-xs text-[var(--z-muted)]", children: plan.summary })) : null, _jsxs("div", { className: "mt-3 grid grid-cols-4 gap-2 text-[11px] text-[var(--z-muted)]", children: [_jsx(Stat, { label: "Objectives", value: s.objectiveCount }), _jsx(Stat, { label: "Activities", value: s.activityCount }), _jsx(Stat, { label: "Materials", value: s.materialCount }), _jsx(Stat, { label: "Versions", value: s.versionCount })] }), s.hasAIDraft ? (_jsx("div", { className: "mt-3 text-[11px] text-[#00ff88]", children: "AI draft assisted" })) : null] }, plan.id));
        }) }));
}
function Stat({ label, value }) {
    return (_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase", children: label }), _jsx("div", { className: "text-[var(--z-fg)] font-semibold", children: value })] }));
}
function StatusPill({ status }) {
    const color = status === "published"
        ? "text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/30"
        : status === "ready"
            ? "text-sky-300 bg-sky-400/10 border-sky-400/30"
            : status === "archived"
                ? "text-[var(--z-muted)] bg-white/5 border-[var(--z-border)]"
                : "text-amber-300 bg-amber-400/10 border-amber-400/30";
    return (_jsx("span", { className: `shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${color}`, children: status }));
}
