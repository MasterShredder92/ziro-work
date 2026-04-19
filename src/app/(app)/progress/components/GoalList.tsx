import type { ProgressGoal } from "@/lib/progress/types";

function statusTone(status: ProgressGoal["status"]): string {
  switch (status) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "active":
      return "bg-sky-500/10 text-sky-400 border-sky-500/30";
    case "draft":
      return "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
    case "archived":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  }
}

export function GoalList({
  goals,
  title = "Goals",
  emptyLabel = "No goals set yet.",
}: {
  goals: ProgressGoal[];
  title?: string;
  emptyLabel?: string;
}) {
  if (goals.length === 0) {
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
        {goals.map((g) => (
          <li key={g.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[var(--z-fg)]">
                  {g.title}
                </div>
                {g.description ? (
                  <div className="truncate text-xs text-[var(--z-muted)]">
                    {g.description}
                  </div>
                ) : null}
              </div>
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusTone(
                  g.status,
                )}`}
              >
                {g.status}
              </span>
            </div>
            {g.target_date ? (
              <div className="mt-1 text-[11px] text-[var(--z-muted)]">
                Target: {new Date(g.target_date).toLocaleDateString()}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
