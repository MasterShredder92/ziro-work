"use client";

import type { AutomationActionDef } from "@/lib/automation/workflows/types";
import { ACTION_CATALOG } from "@/lib/automation/workflows/types";

export type ActionEditorProps = {
  open: boolean;
  action: AutomationActionDef | null;
  onClose: () => void;
  onSave: (action: AutomationActionDef) => void;
};

export function ActionEditor({ open, action, onClose, onSave }: ActionEditorProps) {
  if (!open || !action) return null;
  const catalog = ACTION_CATALOG.find((entry) => entry.type === action.type) ?? null;

  return (
    <div className="fixed inset-0 z-[70] flex" role="presentation">
      <button
        type="button"
        className="flex-1 bg-black/45"
        aria-label="Close action editor"
        onClick={onClose}
      />
      <aside className="h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-96">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
            <div className="text-sm font-semibold text-[var(--z-fg)]">Action editor</div>
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
              Action type
              <select
                value={action.type}
                onChange={(e) =>
                  onSave({
                    ...action,
                    type: e.target.value,
                    config: {},
                  })
                }
                className="mt-1 w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              >
                {ACTION_CATALOG.map((entry) => (
                  <option key={entry.type} value={entry.type}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-[var(--z-muted)]">
              Label
              <input
                value={action.label ?? ""}
                onChange={(e) => onSave({ ...action, label: e.target.value })}
                className="mt-1 w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              />
            </label>
            <label className="block text-xs text-[var(--z-muted)]">
              On error
              <select
                value={action.onError ?? "fail"}
                onChange={(e) =>
                  onSave({
                    ...action,
                    onError: e.target.value as AutomationActionDef["onError"],
                  })
                }
                className="mt-1 w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              >
                <option value="fail">fail</option>
                <option value="retry">retry</option>
                <option value="continue">continue</option>
              </select>
            </label>
            {catalog?.configSchema
              ? Object.entries(catalog.configSchema).map(([k, v]) => (
                  <label key={k} className="block text-xs text-[var(--z-muted)]">
                    {v.label}
                    {v.required ? " *" : ""}
                    <input
                      type={v.type === "number" ? "number" : "text"}
                      value={String(action.config?.[k] ?? "")}
                      onChange={(e) =>
                        onSave({
                          ...action,
                          config: {
                            ...(action.config ?? {}),
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
