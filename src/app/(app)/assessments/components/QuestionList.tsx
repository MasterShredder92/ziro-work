import type { AssessmentQuestion } from "@/lib/assessments/types";

export function QuestionList({ questions }: { questions: AssessmentQuestion[] }) {
  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]">
        No questions defined yet.
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {questions.map((q, idx) => (
        <li
          key={q.id}
          className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                Q{idx + 1} · {q.kind} · {q.points} pt{q.points !== 1 ? "s" : ""}
              </div>
              <div className="mt-1 text-sm text-[var(--z-fg)]">{q.prompt}</div>
            </div>
            {q.difficulty ? (
              <span className="shrink-0 rounded-full border border-[var(--z-border)] bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
                {q.difficulty}
              </span>
            ) : null}
          </div>
          {q.options.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs text-[var(--z-muted)]">
              {q.options.map((opt) => (
                <li
                  key={opt.id}
                  className={opt.is_correct ? "text-[#c4f036]" : ""}
                >
                  · {opt.label}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
