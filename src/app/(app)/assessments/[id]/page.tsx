import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getAssessmentSurface } from "@/lib/assessments";
import { AssessmentDetail } from "../components";
import { resolveAssessmentsContext } from "../guard";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AssessmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  let ctx;
  try {
    ctx = await resolveAssessmentsContext();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">Forbidden</div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          You do not have permission to view this assessment.
        </div>
      </div>
    );
  }

  const surface = await getAssessmentSurface(id, ctx.tenantId);
  if (!surface) notFound();

  await logAudit("assessments.surface.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    assessmentId: id,
    source: "page",
  });

  return (
    <AssessmentDetail
      surface={surface}
      canWrite={ctx.canWrite}
      canRun={ctx.canRun}
    />
  );
}
