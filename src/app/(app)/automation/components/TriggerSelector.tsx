"use client";

import { BUILT_IN_TRIGGERS } from "@/lib/automation/types";
import type { AutomationTrigger } from "@/lib/automation/types";

export type TriggerSelectorProps = {
  value: AutomationTrigger;
  onChange: (next: AutomationTrigger) => void;
  disabled?: boolean;
};

export function TriggerSelector({ value, onChange, disabled }: TriggerSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
        Trigger event
      </label>
      <select
        value={value?.event ?? "lead.created"}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, event: e.target.value })}
        className="w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
      >
        {BUILT_IN_TRIGGERS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <div className="text-xs text-[var(--z-muted)]">
        Fired when this event is dispatched for the tenant.
      </div>
    </div>
  );
}
