import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getLessonSurface } from "@/lib/curriculum";
import { LessonDetail } from "../../components";
import { resolveCurriculumContext } from "../../guard";

export const dynamic = "force-dynamic";

type Params = { lessonId: string };

export default async function CurriculumLessonPage({
  params,
}: {
  params: Promise<Params>;
}) {
  let ctx;
  try {
    ctx = await resolveCurriculumContext();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
      </div>
    );
  }

  const { lessonId } = await params;
  const surface = await getLessonSurface(lessonId, ctx.tenantId);
  if (!surface) notFound();

  await logAudit("curriculum.lesson.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    lessonId,
    programId: surface.program?.id ?? null,
  });

  return <LessonDetail surface={surface} />;
}
