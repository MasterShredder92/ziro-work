import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getProgramSurface } from "@/lib/curriculum";
import { ProgramDetail } from "../components";
import { resolveCurriculumContext } from "../guard";

export const dynamic = "force-dynamic";

type Params = { programId: string };

export default async function CurriculumProgramPage({
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

  const { programId } = await params;
  const surface = await getProgramSurface(programId, ctx.tenantId);
  if (!surface) notFound();

  await logAudit("curriculum.program.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    programId,
  });

  return <ProgramDetail surface={surface} />;
}
