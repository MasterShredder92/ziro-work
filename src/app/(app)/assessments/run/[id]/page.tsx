import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getAssessmentSurface } from "@/lib/assessments";
import { AssessmentRunner } from "../../components";
import { resolveAssessmentsContext } from "../../guard";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AssessmentRunnerPage({ params }: PageProps) {
  const { id } = await params;
  let ctx;
  try {
    ctx = await resolveAssessmentsContext({ requireRun: true });
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">Forbidden</div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          You cannot run assessments.
        </div>
      </div>
    );
  }

  const surface = await getAssessmentSurface(id, ctx.tenantId);
  if (!surface) notFound();

  await logAudit("assessments.runner.open", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    assessmentId: id,
    source: "page",
  });

  return <AssessmentRunner surface={surface} studentId={ctx.session.userId} />;
}
