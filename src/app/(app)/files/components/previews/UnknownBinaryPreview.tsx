"use client";

import { FileQuestion } from "lucide-react";

export function UnknownBinaryPreview({
  url,
  mimeType,
  name,
}: {
  url: string;
  mimeType?: string | null;
  name?: string | null;
}) {
  const mt = mimeType?.trim() || "Unknown type";
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-6 py-10 text-center">
      <FileQuestion className="h-10 w-10 text-[var(--z-muted)]" aria-hidden />
      <div>
        <div className="text-sm font-medium text-[var(--z-fg)]">No inline preview</div>
        <p className="mt-1 max-w-sm text-xs text-[var(--z-muted)]">
          This format ({mt}) cannot be previewed in the browser. You can still download or open it
          externally.
        </p>
        {name ? (
          <p className="mt-2 truncate text-xs text-[var(--z-muted)]" title={name}>
            {name}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90"
        >
          Open
        </a>
        <a
          href={url}
          download={name ?? undefined}
          className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]"
        >
          Download
        </a>
      </div>
    </div>
  );
}
