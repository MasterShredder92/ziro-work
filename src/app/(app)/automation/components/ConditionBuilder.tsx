"use client";

import type { AutomationCondition, AutomationConditionOp } from "@/lib/automation/types";

const OPS: AutomationConditionOp[] = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "nin",
  "exists",
  "not_exists",
  "contains",
];

export type ConditionBuilderProps = {
  conditions: AutomationCondition[];
  onChange: (next: AutomationCondition[]) => void;
  disabled?: boolean;
};

export function ConditionBuilder({
  conditions,
  onChange,
  disabled,
}: ConditionBuilderProps) {
  const update = (index: number, patch: Partial<AutomationCondition>) => {
    const next = conditions.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([
      ...conditions,
      { path: "payload.", op: "eq", value: "" } satisfies AutomationCondition,
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
          Conditions (all must match)
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={add}
          className="text-xs font-semibold text-[var(--z-accent)] hover:underline disabled:opacity-50"
        >
          + Add condition
        </button>
      </div>

      {conditions.length === 0 ? (
        <div className="text-xs text-[var(--z-muted)] italic">
          No conditions — the rule fires whenever the trigger matches.
        </div>
      ) : (
        <div className="space-y-2">
          {conditions.map((c, i) => (
            <div
              key={`${i}-${c.path}`}
              className="flex flex-wrap items-center gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-2"
            >
              <input
                type="text"
                value={c.path}
                disabled={disabled}
                placeholder="payload.field"
                onChange={(e) => update(i, { path: e.target.value })}
                className="flex-1 min-w-[160px] rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs font-mono text-[var(--z-fg)]"
              />
              <select
                value={c.op}
                disabled={disabled}
                onChange={(e) =>
                  update(i, { op: e.target.value as AutomationConditionOp })
                }
                className="rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]"
              >
                {OPS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
              {c.op !== "exists" && c.op !== "not_exists" ? (
                <input
                  type="text"
                  value={String(c.value ?? "")}
                  disabled={disabled}
                  placeholder="value"
                  onChange={(e) => update(i, { value: e.target.value })}
                  className="flex-1 min-w-[120px] rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]"
                />
              ) : null}
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(i)}
                className="text-xs text-[var(--z-danger)] hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
