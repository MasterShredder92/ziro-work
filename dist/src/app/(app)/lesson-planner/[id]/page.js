import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getLessonPlanSurface } from "@/lib/lessonPlanner";
import { AIDraftPanel, LessonPlanDetail } from "../components";
import { resolveLessonPlannerContext } from "../guard";
export const dynamic = "force-dynamic";
export default async function LessonPlanDetailPage({ params }) {
    const { id } = await params;
    let ctx;
    try {
        ctx = await resolveLessonPlannerContext();
    }
    catch (_a) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have permission to view this lesson plan." })] }));
    }
    const surface = await getLessonPlanSurface(id, ctx.tenantId);
    if (!surface)
        notFound();
    await logAudit("lessonPlanner.surface.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        planId: id,
        source: "page",
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(LessonPlanDetail, { surface: surface }), _jsxs("section", { id: "ai-draft", className: "space-y-3 scroll-mt-24", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "AI draft" }), _jsx(AIDraftPanel, { tenantId: ctx.tenantId, plan: surface.plan, canWrite: ctx.canWrite })] })] }));
}
