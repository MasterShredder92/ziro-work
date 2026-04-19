"use client";

import { useEffect, useRef } from "react";

export function ConfirmDeleteModal({
  open,
  title,
  body,
  confirmLabel = "Delete",
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-delete-title"
        className="w-full max-w-md rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] p-5 shadow-xl"
      >
        <h2
          id="bulk-delete-title"
          className="text-lg font-semibold text-[var(--z-fg,#f0f0f0)]"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-[var(--z-muted,#909098)]">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-[var(--z-border,#1c1c1e)] px-3 py-2 text-sm font-medium text-[var(--z-fg,#e0e0e0)] hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md bg-red-600/90 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
