import { logAudit } from "@/lib/audit/log";
import { getLessonPlannerDashboard } from "@/lib/lessonPlanner";
import { AIDraftPanel, LessonPlanList } from "./components";
import { resolveLessonPlannerContext } from "./guard";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-[var(--z-fg)]">
        {value}
      </div>
    </div>
  );
}

export default async function LessonPlannerDashboardPage() {
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
          You do not have permission to view the lesson planner.
        </div>
      </div>
    );
  }

  const data = await getLessonPlannerDashboard(ctx.tenantId);

  await logAudit("lessonPlanner.dashboard.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    total: data.kpis.totalPlans,
    aiDraftsLast30d: data.kpis.aiDraftsLast30d,
    source: "page",
  });

  return (
    <div className="space-y-6">
      <section id="overview" className="space-y-3 scroll-mt-24">
        <header>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Lesson Planner OS
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
            Objectives, activities, materials & AI drafts
          </h1>
          <div className="text-xs text-[var(--z-muted)]">
            Updated {new Date(data.generatedAt).toLocaleTimeString()}
          </div>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Stat label="Plans" value={String(data.kpis.totalPlans)} />
          <Stat
            label="Updated 7d"
            value={String(data.kpis.plansUpdatedLast7d)}
          />
          <Stat
            label="AI drafts 30d"
            value={String(data.kpis.aiDraftsLast30d)}
          />
          <Stat
            label="AI usage"
            value={`${data.kpis.aiDraftUsagePct}%`}
          />
          <Stat
            label="Alignment"
            value={`${data.kpis.curriculumAlignmentPct}%`}
          />
          <Stat
            label="Materials/plan"
            value={String(data.kpis.materialsLinkedPerPlan)}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Stat
            label="Draft"
            value={String(data.kpis.statusBreakdown.draft)}
          />
          <Stat
            label="Ready"
            value={String(data.kpis.statusBreakdown.ready)}
          />
          <Stat
            label="Published"
            value={String(data.kpis.statusBreakdown.published)}
          />
          <Stat
            label="Archived"
            value={String(data.kpis.statusBreakdown.archived)}
          />
        </div>
      </section>

      <section id="plans" className="space-y-3 scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Lesson plans
        </h2>
        <LessonPlanList summaries={data.plans} canWrite={ctx.canWrite} />
      </section>

      <section id="ai-draft" className="space-y-3 scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          AI draft
        </h2>
        <AIDraftPanel tenantId={ctx.tenantId} canWrite={ctx.canWrite} />
      </section>
    </div>
  );
}
