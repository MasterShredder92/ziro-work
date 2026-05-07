import type {
  AssessmentAttemptSurface,
  AssessmentQuestion,
} from "@/lib/assessments/types";
import { AssessmentScoreCard } from "./AssessmentScoreCard";
import { RubricView } from "./RubricView";

function questionById(
  questions: AssessmentQuestion[],
  id: string,
): AssessmentQuestion | null {
  return questions.find((q) => q.id === id) ?? null;
}

function renderResponse(
  response: string | string[] | number | null | undefined,
): string {
  if (response == null) return "—";
  if (Array.isArray(response)) return response.join(", ");
  return String(response);
}

export function AttemptDetail({
  surface,
  canGrade,
}: {
  surface: AssessmentAttemptSurface;
  canGrade: boolean;
}) {
  const { attempt, assessment, questions, rubric, score } = surface;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Attempt · {attempt.status}
            </div>
            <h1 className="mt-1 text-lg font-semibold text-[var(--z-fg)]">
              {assessment?.title ?? attempt.assessment_id}
            </h1>
            <div className="mt-1 text-xs text-[var(--z-muted)]">
              Student {attempt.student_id}
              {attempt.submitted_at
                ? ` · submitted ${new Date(attempt.submitted_at).toLocaleString()}`
                : ""}
            </div>
          </div>
          <AssessmentScoreCard score={score} />
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-[var(--z-fg)] mb-2">Answers</h2>
        <ol className="space-y-2">
          {attempt.answers.map((ans, idx) => {
            const q = questionById(questions, ans.question_id);
            return (
              <li
                key={ans.question_id}
                className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4"
              >
                <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                  Q{idx + 1}
                  {q ? ` · ${q.kind} · ${q.points}pt` : ""}
                </div>
                {q ? (
                  <div className="mt-1 text-sm text-[var(--z-fg)]">{q.prompt}</div>
                ) : null}
                <div className="mt-2 text-xs text-[var(--z-muted)]">
                  Response: <span className="text-[var(--z-fg)]">{renderResponse(ans.response)}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[var(--z-muted)]">
                  {typeof ans.auto_score === "number" ? (
                    <span>Auto: {ans.auto_score}</span>
                  ) : null}
                  {typeof ans.manual_score === "number" ? (
                    <span>Manual: {ans.manual_score}</span>
                  ) : null}
                  {ans.is_correct != null ? (
                    <span className={ans.is_correct ? "text-[#c4f036]" : "text-red-300"}>
                      {ans.is_correct ? "Correct" : "Incorrect"}
                    </span>
                  ) : null}
                  {ans.teacher_notes ? (
                    <span className="italic">{ans.teacher_notes}</span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--z-fg)] mb-2">Rubric reference</h2>
        <RubricView rubric={rubric} />
      </section>

      {canGrade ? (
        <div className="rounded-lg border border-dashed border-[var(--z-border)] p-4 text-xs text-[var(--z-muted)]">
          Grading controls are rendered here. Use POST
          <code className="mx-1 rounded bg-black/20 px-1">
            /assessments/api/attempt/{attempt.id}
          </code>
          with rubric/manual scores to finalize grading.
        </div>
      ) : null}
    </div>
  );
}
