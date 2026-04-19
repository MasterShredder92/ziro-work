import type { ProgressCheckpoint } from "@/lib/progress/types";

function statusTone(status: ProgressCheckpoint["status"]): string {
  switch (status) {
    case "passed":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "in_progress":
      return "bg-sky-500/10 text-sky-400 border-sky-500/30";
    case "pending":
      return "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
    case "needs_review":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "failed":
      return "bg-rose-500/10 text-rose-400 border-rose-500/30";
  }
}

export function CheckpointList({
  checkpoints,
  title = "Checkpoints",
  emptyLabel = "No checkpoints assigned yet.",
}: {
  checkpoints: ProgressCheckpoint[];
  title?: string;
  emptyLabel?: string;
}) {
  if (checkpoints.length === 0) {
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
        {checkpoints.map((c) => (
          <li key={c.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[var(--z-fg)]">
                  {c.title}
                </div>
                {c.description ? (
                  <div className="text-xs text-[var(--z-muted)]">
                    {c.description}
                  </div>
                ) : null}
                {c.teacher_feedback ? (
                  <div className="mt-2 rounded-md border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_30%)] px-3 py-2 text-xs text-[var(--z-fg)]">
                    <span className="text-[var(--z-muted)]">Teacher:</span>{" "}
                    {c.teacher_feedback}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {typeof c.score === "number" ? (
                  <span className="text-xs font-medium text-[var(--z-fg)]">
                    {c.score}
                  </span>
                ) : null}
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusTone(
                    c.status,
                  )}`}
                >
                  {c.status.replace("_", " ")}
                </span>
              </div>
            </div>
            {c.due_date ? (
              <div className="mt-1 text-[11px] text-[var(--z-muted)]">
                Due: {new Date(c.due_date).toLocaleDateString()}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
