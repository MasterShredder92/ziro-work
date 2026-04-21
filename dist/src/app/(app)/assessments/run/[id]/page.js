import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getAssessmentSurface } from "@/lib/assessments";
import { AssessmentRunner } from "../../components";
import { resolveAssessmentsContext } from "../../guard";
export const dynamic = "force-dynamic";
export default async function AssessmentRunnerPage({ params }) {
    const { id } = await params;
    let ctx;
    try {
        ctx = await resolveAssessmentsContext({ requireRun: true });
    }
    catch (_a) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You cannot run assessments." })] }));
    }
    const surface = await getAssessmentSurface(id, ctx.tenantId);
    if (!surface)
        notFound();
    await logAudit("assessments.runner.open", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        assessmentId: id,
        source: "page",
    });
    return _jsx(AssessmentRunner, { surface: surface, studentId: ctx.session.userId });
}
