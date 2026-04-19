import { logAudit } from "@/lib/audit/log";
import { getProgressDashboard } from "@/lib/progress/service";
import { resolveProgressContext } from "./guard";
import {
  ProgressSummary,
  StudentSelector,
} from "./components";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProgressDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  let ctx;
  try {
    ctx = await resolveProgressContext();
  } catch {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        You don&apos;t have access to the Progress OS. Please contact your
        administrator.
      </div>
    );
  }

  const resolved = (await searchParams) ?? {};
  const studentId =
    typeof resolved.studentId === "string" ? resolved.studentId : null;

  const data = await getProgressDashboard(ctx.tenantId);

  await logAudit("progress.dashboard.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    students: data.students.length,
    totalGoals: data.totals.totalGoals,
    totalSkills: data.totals.totalSkills,
    source: "page",
  });

  return (
    <div className="space-y-6">
      <section id="overview" className="space-y-3">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-[var(--z-fg)]">
            Student Progress
          </h1>
          <p className="text-sm text-[var(--z-muted)]">
            Track goals, skills, checkpoints, and evidence across your roster.
          </p>
        </header>
        <ProgressSummary kpis={data.totals} title="Workspace totals" />
      </section>

      <section id="students" className="scroll-mt-20">
        <StudentSelector
          students={data.students}
          summaries={data.summaries}
          selectedStudentId={studentId}
        />
      </section>
    </div>
  );
}
