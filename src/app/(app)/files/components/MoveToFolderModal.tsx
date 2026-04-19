"use client";

import { useMemo, useState } from "react";
import type { FileFolder } from "@/lib/files/types";

export interface MoveToFolderModalProps {
  open: boolean;
  folders: FileFolder[];
  onClose: () => void;
  onConfirm: (folderId: string | null) => void;
  title?: string;
}

export function MoveToFolderModal({
  open,
  folders,
  onClose,
  onConfirm,
  title = "Move to folder",
}: MoveToFolderModalProps) {
  const [q, setQ] = useState("");
  const flat = useMemo(() => {
    const sorted = [...folders].sort((a, b) => a.path.localeCompare(b.path));
    const needle = q.trim().toLowerCase();
    if (!needle) return sorted;
    return sorted.filter(
      (f) =>
        f.name.toLowerCase().includes(needle) ||
        f.path.toLowerCase().includes(needle),
    );
  }, [folders, q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-200">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--z-fg)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--z-muted)] hover:bg-white/[0.05]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search folders…"
          className="mb-3 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
        />
        <div className="min-h-0 flex-1 overflow-y-auto rounded border border-[var(--z-border)] p-2">
          <button
            type="button"
            onClick={() => onConfirm(null)}
            className="mb-2 w-full rounded border border-dashed border-[var(--z-border)] px-2 py-2 text-left text-xs text-[var(--z-muted)] hover:bg-white/[0.03]"
          >
            Root (no folder)
          </button>
          {flat.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onConfirm(f.id)}
              className="mb-1 w-full rounded px-2 py-2 text-left text-sm text-[var(--z-fg)] hover:bg-white/[0.05]"
            >
              <div className="font-medium">{f.name}</div>
              <div className="text-[11px] text-[var(--z-muted)]">{f.path}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
