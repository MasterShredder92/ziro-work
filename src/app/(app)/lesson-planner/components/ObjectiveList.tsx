import type { LessonObjective } from "@/lib/lessonPlanner/types";

export function ObjectiveList({
  objectives,
}: {
  objectives: LessonObjective[];
}) {
  if (objectives.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]">
        No objectives yet. Objectives define what students will know or do by
        the end of the lesson.
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {objectives.map((obj, idx) => (
        <li
          key={obj.id}
          className="flex items-start gap-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3"
        >
          <div className="mt-0.5 shrink-0 rounded-full border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_6%)] px-2 py-0.5 text-[10px] font-semibold text-[var(--z-muted)]">
            {idx + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-[var(--z-fg)]">{obj.text}</div>
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[var(--z-muted)]">
              {obj.bloom_level ? (
                <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5 uppercase tracking-wider">
                  {obj.bloom_level}
                </span>
              ) : null}
              {obj.standard_code ? (
                <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5">
                  {obj.standard_code}
                </span>
              ) : null}
              {obj.is_met ? (
                <span className="rounded-full border border-[#c4f036]/30 bg-[#c4f036]/10 px-2 py-0.5 text-[#c4f036]">
                  Met
                </span>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
