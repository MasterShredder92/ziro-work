"use client";

import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";

export type SwitchProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "role"> & {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label?: string;
  description?: string;
};

export function Switch({ checked, onCheckedChange, label, description, className, id, ...props }: SwitchProps) {
  const autoId = React.useId();
  const switchId = id ?? autoId;
  return (
    <div className={cn("flex items-start justify-between gap-[var(--z-space-4)]", className)}>
      <div className="min-w-0">
        {label ? (
          <div id={`${switchId}-label`} className="text-sm font-semibold text-[var(--z-fg)]">
            {label}
          </div>
        ) : null}
        {description ? <div className="mt-1 text-xs text-[var(--z-muted)]">{description}</div> : null}
      </div>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? `${switchId}-label` : undefined}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "flex h-7 w-12 shrink-0 items-center rounded-full border px-0.5 transition-colors",
          focusRingClassName(),
          checked
            ? "justify-end border-[color-mix(in_oklab,var(--z-accent-color,var(--z-accent)),transparent_35%)] bg-[color-mix(in_oklab,var(--z-accent-color,var(--z-accent)),transparent_82%)] shadow-[0_0_calc(12px*var(--z-neon-strength,1))_color-mix(in_oklab,var(--z-accent-color,var(--z-accent)),transparent_75%)]"
            : "justify-start border-[var(--z-border)] bg-[var(--z-surface-2)]",
        )}
        {...props}
      >
        <span
          className={cn(
            "h-6 w-6 rounded-full border border-transparent shadow-sm transition-colors",
            checked ? "bg-[var(--z-accent-color,var(--z-accent))]" : "bg-[color-mix(in_oklab,var(--z-fg),transparent_25%)]",
          )}
        />
      </button>
    </div>
  );
}
