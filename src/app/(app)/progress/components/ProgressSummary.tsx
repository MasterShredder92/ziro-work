import type { ProgressKpis } from "@/lib/progress/types";

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-[var(--z-fg)]">
        {value}
      </div>
      {hint ? (
        <div className="mt-0.5 text-xs text-[var(--z-muted)]">{hint}</div>
      ) : null}
    </div>
  );
}

export function ProgressSummary({
  kpis,
  title = "Progress snapshot",
}: {
  kpis: ProgressKpis;
  title?: string;
}) {
  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          {title}
        </h2>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat
          label="Goals"
          value={`${kpis.goalsCompleted}/${kpis.totalGoals}`}
          hint="completed"
        />
        <Stat
          label="Skills"
          value={`${kpis.skillsMastered}/${kpis.totalSkills}`}
          hint="mastered"
        />
        <Stat
          label="Checkpoints"
          value={`${kpis.checkpointsPassed}/${kpis.totalCheckpoints}`}
          hint="passed"
        />
        <Stat
          label="Evidence"
          value={String(kpis.evidenceCount)}
          hint="items uploaded"
        />
        <Stat
          label="Feedback density"
          value={`${kpis.teacherFeedbackDensity}%`}
          hint="teacher responses"
        />
      </div>
    </section>
  );
}
