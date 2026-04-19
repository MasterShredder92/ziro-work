import type { ProgressSkill } from "@/lib/progress/types";

function statusTone(status: ProgressSkill["status"]): string {
  switch (status) {
    case "mastered":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "proficient":
      return "bg-sky-500/10 text-sky-400 border-sky-500/30";
    case "developing":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "not_started":
      return "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
  }
}

export function SkillList({
  skills,
  title = "Skills",
  emptyLabel = "No skills tracked for this goal.",
}: {
  skills: ProgressSkill[];
  title?: string;
  emptyLabel?: string;
}) {
  if (skills.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <header className="border-b border-[var(--z-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--z-fg)]">{title}</h3>
      </header>
      <ul className="divide-y divide-[var(--z-border)]">
        {skills.map((s) => (
          <li key={s.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[var(--z-fg)]">
                  {s.title}
                </div>
                {s.description ? (
                  <div className="truncate text-xs text-[var(--z-muted)]">
                    {s.description}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {typeof s.mastery_score === "number" ? (
                  <span className="text-xs font-medium text-[var(--z-fg)]">
                    {s.mastery_score}%
                  </span>
                ) : null}
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusTone(
                    s.status,
                  )}`}
                >
                  {s.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
