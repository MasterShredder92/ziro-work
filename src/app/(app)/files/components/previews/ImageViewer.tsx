"use client";

import { useState } from "react";

export function ImageViewer({ url, name }: { url: string; name?: string }) {
  const [broken, setBroken] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  if (!url) return null;
  if (broken) {
    return (
      <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center text-sm text-[var(--z-muted)]">
        Could not display this image.
        <div className="mt-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--z-accent)] underline"
          >
            Open in new tab
          </a>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--z-fg)]">
        <span className="text-[var(--z-muted)]">Zoom</span>
        <button
          type="button"
          className="rounded border border-[var(--z-border)] px-2 py-0.5 hover:bg-white/[0.05]"
          onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
        >
          −
        </button>
        <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="rounded border border-[var(--z-border)] px-2 py-0.5 hover:bg-white/[0.05]"
          onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
        >
          +
        </button>
        <span className="ml-2 text-[var(--z-muted)]">Rotate</span>
        <button
          type="button"
          className="rounded border border-[var(--z-border)] px-2 py-0.5 hover:bg-white/[0.05]"
          onClick={() => setRotate((r) => r - 90)}
        >
          ⟲
        </button>
        <button
          type="button"
          className="rounded border border-[var(--z-border)] px-2 py-0.5 hover:bg-white/[0.05]"
          onClick={() => setRotate((r) => r + 90)}
        >
          ⟳
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-[var(--z-accent)] underline"
        >
          Open in new tab
        </a>
      </div>
      <div className="flex max-h-[75vh] items-center justify-center overflow-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name ?? "Image preview"}
          className="max-w-full rounded shadow-sm transition-transform duration-150"
          style={{
            transform: `rotate(${rotate}deg) scale(${zoom})`,
            transformOrigin: "center center",
          }}
          onError={() => setBroken(true)}
        />
      </div>
    </div>
  );
}
