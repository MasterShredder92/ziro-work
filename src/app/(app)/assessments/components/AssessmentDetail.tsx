import Link from "next/link";
import type { AssessmentSurface } from "@/lib/assessments/types";
import { QuestionList } from "./QuestionList";
import { RubricView } from "./RubricView";
import { AttemptList } from "./AttemptList";

export function AssessmentDetail({
  surface,
  canWrite,
  canRun,
}: {
  surface: AssessmentSurface;
  canWrite: boolean;
  canRun: boolean;
}) {
  const { assessment, questions, rubric, attempts, kpis } = surface;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              {assessment.kind} · {assessment.status}
            </div>
            <h1 className="mt-1 text-lg font-semibold text-[var(--z-fg)]">
              {assessment.title}
            </h1>
            {assessment.description ? (
              <p className="mt-2 text-sm text-[var(--z-muted)]">
                {assessment.description}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {canRun ? (
              <Link
                href={`/assessments/run/${assessment.id}`}
                className="rounded-md border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 py-1.5 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/20"
              >
                Run assessment
              </Link>
            ) : null}
            {canWrite ? (
              <span className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-[11px] text-[var(--z-muted)]">
                Editable
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Stat label="Questions" value={questions.length} />
          <Stat label="Rubric criteria" value={rubric.length} />
          <Stat label="Attempts" value={attempts.length} />
          <Stat
            label="Avg score"
            value={kpis.averageScorePct > 0 ? `${kpis.averageScorePct}%` : "—"}
          />
        </div>
      </div>

      <section id="questions">
        <h2 className="text-sm font-semibold text-[var(--z-fg)] mb-2">Questions</h2>
        <QuestionList questions={questions} />
      </section>

      <section id="rubrics">
        <h2 className="text-sm font-semibold text-[var(--z-fg)] mb-2">Rubric</h2>
        <RubricView rubric={rubric} />
      </section>

      <section id="attempts">
        <h2 className="text-sm font-semibold text-[var(--z-fg)] mb-2">Attempts</h2>
        <AttemptList attempts={attempts} canGrade={canWrite} />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_6%)] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-[var(--z-fg)]">{value}</div>
    </div>
  );
}
