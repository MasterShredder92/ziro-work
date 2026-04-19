import { ensureFamilyAccess } from "../guard";
import {
  getFamilyStudents,
  resolveCurrentFamilyId,
} from "@/lib/portal/queries";
import { getProgressSurface } from "@/lib/progress/service";
import { logAudit } from "@/lib/audit/log";
import {
  CheckpointList,
  EvidenceList,
  GoalList,
  ProgressSummary,
  SkillList,
} from "../../progress/components";

export const dynamic = "force-dynamic";

function displayName(student: unknown): string {
  if (!student || typeof student !== "object") return "Student";
  const row = student as Record<string, unknown>;
  const first = typeof row.first_name === "string" ? row.first_name : "";
  const last = typeof row.last_name === "string" ? row.last_name : "";
  const full = `${first} ${last}`.trim();
  return full.length > 0 ? full : "Student";
}

export default async function FamilyProgressPage() {
  const session = await ensureFamilyAccess();
  const familyId = await resolveCurrentFamilyId();

  if (!familyId) {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        No family record linked to your account yet.
      </div>
    );
  }

  const students = await getFamilyStudents(familyId);
  const surfaces = await Promise.all(
    students.map((s) =>
      getProgressSurface(
        s.id,
        (s as unknown as { tenant_id?: string }).tenant_id ?? session.tenantId,
      ),
    ),
  );

  await logAudit("progress.family.view", {
    tenantId: session.tenantId,
    profileId: session.userId,
    role: session.role,
    familyId,
    students: students.length,
    source: "family_portal",
  });

  if (students.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        No students linked to your family yet.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">
          Student progress
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          Your students&apos; goals, skills, and teacher feedback.
        </p>
      </header>

      {surfaces.map((surface, i) => {
        const student = students[i];
        return (
          <section key={surface.studentId} className="space-y-4">
            <header className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-[var(--z-fg)]">
                {displayName(student)}
              </h2>
            </header>
            <ProgressSummary kpis={surface.kpis} title="Snapshot" />

            {surface.goals.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)] text-center">
                No goals have been set yet.
              </div>
            ) : (
              <>
                <GoalList goals={surface.goals} title="Goals" />
                {surface.goals.map((goal) => (
                  <article
                    key={goal.id}
                    className="rounded-lg border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_4%)] p-4 space-y-3"
                  >
                    <header>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#00ff88]">
                        Goal · {goal.status}
                      </div>
                      <h3 className="mt-0.5 text-base font-semibold text-[var(--z-fg)]">
                        {goal.title}
                      </h3>
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
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
