import { logAudit } from "@/lib/audit/log";
import { getAssessmentDashboard } from "@/lib/assessments";
import { AssessmentList } from "./components";
import { resolveAssessmentsContext } from "./guard";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-[var(--z-fg)]">{value}</div>
    </div>
  );
}

export default async function AssessmentsDashboardPage() {
  let ctx;
  try {
    ctx = await resolveAssessmentsContext();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          You do not have permission to view assessments.
        </div>
      </div>
    );
  }

  const data = await getAssessmentDashboard(ctx.tenantId);

  await logAudit("assessments.dashboard.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    total: data.kpis.totalAssessments,
    attempts: data.kpis.totalAttempts,
    source: "page",
  });

  return (
    <div className="space-y-6">
      <section id="overview" className="space-y-3 scroll-mt-24">
        <header>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Assessments OS
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
            Quizzes, exams & rubrics
          </h1>
          <div className="text-xs text-[var(--z-muted)]">
            Updated {new Date(data.generatedAt).toLocaleTimeString()}
          </div>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Stat label="Assessments" value={String(data.kpis.totalAssessments)} />
          <Stat label="Published" value={String(data.kpis.publishedCount)} />
          <Stat label="Attempts" value={String(data.kpis.totalAttempts)} />
          <Stat label="Completion" value={`${data.kpis.completionRatePct}%`} />
          <Stat label="Avg score" value={`${data.kpis.averageScorePct}%`} />
          <Stat label="Pass rate" value={`${data.kpis.passRatePct}%`} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Stat label="Mastered" value={String(data.kpis.masteryDistribution.mastered)} />
          <Stat label="Developing" value={String(data.kpis.masteryDistribution.developing)} />
          <Stat label="Needs support" value={String(data.kpis.masteryDistribution.needsSupport)} />
          <Stat label="Rubric aligned" value={`${data.kpis.rubricAlignmentPct}%`} />
        </div>
      </section>

      <section id="assessments" className="space-y-3 scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Assessments
        </h2>
        <AssessmentList summaries={data.assessments} canWrite={ctx.canWrite} />
      </section>
    </div>
  );
}
