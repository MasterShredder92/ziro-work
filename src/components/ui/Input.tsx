"use client";

import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, id, ...props },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn("flex flex-col gap-[var(--z-space-2)]", className)}>
      {label ? (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "h-10 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] text-sm text-[var(--z-fg)] placeholder:text-[color-mix(in_oklab,var(--z-fg),transparent_55%)]",
          "hover:border-[var(--z-border-2)]",
          focusRingClassName(),
        )}
        {...props}
      />
      {hint ? <p className="text-xs text-[var(--z-muted)]">{hint}</p> : null}
    </div>
  );
});
