import { notFound } from "next/navigation";
import Link from "next/link";
import { logAudit } from "@/lib/audit/log";
import { getProgressSurface } from "@/lib/progress/service";
import { resolveProgressContext } from "../guard";
import {
  CheckpointList,
  EvidenceList,
  EvidenceUploader,
  GoalList,
  ProgressSummary,
  SkillList,
} from "../components";

export const dynamic = "force-dynamic";

type Params = { studentId: string };

type SearchParams = Record<string, string | string[] | undefined>;

function resolveStudentName(
  student: { first_name?: string | null; last_name?: string | null } | null,
): string {
  if (!student) return "Student";
  const first = student.first_name ?? "";
  const last = student.last_name ?? "";
  const full = `${first} ${last}`.trim();
  return full.length > 0 ? full : "Student";
}

export default async function ProgressSurfacePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams?: Promise<SearchParams>;
}) {
  const { studentId } = await params;
  await searchParams;

  if (!studentId || typeof studentId !== "string") {
    notFound();
  }

  let ctx;
  try {
    ctx = await resolveProgressContext();
  } catch {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        You don&apos;t have access to view student progress. Please contact
        your administrator.
      </div>
    );
  }

  let surface;
  try {
    surface = await getProgressSurface(studentId, ctx.tenantId);
  } catch {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        Unable to load progress for this student.
      </div>
    );
  }

  const canWrite =
    ctx.session.role === "teacher" ||
    ctx.session.role === "director" ||
    ctx.session.role === "admin";

  await logAudit("progress.surface.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    studentId,
    source: "progress_os",
  });

  const studentName = resolveStudentName(
    (surface.student as unknown as {
      first_name?: string | null;
      last_name?: string | null;
    } | null) ?? null,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="text-xs text-[var(--z-muted)]">
          <Link href="/progress" className="hover:underline">
            All students
          </Link>
          <span className="mx-1.5">/</span>
          <span>{studentName}</span>
        </div>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">
          {studentName} · Progress
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          Goals, skills, checkpoints, and evidence for this student.
        </p>
      </header>

      <ProgressSummary kpis={surface.kpis} title="Snapshot" />

      {surface.goals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)] text-center">
          No goals have been set for this student yet.
        </div>
      ) : (
        <GoalList goals={surface.goals} title="Goals" />
      )}

      <div className="space-y-8">
        {surface.goals.map((goal) => (
          <article
            key={goal.id}
            className="rounded-lg border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_4%)] p-4 space-y-4"
          >
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#c4f036]">
                  Goal · {goal.status}
                </div>
                <h2 className="mt-0.5 text-lg font-semibold text-[var(--z-fg)]">
                  {goal.title}
                </h2>
                {goal.description ? (
                  <p className="mt-1 text-sm text-[var(--z-muted)]">
                    {goal.description}
                  </p>
                ) : null}
              </div>
              {goal.target_date ? (
                <div className="text-[11px] text-[var(--z-muted)] whitespace-nowrap">
                  Target {new Date(goal.target_date).toLocaleDateString()}
                </div>
              ) : null}
            </header>

            <SkillList skills={goal.skills} title="Skills" />

            <div className="space-y-6">
              {goal.skills.map((skill) => (
                <section
                  key={skill.id}
                  className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3"
                >
                  <header className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                        Skill · {skill.status}
                      </div>
                      <h3 className="mt-0.5 text-base font-semibold text-[var(--z-fg)]">
                        {skill.title}
                      </h3>
                      {skill.rubric ? (
                        <p className="mt-1 text-xs text-[var(--z-muted)]">
                          {skill.rubric}
                        </p>
                      ) : null}
                    </div>
                    {typeof skill.mastery_score === "number" ? (
                      <div className="text-[11px] text-[var(--z-muted)] whitespace-nowrap">
                        Mastery {skill.mastery_score}
                      </div>
                    ) : null}
                  </header>

                  <CheckpointList
                    checkpoints={skill.checkpoints}
                    title="Checkpoints"
                  />

                  <div className="space-y-4">
                    {skill.checkpoints.map((checkpoint) => (
                      <div
                        key={checkpoint.id}
                        className="rounded-lg border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_4%)] p-3 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                              Checkpoint · {checkpoint.status}
                            </div>
                            <div className="mt-0.5 text-sm font-medium text-[var(--z-fg)]">
                              {checkpoint.title}
                            </div>
                            {checkpoint.teacher_feedback ? (
                              <p className="mt-1 text-xs text-[var(--z-muted)]">
                                Teacher feedback: {checkpoint.teacher_feedback}
                              </p>
                            ) : null}
                          </div>
                          {typeof checkpoint.score === "number" ? (
                            <div className="text-[11px] text-[var(--z-muted)] whitespace-nowrap">
                              Score {checkpoint.score}
                            </div>
                          ) : null}
                        </div>

                        <EvidenceList
                          evidence={checkpoint.evidence}
                          title={`Evidence · ${checkpoint.title}`}
                        />

                        {canWrite ? (
                          <EvidenceUploader
                            checkpointId={checkpoint.id}
                            studentId={studentId}
                            tenantId={ctx.tenantId}
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
