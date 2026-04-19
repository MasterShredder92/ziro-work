"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type {
  AssessmentAnswer,
  AssessmentQuestion,
  AssessmentSurface,
} from "@/lib/assessments/types";

type RunnerState = Record<string, string | string[] | number | null>;

export function AssessmentRunner({
  surface,
  studentId,
}: {
  surface: AssessmentSurface;
  studentId: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<RunnerState>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startedAt = useMemo(() => new Date(), []);

  function updateAnswer(qid: string, value: string | string[] | number | null) {
    setState((prev) => ({ ...prev, [qid]: value }));
  }

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const answers: AssessmentAnswer[] = surface.questions.map((q) => ({
        question_id: q.id,
        response: state[q.id] ?? null,
      }));
      const res = await fetch(`/assessments/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: surface.assessment.id,
          studentId,
          answers,
          durationSeconds: Math.floor((Date.now() - startedAt.getTime()) / 1000),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Submit failed (${res.status})`);
      }
      const data = (await res.json()) as {
        attempt: { id: string };
      };
      router.push(`/assessments/attempt/${data.attempt.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submit failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5">
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          {surface.assessment.kind} · Runner
        </div>
        <h1 className="mt-1 text-lg font-semibold text-[var(--z-fg)]">
          {surface.assessment.title}
        </h1>
        {surface.assessment.description ? (
          <p className="mt-1 text-sm text-[var(--z-muted)]">
            {surface.assessment.description}
          </p>
        ) : null}
      </div>

      {surface.questions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]">
          This assessment has no questions yet.
        </div>
      ) : (
        <ol className="space-y-3">
          {surface.questions.map((q, idx) => (
            <QuestionInput
              key={q.id}
              index={idx}
              question={q}
              value={state[q.id]}
              onChange={(v) => updateAnswer(q.id, v)}
            />
          ))}
        </ol>
      )}

      {error ? (
        <div className="rounded-md border border-red-400/40 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={submitting || surface.questions.length === 0}
          onClick={onSubmit}
          className="rounded-md border border-[#00ff88]/40 bg-[#00ff88]/15 px-4 py-2 text-xs font-semibold text-[#00ff88] disabled:opacity-50 hover:bg-[#00ff88]/25"
        >
          {submitting ? "Submitting…" : "Submit attempt"}
        </button>
      </div>
    </div>
  );
}

function QuestionInput({
  index,
  question,
  value,
  onChange,
}: {
  index: number;
  question: AssessmentQuestion;
  value: string | string[] | number | null | undefined;
  onChange: (value: string | string[] | number | null) => void;
}) {
  return (
    <li className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
        Q{index + 1} · {question.kind} · {question.points}pt
      </div>
      <div className="mt-1 text-sm text-[var(--z-fg)]">{question.prompt}</div>

      <div className="mt-3">
        {question.kind === "multiple_choice" ? (
          <div className="space-y-1">
            {question.options.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm text-[var(--z-fg)]">
                <input
                  type="radio"
                  name={question.id}
                  value={opt.id}
                  checked={value === opt.id}
                  onChange={(e) => onChange(e.target.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        ) : question.kind === "true_false" ? (
          <div className="flex gap-4 text-sm text-[var(--z-fg)]">
            {["true", "false"].map((v) => (
              <label key={v} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={question.id}
                  value={v}
                  checked={value === v}
                  onChange={(e) => onChange(e.target.value)}
                />
                <span className="capitalize">{v}</span>
              </label>
            ))}
          </div>
        ) : question.kind === "short_answer" ? (
          <input
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
            placeholder="Your answer…"
          />
        ) : (
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
            placeholder="Your response…"
          />
        )}
      </div>
    </li>
  );
}
