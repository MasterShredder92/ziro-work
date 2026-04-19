import type { TemplateVersion } from "@/lib/templates/types";

export interface TemplateVersionListProps {
  versions: TemplateVersion[];
  emptyLabel?: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export function TemplateVersionList({
  versions,
  emptyLabel = "No version history yet.",
}: TemplateVersionListProps) {
  if (versions.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-sm text-[var(--z-muted)]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {versions.map((v) => (
        <li
          key={v.id}
          className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md border border-[var(--z-border)] px-2 text-xs font-semibold text-[var(--z-fg)]">
                v{v.version}
              </span>
              {v.isCurrent ? (
                <span className="rounded-full bg-[color-mix(in_oklab,var(--z-accent),transparent_80%)] px-2 py-0.5 text-xs font-semibold text-[var(--z-accent)]">
                  current
                </span>
              ) : null}
            </div>
            <div className="text-xs text-[var(--z-muted)]">
              {formatDate(v.createdAt)}
            </div>
          </div>
          {v.changeSummary ? (
            <div className="mt-2 text-sm text-[var(--z-fg)]/80">
              {v.changeSummary}
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
