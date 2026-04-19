import type { ProgressEvidence } from "@/lib/progress/types";

function kindIcon(kind: ProgressEvidence["kind"]): string {
  switch (kind) {
    case "image":
      return "🖼";
    case "video":
      return "▶";
    case "audio":
      return "♪";
    case "document":
      return "📄";
    case "link":
      return "🔗";
    case "note":
    default:
      return "✎";
  }
}

export function EvidenceList({
  evidence,
  title = "Evidence",
  emptyLabel = "No evidence submitted yet.",
  maxRows = 50,
}: {
  evidence: ProgressEvidence[];
  title?: string;
  emptyLabel?: string;
  maxRows?: number;
}) {
  if (evidence.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]">
        {emptyLabel}
      </div>
    );
  }

  const rows = evidence.slice(0, maxRows);

  return (
    <section className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <header className="border-b border-[var(--z-border)] px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--z-fg)]">{title}</h3>
        <span className="text-xs text-[var(--z-muted)]">
          {evidence.length} items
        </span>
      </header>
      <ul className="divide-y divide-[var(--z-border)]">
        {rows.map((e) => (
          <li key={e.id} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-8 w-8 rounded-md border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_40%)] flex items-center justify-center text-base">
                {kindIcon(e.kind)}
              </div>
              <div className="min-w-0 flex-1">
                {e.body ? (
                  <p className="text-sm text-[var(--z-fg)] whitespace-pre-wrap break-words">
                    {e.body}
                  </p>
                ) : null}
                {e.file_url ? (
                  <a
                    href={e.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-[#00ff88] hover:underline mt-1"
                  >
                    {e.file_name ?? e.file_url}
                  </a>
                ) : null}
                {e.teacher_feedback ? (
                  <div className="mt-2 rounded-md border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_30%)] px-3 py-2 text-xs text-[var(--z-fg)]">
                    <span className="text-[var(--z-muted)]">Feedback:</span>{" "}
                    {e.teacher_feedback}
                  </div>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--z-muted)]">
                  <span>{new Date(e.created_at).toLocaleString()}</span>
                  {e.submitter_role ? <span>· {e.submitter_role}</span> : null}
                  {typeof e.score === "number" ? (
                    <span>· score {e.score}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
