"use client";

import { useEffect, useState } from "react";

export function TextViewer({ url }: { url: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    fetch(url)
      .then((r) => r.text())
      .then((t) => {
        if (!cancelled) setText(t);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) {
    return (
      <div className="rounded-md border border-dashed border-red-500/40 bg-red-500/5 p-3 text-sm text-red-500">
        Failed to load: {error}
      </div>
    );
  }
  if (text === null) {
    return (
      <div className="rounded-md border border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]">
        Loading preview…
      </div>
    );
  }
  return (
    <pre className="max-h-[70vh] overflow-auto rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-xs text-[var(--z-fg)]">
      {text}
    </pre>
  );
}
