import Link from "next/link";
import type { AssessmentSummary } from "@/lib/assessments/types";

export function AssessmentList({
  summaries,
  canWrite,
}: {
  summaries: AssessmentSummary[];
  canWrite: boolean;
}) {
  if (summaries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]">
        No assessments yet. {canWrite ? "Create your first quiz or exam to get started." : "Check back soon."}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {summaries.map((s) => {
        const a = s.assessment;
        return (
          <Link
            key={a.id}
            href={`/assessments/${a.id}`}
            className="block rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 hover:border-[#00ff88]/40 hover:bg-[color-mix(in_oklab,var(--z-surface),var(--z-accent)_4%)] transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
                  {a.title}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
                  {a.kind} · {a.status}
                </div>
              </div>
              <StatusPill status={a.status} />
            </div>
            {a.description ? (
              <p className="mt-2 line-clamp-2 text-xs text-[var(--z-muted)]">
                {a.description}
              </p>
            ) : null}
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-[var(--z-muted)]">
              <div>
                <div className="text-[10px] uppercase">Questions</div>
                <div className="text-[var(--z-fg)] font-semibold">{s.questionCount}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase">Rubric</div>
                <div className="text-[var(--z-fg)] font-semibold">{s.rubricCount}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase">Attempts</div>
                <div className="text-[var(--z-fg)] font-semibold">{s.attemptCount}</div>
              </div>
            </div>
            {s.averageScorePct != null ? (
              <div className="mt-3 text-xs text-[var(--z-muted)]">
                Avg score{" "}
                <span className="font-semibold text-[var(--z-fg)]">
                  {s.averageScorePct}%
                </span>
              </div>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const color =
    status === "published"
      ? "text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/30"
      : status === "draft"
        ? "text-amber-300 bg-amber-400/10 border-amber-400/30"
        : "text-[var(--z-muted)] bg-white/5 border-[var(--z-border)]";
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${color}`}
    >
      {status}
    </span>
  );
}
