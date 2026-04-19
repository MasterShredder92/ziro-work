import Link from "next/link";
import type { AssessmentAttempt } from "@/lib/assessments/types";

export function AttemptList({
  attempts,
  canGrade,
}: {
  attempts: AssessmentAttempt[];
  canGrade: boolean;
}) {
  if (attempts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]">
        No attempts yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--z-border)] text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
            <th className="px-3 py-2">Student</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2 text-right">Score</th>
            <th className="px-3 py-2">Submitted</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((att) => {
            const pct =
              att.max_score && att.score != null
                ? Math.round(((att.score ?? 0) / att.max_score) * 100)
                : null;
            return (
              <tr
                key={att.id}
                className="border-b border-[var(--z-border)] last:border-b-0"
              >
                <td className="px-3 py-2 font-medium text-[var(--z-fg)] truncate max-w-[180px]">
                  {att.student_id}
                </td>
                <td className="px-3 py-2 text-[var(--z-muted)]">{att.status}</td>
                <td className="px-3 py-2 text-right text-[var(--z-fg)]">
                  {pct != null ? `${pct}%` : "—"}
                </td>
                <td className="px-3 py-2 text-[var(--z-muted)]">
                  {att.submitted_at
                    ? new Date(att.submitted_at).toLocaleString()
                    : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/assessments/attempt/${att.id}`}
                    className="text-xs font-semibold text-[#00ff88] hover:underline"
                  >
                    {canGrade ? "Grade" : "View"}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
