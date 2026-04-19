"use client";

import { useEffect, useRef } from "react";

export interface FolderDescriptionEditorProps {
  value: string | null;
  onChange: (v: string | null) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function normalizeFolderDescription(value: string | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function folderDescriptionPreview(value: string | null, max = 60): string | null {
  const normalized = normalizeFolderDescription(value);
  if (!normalized) return null;
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

export function FolderDescriptionEditor({
  value,
  onChange,
  onSave,
  onCancel,
}: FolderDescriptionEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const saveRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.selectionStart = el.value.length;
    el.selectionEnd = el.value.length;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const focusables = () => [textareaRef.current, cancelRef.current, saveRef.current].filter(
    Boolean,
  ) as HTMLElement[];

  return (
    <div
      className="w-[260px] rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-2 shadow-lg"
      role="dialog"
      aria-label="Edit folder description"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
          return;
        }
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          onSave();
          return;
        }
        if (e.key === "Tab") {
          const els = focusables();
          if (els.length === 0) return;
          const active = document.activeElement as HTMLElement | null;
          const idx = active ? els.indexOf(active) : -1;
          const next = e.shiftKey
            ? els[(idx - 1 + els.length) % els.length]
            : els[(idx + 1) % els.length];
          if (next) {
            e.preventDefault();
            next.focus();
          }
        }
      }}
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        Description
      </div>
      <textarea
        ref={textareaRef}
        value={value ?? ""}
        rows={3}
        placeholder="Add a folder description…"
        className="max-h-40 min-h-[72px] w-full resize-none rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
        onChange={(e) => {
          onChange(e.target.value);
          resize();
        }}
      />
      <div className="mt-2 flex justify-end gap-1.5">
        <button
          ref={cancelRef}
          type="button"
          className="rounded border border-[var(--z-border)] px-2 py-1 text-[11px] text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          ref={saveRef}
          type="button"
          className="rounded bg-[var(--z-accent)] px-2 py-1 text-[11px] font-semibold text-black hover:opacity-90"
          onClick={onSave}
        >
          Save
        </button>
      </div>
      <div className="mt-1 text-[10px] text-[var(--z-muted)]">Ctrl+Enter to save</div>
    </div>
  );
}
