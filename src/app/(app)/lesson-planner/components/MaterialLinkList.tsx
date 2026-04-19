import type { LessonMaterialLink } from "@/lib/lessonPlanner/types";

export function MaterialLinkList({
  materials,
}: {
  materials: LessonMaterialLink[];
}) {
  if (materials.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]">
        No materials linked yet. Link slides, PDFs, or videos so students and
        teachers can access everything from the plan.
      </div>
    );
  }

  return (
    <ul className="grid gap-2 md:grid-cols-2">
      {materials.map((m) => (
        <li
          key={m.id}
          className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
                {m.title}
              </div>
              <div className="mt-0.5 text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
                {m.kind}
                {m.is_required ? " · Required" : ""}
              </div>
            </div>
            {m.url ? (
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-md border border-[var(--z-border)] px-2 py-1 text-[11px] font-semibold text-[var(--z-fg)] hover:border-[#00ff88]/40 hover:text-[#00ff88]"
              >
                Open
              </a>
            ) : null}
          </div>
          {m.notes ? (
            <p className="mt-2 text-xs text-[var(--z-muted)]">{m.notes}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
