"use client";

import { useCallback, useMemo, useState } from "react";

export function PDFViewer({ url, name }: { url: string; name?: string }) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);

  const objectUrl = useMemo(() => {
    if (!url) return "";
    try {
      const u = new URL(url);
      u.hash = `page=${Math.max(1, page)}`;
      return u.toString();
    } catch {
      return `${url}#page=${Math.max(1, page)}`;
    }
  }, [url, page]);

  const nudgeZoom = useCallback((delta: number) => {
    setZoom((z) => Math.min(200, Math.max(50, Math.round(z + delta))));
  }, []);

  if (!url) {
    return (
      <div className="rounded-md border border-dashed border-[var(--z-border)] p-6 text-center text-sm text-[var(--z-muted)]">
        No PDF available.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1.5 text-xs text-[var(--z-fg)]">
        <span className="text-[var(--z-muted)]">Zoom</span>
        <button
          type="button"
          className="rounded border border-[var(--z-border)] px-2 py-0.5 hover:bg-white/[0.04]"
          onClick={() => nudgeZoom(-10)}
        >
          −
        </button>
        <span className="min-w-[3rem] text-center">{zoom}%</span>
        <button
          type="button"
          className="rounded border border-[var(--z-border)] px-2 py-0.5 hover:bg-white/[0.04]"
          onClick={() => nudgeZoom(10)}
        >
          +
        </button>
        <span className="mx-1 text-[var(--z-border)]">|</span>
        <label className="flex items-center gap-1 text-[var(--z-muted)]">
          Page
          <input
            type="number"
            min={1}
            value={page}
            onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
            className="w-14 rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-1 py-0.5 text-[var(--z-fg)]"
          />
        </label>
        <a
          className="ml-auto text-[var(--z-accent)] underline"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          Open in new tab
        </a>
      </div>
      <div
        className="overflow-auto rounded-md border border-[var(--z-border)] bg-[var(--z-surface)]"
        style={{ maxHeight: "70vh" }}
      >
        <div
          style={{
            width: `${zoom}%`,
            minHeight: "60vh",
            margin: "0 auto",
            transition: "width 120ms ease-out",
          }}
        >
          <object
            data={objectUrl}
            type="application/pdf"
            className="h-[65vh] w-full bg-white"
            aria-label={name ?? "PDF preview"}
          >
            <p className="p-4 text-sm text-[var(--z-muted)]">
              PDF preview not supported in this browser.{" "}
              <a className="text-[var(--z-accent)] underline" href={url} target="_blank" rel="noreferrer">
                Open PDF
              </a>
            </p>
          </object>
        </div>
      </div>
    </div>
  );
}
