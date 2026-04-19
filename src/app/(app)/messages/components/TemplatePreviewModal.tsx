"use client";

import { useEffect } from "react";

export type TemplatePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  templateName: string;
  renderedSubject: string;
  renderedBody: string;
};

export function TemplatePreviewModal({
  open,
  onClose,
  templateName,
  renderedSubject,
  renderedBody,
}: TemplatePreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const subjectEmpty = !renderedSubject.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-preview-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col gap-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 shadow-xl">
        <header className="flex shrink-0 items-center justify-between gap-2">
          <h2
            id="template-preview-title"
            className="text-base font-semibold text-[var(--z-fg)]"
          >
            Template preview
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]"
            aria-label="Close preview"
          >
            ×
          </button>
        </header>

        <p className="shrink-0 text-xs text-[var(--z-muted)]">
          <span className="font-medium text-[var(--z-fg)]">{templateName}</span>
          <span className="text-[var(--z-muted)]"> · read-only</span>
        </p>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="shrink-0">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--z-muted)]">
              Subject
            </div>
            {subjectEmpty ? (
              <p className="text-sm italic text-[var(--z-muted)]">
                (No subject in this template)
              </p>
            ) : (
              <p className="whitespace-pre-wrap text-sm text-[var(--z-fg)]">
                {renderedSubject}
              </p>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1">
            <div className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--z-muted)]">
              Body
            </div>
            <div className="min-h-[120px] flex-1 overflow-y-auto rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2">
              <pre className="whitespace-pre-wrap break-words font-sans text-sm text-[var(--z-fg)]">
                {renderedBody}
              </pre>
            </div>
          </div>
        </div>

        <footer className="shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-sm text-[var(--z-fg)] hover:bg-[var(--z-surface-hover)]"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
