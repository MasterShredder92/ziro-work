"use client";

import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";

export type SliderProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  hint?: string;
  onValueChange?: (value: number) => void;
  /** Display-only track (no pointer interaction). */
  readOnly?: boolean;
};

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { className, label, hint, id, onValueChange, onChange, readOnly, ...props },
  ref
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
        type="range"
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : undefined}
        {...props}
        className={cn(
          "h-2 w-full appearance-none rounded-full bg-[var(--z-surface-2)] accent-[var(--z-accent-color,var(--z-accent))]",
          readOnly ? "pointer-events-none cursor-default" : "cursor-pointer",
          "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[color-mix(in_oklab,var(--z-accent-color,var(--z-accent)),transparent_30%)] [&::-webkit-slider-thumb]:bg-[var(--z-accent-color,var(--z-accent))] [&::-webkit-slider-thumb]:shadow-[0_0_calc(10px*var(--z-neon-strength,1))_color-mix(in_oklab,var(--z-accent-color,var(--z-accent)),transparent_55%)]",
          focusRingClassName(),
          className,
        )}
        onChange={(e) => {
          if (readOnly) return;
          onChange?.(e);
          const v = Number((e.target as HTMLInputElement).value);
          if (Number.isFinite(v)) onValueChange?.(v);
        }}
      />
      {hint ? <p className="text-xs text-[var(--z-muted)]">{hint}</p> : null}
    </div>
  );
});
