import { logAudit } from "@/lib/audit/log";
import { getCurriculumDashboard } from "@/lib/curriculum";
import { ProgramList } from "./components";
import { resolveCurriculumContext } from "./guard";

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

export default async function CurriculumDashboardPage() {
  let ctx;
  try {
    ctx = await resolveCurriculumContext();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          You do not have permission to view curriculum.
        </div>
      </div>
    );
  }

  const data = await getCurriculumDashboard(ctx.tenantId);

  await logAudit("curriculum.dashboard.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    programs: data.kpis.totalPrograms,
    lessons: data.kpis.totalLessons,
    source: "page",
  });

  return (
    <div className="space-y-6">
      <section id="overview" className="space-y-3 scroll-mt-24">
        <header>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Curriculum OS
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
            Programs & Lessons
          </h1>
          <div className="text-xs text-[var(--z-muted)]">
            Updated {new Date(data.generatedAt).toLocaleTimeString()}
          </div>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Stat label="Programs" value={String(data.kpis.totalPrograms)} />
          <Stat label="Active" value={String(data.kpis.activePrograms)} />
          <Stat label="Levels" value={String(data.kpis.totalLevels)} />
          <Stat label="Units" value={String(data.kpis.totalUnits)} />
          <Stat label="Lessons" value={String(data.kpis.totalLessons)} />
          <Stat label="Materials" value={String(data.kpis.totalMaterials)} />
        </div>
      </section>

      <section id="programs" className="space-y-3 scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Programs
        </h2>
        <ProgramList programs={data.tree.programs.map((p) => p.program)} />
      </section>
    </div>
  );
}
