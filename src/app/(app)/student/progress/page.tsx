import { logAudit } from "@/lib/audit/log";
import { getProgressSurface } from "@/lib/progress/service";
import { resolveStudentContext } from "../guard";
import {
  CheckpointList,
  EvidenceList,
  GoalList,
  ProgressSummary,
  SkillList,
} from "../../progress/components";

export const dynamic = "force-dynamic";

export default async function StudentProgressPage() {
  let ctx;
  try {
    ctx = await resolveStudentContext();
  } catch {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        Your progress isn&apos;t available right now. Please contact your
        administrator.
      </div>
    );
  }

  const surface = await getProgressSurface(ctx.studentId, ctx.tenantId);

  await logAudit("progress.surface.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    studentId: ctx.studentId,
    source: "student_portal",
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">My progress</h1>
        <p className="text-sm text-[var(--z-muted)]">
          Track your goals, skills, and teacher feedback over time.
        </p>
      </header>

      <ProgressSummary kpis={surface.kpis} title="Snapshot" />

      {surface.goals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)] text-center">
          No goals have been set for you yet. Check back soon!
        </div>
      ) : null}

      <div className="space-y-6">
        {surface.goals.map((goal) => (
          <article
            key={goal.id}
            className="rounded-lg border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_4%)] p-4 space-y-4"
          >
            <header>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#00ff88]">
                Goal · {goal.status}
              </div>
              <h2 className="mt-0.5 text-lg font-semibold text-[var(--z-fg)]">
                {goal.title}
              </h2>
              {goal.description ? (
                <p className="text-sm text-[var(--z-muted)]">
                  {goal.description}
                </p>
              ) : null}
            </header>

            <SkillList skills={goal.skills} title="Skills" />

            {goal.skills.map((skill) => (
              <div key={skill.id} className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                  {skill.title}
                </div>
                <CheckpointList
                  checkpoints={skill.checkpoints}
                  title="Checkpoints"
                />
                {skill.checkpoints.map((checkpoint) => (
                  <EvidenceList
                    key={checkpoint.id}
                    evidence={checkpoint.evidence}
                    title={`Evidence · ${checkpoint.title}`}
                  />
                ))}
              </div>
            ))}
          </article>
        ))}
      </div>

      {surface.goals.length > 0 ? (
        <GoalList goals={surface.goals} title="All goals" />
      ) : null}
    </div>
  );
}
