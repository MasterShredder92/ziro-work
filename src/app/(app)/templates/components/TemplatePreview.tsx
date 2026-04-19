import type { RenderedTemplate } from "@/lib/templates/types";

export interface TemplatePreviewProps {
  rendered: RenderedTemplate | null;
  rawBody?: string;
  rawSubject?: string | null;
  emptyLabel?: string;
}

export function TemplatePreview({
  rendered,
  rawBody,
  rawSubject,
  emptyLabel = "No preview yet.",
}: TemplatePreviewProps) {
  if (!rendered && !rawBody) {
    return (
      <div className="rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        {emptyLabel}
      </div>
    );
  }

  const subject = rendered?.subject ?? rawSubject ?? null;
  const body = rendered?.body ?? rawBody ?? "";

  return (
    <div className="space-y-3 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      {rendered ? (
        <div className="flex items-center justify-between text-xs text-[var(--z-muted)]">
          <span>
            Rendered at{" "}
            <span className="text-[var(--z-fg)]">
              {new Date(rendered.renderedAt).toLocaleString()}
            </span>
          </span>
          <span>
            v<span className="text-[var(--z-fg)]">{rendered.version}</span>
          </span>
        </div>
      ) : null}
      {subject ? (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Subject
          </div>
          <div className="mt-1 text-sm font-semibold text-[var(--z-fg)]">
            {subject}
          </div>
        </div>
      ) : null}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Body
        </div>
        <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-[color-mix(in_oklab,var(--z-surface),black_4%)] p-3 text-sm leading-6 text-[var(--z-fg)]">
          {body}
        </pre>
      </div>
      {rendered?.missingMergeFields.length ? (
        <div className="rounded-md border border-[color-mix(in_oklab,var(--z-danger),transparent_55%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] p-3 text-xs text-[var(--z-danger)]">
          <div className="font-semibold">Unresolved merge fields</div>
          <div className="mt-1">
            {rendered.missingMergeFields.map((f) => (
              <code key={f} className="mr-2 text-xs">
                {`{{${f}}}`}
              </code>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
