"use client";

import { useEffect, useRef } from "react";

type NotesPopoverEditorProps = {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function NotesPopoverEditor({
  value,
  onChange,
  onSave,
  onCancel,
}: NotesPopoverEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div
      ref={rootRef}
      className="absolute right-0 z-40 mt-1 w-80 rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] p-2 shadow-xl"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
          return;
        }
        if (event.key === "Enter" && event.ctrlKey) {
          event.preventDefault();
          onSave();
          return;
        }
        if (event.key !== "Tab") return;
        const focusables = rootRef.current?.querySelectorAll<HTMLElement>(
          'textarea,button,[href],[tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (event.shiftKey && active === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <textarea
        ref={textareaRef}
        aria-label="Notes editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={6}
        className="w-full resize-y rounded border border-[var(--z-border,#1c1c1e)] bg-black px-2 py-1.5 text-sm text-[var(--z-fg,#f0f0f0)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent,#c4f036)]"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-2 py-1 text-xs text-[var(--z-muted,#909098)] hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded bg-[var(--z-accent,#c4f036)]/15 px-2 py-1 text-xs font-semibold text-[var(--z-accent,#c4f036)]"
        >
          Save
        </button>
      </div>
    </div>
  );
}
