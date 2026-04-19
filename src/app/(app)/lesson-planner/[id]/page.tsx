import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getLessonPlanSurface } from "@/lib/lessonPlanner";
import { AIDraftPanel, LessonPlanDetail } from "../components";
import { resolveLessonPlannerContext } from "../guard";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function LessonPlanDetailPage({ params }: PageProps) {
  const { id } = await params;
  let ctx;
  try {
    ctx = await resolveLessonPlannerContext();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          You do not have permission to view this lesson plan.
        </div>
      </div>
    );
  }

  const surface = await getLessonPlanSurface(id, ctx.tenantId);
  if (!surface) notFound();

  await logAudit("lessonPlanner.surface.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    planId: id,
    source: "page",
  });

  return (
    <div className="space-y-6">
      <LessonPlanDetail surface={surface} />
      <section id="ai-draft" className="space-y-3 scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          AI draft
        </h2>
        <AIDraftPanel
          tenantId={ctx.tenantId}
          plan={surface.plan}
          canWrite={ctx.canWrite}
        />
      </section>
    </div>
  );
}
