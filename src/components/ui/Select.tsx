"use client";

import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";

export type SelectOption = { value: string; label: string };

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  options: SelectOption[];
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, hint, id, options, ...props },
  ref
) {
  const autoId = React.useId();
  const selectId = id ?? autoId;
  return (
    <div className={cn("flex flex-col gap-[var(--z-space-2)]", className)}>
      {label ? (
        <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-10 w-full appearance-none rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] pr-9 text-sm text-[var(--z-fg)]",
            "hover:border-[var(--z-border-2)]",
            focusRingClassName(),
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-r border-[var(--z-muted)]"
        />
      </div>
      {hint ? <p className="text-xs text-[var(--z-muted)]">{hint}</p> : null}
    </div>
  );
});
