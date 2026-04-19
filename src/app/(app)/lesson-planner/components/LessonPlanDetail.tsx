import type { LessonPlanSurface } from "@/lib/lessonPlanner/types";
import { ActivityList } from "./ActivityList";
import { MaterialLinkList } from "./MaterialLinkList";
import { ObjectiveList } from "./ObjectiveList";

export function LessonPlanDetail({ surface }: { surface: LessonPlanSurface }) {
  const { plan, objectives, activities, materials, versions, kpis } = surface;

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              {plan.source === "ai_draft" ? "AI-drafted plan" : "Lesson plan"}
              {plan.grade_level ? ` · ${plan.grade_level}` : ""}
              {plan.subject ? ` · ${plan.subject}` : ""}
            </div>
            <h1 className="mt-1 text-xl font-semibold text-[var(--z-fg)]">
              {plan.title}
            </h1>
            {plan.summary ? (
              <p className="mt-2 text-sm text-[var(--z-muted)] max-w-2xl">
                {plan.summary}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5 uppercase text-[var(--z-muted)]">
              v{plan.current_version}
            </span>
            <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5 uppercase text-[var(--z-muted)]">
              {plan.status}
            </span>
            {plan.duration_minutes ? (
              <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[var(--z-muted)]">
                {plan.duration_minutes} min
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-3">
          <Stat label="Objectives" value={kpis.objectiveCount} />
          <Stat label="Activities" value={kpis.activityCount} />
          <Stat label="Materials" value={kpis.materialCount} />
          <Stat label="Versions" value={kpis.versionCount} />
          <Stat label="AI drafts" value={kpis.aiDraftCount} />
          <Stat
            label="Alignment"
            value={`${kpis.curriculumAlignmentPct}%`}
          />
        </div>
      </header>

      <section id="objectives" className="space-y-2">
        <SectionHeader title="Objectives" count={kpis.objectiveCount} />
        <ObjectiveList objectives={objectives} />
      </section>

      <section id="activities" className="space-y-2">
        <SectionHeader title="Activities" count={kpis.activityCount} />
        <ActivityList activities={activities} />
      </section>

      <section id="materials" className="space-y-2">
        <SectionHeader title="Materials" count={kpis.materialCount} />
        <MaterialLinkList materials={materials} />
      </section>

      <section id="versions" className="space-y-2">
        <SectionHeader title="Versions" count={kpis.versionCount} />
        {versions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]">
            No versions yet. Save an AI draft to create the first version.
          </div>
        ) : (
          <ol className="space-y-2">
            {versions.map((v) => (
              <li
                key={v.id}
                className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--z-fg)]">
                      {v.label ?? `Version ${v.version}`}
                    </span>
                    <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
                      {v.source}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--z-muted)]">
                    {new Date(v.created_at).toLocaleString()}
                  </span>
                </div>
                {v.summary ? (
                  <p className="mt-1 text-xs text-[var(--z-muted)]">
                    {v.summary}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_6%)] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className="text-sm font-semibold text-[var(--z-fg)]">{value}</div>
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-[var(--z-fg)]">{title}</h2>
      <span className="text-[11px] text-[var(--z-muted)]">{count}</span>
    </div>
  );
}
