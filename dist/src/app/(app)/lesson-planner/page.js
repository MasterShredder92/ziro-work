import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { logAudit } from "@/lib/audit/log";
import { getLessonPlannerDashboard } from "@/lib/lessonPlanner";
import { AIDraftPanel, LessonPlanList } from "./components";
import { resolveLessonPlannerContext } from "./guard";
export const dynamic = "force-dynamic";
function Stat({ label, value }) {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: label }), _jsx("div", { className: "mt-1 text-xl font-semibold text-[var(--z-fg)]", children: value })] }));
}
export default async function LessonPlannerDashboardPage() {
    let ctx;
    try {
        ctx = await resolveLessonPlannerContext();
    }
    catch (_a) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have permission to view the lesson planner." })] }));
    }
    const data = await getLessonPlannerDashboard(ctx.tenantId);
    await logAudit("lessonPlanner.dashboard.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        total: data.kpis.totalPlans,
        aiDraftsLast30d: data.kpis.aiDraftsLast30d,
        source: "page",
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { id: "overview", className: "space-y-3 scroll-mt-24", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Lesson Planner OS" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Objectives, activities, materials & AI drafts" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Updated ", new Date(data.generatedAt).toLocaleTimeString()] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3", children: [_jsx(Stat, { label: "Plans", value: String(data.kpis.totalPlans) }), _jsx(Stat, { label: "Updated 7d", value: String(data.kpis.plansUpdatedLast7d) }), _jsx(Stat, { label: "AI drafts 30d", value: String(data.kpis.aiDraftsLast30d) }), _jsx(Stat, { label: "AI usage", value: `${data.kpis.aiDraftUsagePct}%` }), _jsx(Stat, { label: "Alignment", value: `${data.kpis.curriculumAlignmentPct}%` }), _jsx(Stat, { label: "Materials/plan", value: String(data.kpis.materialsLinkedPerPlan) })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 text-xs", children: [_jsx(Stat, { label: "Draft", value: String(data.kpis.statusBreakdown.draft) }), _jsx(Stat, { label: "Ready", value: String(data.kpis.statusBreakdown.ready) }), _jsx(Stat, { label: "Published", value: String(data.kpis.statusBreakdown.published) }), _jsx(Stat, { label: "Archived", value: String(data.kpis.statusBreakdown.archived) })] })] }), _jsxs("section", { id: "plans", className: "space-y-3 scroll-mt-24", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Lesson plans" }), _jsx(LessonPlanList, { summaries: data.plans, canWrite: ctx.canWrite })] }), _jsxs("section", { id: "ai-draft", className: "space-y-3 scroll-mt-24", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "AI draft" }), _jsx(AIDraftPanel, { tenantId: ctx.tenantId, canWrite: ctx.canWrite })] })] }));
}
