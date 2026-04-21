import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getAssessmentAttemptSurface } from "@/lib/assessments";
import { AttemptDetail } from "../../components";
import { resolveAssessmentsContext } from "../../guard";
export const dynamic = "force-dynamic";
export default async function AttemptReviewPage({ params }) {
    const { attemptId } = await params;
    let ctx;
    try {
        ctx = await resolveAssessmentsContext();
    }
    catch (_a) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You do not have permission to view this attempt." })] }));
    }
    const surface = await getAssessmentAttemptSurface(attemptId, ctx.tenantId);
    if (!surface)
        notFound();
    await logAudit("assessments.attempt.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        attemptId,
        assessmentId: surface.attempt.assessment_id,
        source: "page",
    });
    return _jsx(AttemptDetail, { surface: surface, canGrade: ctx.canGrade });
}
