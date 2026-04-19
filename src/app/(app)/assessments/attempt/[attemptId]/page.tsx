import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getAssessmentAttemptSurface } from "@/lib/assessments";
import { AttemptDetail } from "../../components";
import { resolveAssessmentsContext } from "../../guard";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ attemptId: string }> };

export default async function AttemptReviewPage({ params }: PageProps) {
  const { attemptId } = await params;
  let ctx;
  try {
    ctx = await resolveAssessmentsContext();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">Forbidden</div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          You do not have permission to view this attempt.
        </div>
      </div>
    );
  }

  const surface = await getAssessmentAttemptSurface(attemptId, ctx.tenantId);
  if (!surface) notFound();

  await logAudit("assessments.attempt.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    attemptId,
    assessmentId: surface.attempt.assessment_id,
    source: "page",
  });

  return <AttemptDetail surface={surface} canGrade={ctx.canGrade} />;
}
