import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { logAudit } from "@/lib/audit/log";
import { getAssessmentDashboard } from "@/lib/assessments";
import { AssessmentList } from "./components";
import { resolveAssessmentsContext } from "./guard";
export const dynamic = "force-dynamic";
function Stat({ label, value }) {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: label }), _jsx("div", { className: "mt-1 text-xl font-semibold text-[var(--z-fg)]", children: value })] }));
}
export default async function AssessmentsDashboardPage() {
    let ctx;
    try {
        ctx = await resolveAssessmentsContext();
    }
    catch (_a) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have permission to view assessments." })] }));
    }
    const data = await getAssessmentDashboard(ctx.tenantId);
    await logAudit("assessments.dashboard.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        total: data.kpis.totalAssessments,
        attempts: data.kpis.totalAttempts,
        source: "page",
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { id: "overview", className: "space-y-3 scroll-mt-24", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Assessments OS" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Quizzes, exams & rubrics" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Updated ", new Date(data.generatedAt).toLocaleTimeString()] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3", children: [_jsx(Stat, { label: "Assessments", value: String(data.kpis.totalAssessments) }), _jsx(Stat, { label: "Published", value: String(data.kpis.publishedCount) }), _jsx(Stat, { label: "Attempts", value: String(data.kpis.totalAttempts) }), _jsx(Stat, { label: "Completion", value: `${data.kpis.completionRatePct}%` }), _jsx(Stat, { label: "Avg score", value: `${data.kpis.averageScorePct}%` }), _jsx(Stat, { label: "Pass rate", value: `${data.kpis.passRatePct}%` })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 text-xs", children: [_jsx(Stat, { label: "Mastered", value: String(data.kpis.masteryDistribution.mastered) }), _jsx(Stat, { label: "Developing", value: String(data.kpis.masteryDistribution.developing) }), _jsx(Stat, { label: "Needs support", value: String(data.kpis.masteryDistribution.needsSupport) }), _jsx(Stat, { label: "Rubric aligned", value: `${data.kpis.rubricAlignmentPct}%` })] })] }), _jsxs("section", { id: "assessments", className: "space-y-3 scroll-mt-24", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Assessments" }), _jsx(AssessmentList, { summaries: data.assessments, canWrite: ctx.canWrite })] })] }));
}
