"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import type { FileObject } from "@/lib/files/types";

const ROW_PX = 56;
const OVERSCAN = 6;

function formatBytes(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let idx = 0;
  let v = n;
  while (v >= 1024 && idx < units.length - 1) {
    v /= 1024;
    idx += 1;
  }
  return `${v.toFixed(v >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso.slice(0, 10);
  }
}

export function VirtualizedFileRows({ files }: { files: FileObject[] }) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewH, setViewH] = useState(480);

  const onScroll = useCallback(() => {
    const el = outerRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
  }, []);

  const totalH = files.length * ROW_PX;

  const { start, end } = useMemo(() => {
    const startIdx = Math.max(0, Math.floor(scrollTop / ROW_PX) - OVERSCAN);
    const visible = Math.ceil(viewH / ROW_PX) + OVERSCAN * 2;
    const endIdx = Math.min(files.length, startIdx + visible);
    return { start: startIdx, end: endIdx };
  }, [files.length, scrollTop, viewH]);

  const slice = useMemo(
    () => files.slice(start, end),
    [files, start, end],
  );

  return (
    <div
      ref={(el) => {
        outerRef.current = el;
        if (el && el.clientHeight !== viewH) setViewH(el.clientHeight || 480);
      }}
      className="max-h-[min(70vh,560px)] overflow-auto"
      onScroll={onScroll}
    >
      <div style={{ height: totalH, position: "relative" }}>
        <div
          className="absolute left-0 right-0 divide-y divide-[var(--z-border)]"
          style={{ transform: `translateY(${start * ROW_PX}px)` }}
        >
          {slice.map((f) => (
            <div
              key={f.id}
              style={{ height: ROW_PX }}
              className="grid grid-cols-[minmax(0,2fr)_1fr_80px_100px_80px_100px] items-center gap-2 px-4 text-sm hover:bg-white/[0.02]"
            >
              <div className="min-w-0">
                <Link
                  href={`/files/${f.id}`}
                  className="block truncate font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]"
                >
                  {f.name}
                </Link>
                {f.description ? (
                  <div className="truncate text-xs text-[var(--z-muted)]">{f.description}</div>
                ) : null}
              </div>
              <div className="truncate text-xs text-[var(--z-muted)]">{f.mimeType || "—"}</div>
              <div className="text-xs text-[var(--z-muted)]">{formatBytes(f.size)}</div>
              <div>
                <span className="inline-flex items-center rounded-full border border-[var(--z-border)] px-2 py-0.5 text-xs text-[var(--z-muted)]">
                  {f.visibility}
                </span>
              </div>
              <div className="text-xs text-[var(--z-muted)]">{f.signatureStatus ?? "—"}</div>
              <div className="text-xs text-[var(--z-muted)]">{formatDate(f.updatedAt)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
