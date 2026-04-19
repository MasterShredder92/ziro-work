"use client";

import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  "inline-flex items-center justify-center gap-2 font-semibold select-none whitespace-nowrap transition-colors z-hover-micro disabled:opacity-50 disabled:pointer-events-none";

const radius = "rounded-[var(--z-radius-md)]";

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--z-accent)] text-black hover:bg-[color-mix(in_oklab,var(--z-accent),white_10%)]",
  secondary:
    "bg-[var(--z-surface)] text-[var(--z-fg)] border border-[var(--z-border)] hover:border-[var(--z-border-2)] hover:bg-[color-mix(in_oklab,var(--z-surface),white_4%)]",
  ghost:
    "bg-transparent text-[var(--z-fg)] hover:bg-white/5 border border-transparent hover:border-[var(--z-border)]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, radius, sizeClass[size], variantClass[variant], focusRingClassName(), className)}
      {...props}
    />
  );
});

