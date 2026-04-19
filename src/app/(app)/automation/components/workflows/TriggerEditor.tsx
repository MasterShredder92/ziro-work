"use client";

import type { AutomationTriggerDef } from "@/lib/automation/workflows/types";
import { TRIGGER_CATALOG } from "@/lib/automation/workflows/types";

export type TriggerEditorProps = {
  open: boolean;
  trigger: AutomationTriggerDef;
  onClose: () => void;
  onSave: (trigger: AutomationTriggerDef) => void;
};

export function TriggerEditor({ open, trigger, onClose, onSave }: TriggerEditorProps) {
  if (!open) return null;

  const triggerEntry = TRIGGER_CATALOG.find((t) => t.type === trigger.type) ?? null;

  return (
    <div className="fixed inset-0 z-[70] flex" role="presentation">
      <button
        type="button"
        className="flex-1 bg-black/45"
        aria-label="Close trigger editor"
        onClick={onClose}
      />
      <aside className="h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-96">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
            <div className="text-sm font-semibold text-[var(--z-fg)]">Trigger editor</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-white/[0.05]"
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            <label className="block text-xs text-[var(--z-muted)]">
              Trigger type
              <select
                value={trigger.type}
                onChange={(e) =>
                  onSave({
                    ...trigger,
                    type: e.target.value,
                    config: {},
                  })
                }
                className="mt-1 w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              >
                {TRIGGER_CATALOG.map((item) => (
                  <option key={item.type} value={item.type}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            {triggerEntry?.description ? (
              <p className="text-xs text-[var(--z-muted)]">{triggerEntry.description}</p>
            ) : null}
            {triggerEntry?.configSchema
              ? Object.entries(triggerEntry.configSchema).map(([k, v]) => (
                  <label key={k} className="block text-xs text-[var(--z-muted)]">
                    {v.label}
                    {v.required ? " *" : ""}
                    <input
                      type={v.type === "number" ? "number" : "text"}
                      value={String(trigger.config?.[k] ?? "")}
                      onChange={(e) =>
                        onSave({
                          ...trigger,
                          config: {
                            ...(trigger.config ?? {}),
                            [k]: e.target.value,
                          },
                        })
                      }
                      className="mt-1 w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
                    />
                  </label>
                ))
              : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
