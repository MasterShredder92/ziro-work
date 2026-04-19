import type { AssessmentRubric } from "@/lib/assessments/types";

export function RubricView({ rubric }: { rubric: AssessmentRubric[] }) {
  if (rubric.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]">
        No rubric attached to this assessment.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--z-border)] text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
            <th className="px-3 py-2">Criterion</th>
            <th className="px-3 py-2">Description</th>
            <th className="px-3 py-2 text-right">Max</th>
            <th className="px-3 py-2 text-right">Weight</th>
          </tr>
        </thead>
        <tbody>
          {rubric.map((r) => (
            <tr
              key={r.id}
              className="border-b border-[var(--z-border)] last:border-b-0"
            >
              <td className="px-3 py-2 font-medium text-[var(--z-fg)]">
                {r.criterion}
              </td>
              <td className="px-3 py-2 text-[var(--z-muted)]">
                {r.description ?? "—"}
              </td>
              <td className="px-3 py-2 text-right text-[var(--z-fg)]">
                {r.max_points}
              </td>
              <td className="px-3 py-2 text-right text-[var(--z-muted)]">
                {r.weight}×
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
