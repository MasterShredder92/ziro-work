"use client";

import * as React from "react";
import { cn } from "@/components/ui/utils";

type BadgeVariant = "success" | "warning" | "danger" | "neutral";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  active?: boolean;
};

const base =
  "inline-flex items-center gap-1 rounded-[999px] border px-2 py-0.5 text-xs font-semibold tracking-[-0.01em] select-none z-hover-micro-subtle";

const variantClass: Record<BadgeVariant, { base: string; active: string }> = {
  neutral: {
    base: "bg-[var(--z-surface-2)] text-[var(--z-fg)] border-[var(--z-border)]",
    active:
      "border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_70%)]",
  },
  success: {
    base:
      "bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] text-[var(--z-accent)] border-[color-mix(in_oklab,var(--z-accent),transparent_70%)]",
    active:
      "shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_65%),0_0_18px_color-mix(in_oklab,var(--z-accent),transparent_80%)]",
  },
  warning: {
    base:
      "bg-[color-mix(in_oklab,var(--z-warning),transparent_92%)] text-[var(--z-warning)] border-[color-mix(in_oklab,var(--z-warning),transparent_70%)]",
    active:
      "shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-warning),transparent_65%),0_0_18px_color-mix(in_oklab,var(--z-warning),transparent_80%)]",
  },
  danger: {
    base:
      "bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] text-[var(--z-danger)] border-[color-mix(in_oklab,var(--z-danger),transparent_70%)]",
    active:
      "shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-danger),transparent_65%),0_0_18px_color-mix(in_oklab,var(--z-danger),transparent_80%)]",
  },
};

export function Badge({ className, variant = "neutral", active = false, ...props }: BadgeProps) {
  const v = variantClass[variant];
  return <span className={cn(base, v.base, active && v.active, className)} {...props} />;
}

