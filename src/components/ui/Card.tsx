import * as React from "react";
import { cn } from "./utils/cn";

export type CardVariant = "default" | "elevated" | "outline";
export type CardPadding = "none" | "sm" | "md" | "lg";
export type CardRadius = "sm" | "md" | "lg";
export type CardShadow = "none" | "sm" | "md";

export type CardProps = {
  variant?: CardVariant;
  padding?: CardPadding;
  radius?: CardRadius;
  shadow?: CardShadow;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

const paddingClass: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

const radiusStyle: Record<CardRadius, React.CSSProperties> = {
  sm: { borderRadius: "var(--z-radius-sm)" },
  md: { borderRadius: "var(--z-radius-md)" },
  lg: { borderRadius: "var(--z-radius-lg)" },
};

const shadowClass: Record<CardShadow, string> = {
  none: "shadow-none",
  sm: "shadow-[0_10px_30px_-20px_rgba(0,0,0,0.75)]",
  md: "shadow-[0_20px_60px_-35px_rgba(0,0,0,0.85)]",
};

const variantClass: Record<CardVariant, string> = {
  default: "bg-[var(--z-surface)] border border-[var(--z-border)]",
  elevated:
    "bg-[color-mix(in_oklab,var(--z-surface),white_2%)] border border-[color-mix(in_oklab,var(--z-border),white_4%)]",
  outline: "bg-transparent border border-[var(--z-border-2)]",
};

export function Card({
  variant = "default",
  padding = "md",
  radius = "md",
  shadow = "none",
  className,
  style,
  children,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      style={{ ...radiusStyle[radius], ...style }}
      className={cn(
        "relative text-[var(--z-fg)] z-card-interact",
        variantClass[variant],
        paddingClass[padding],
        shadowClass[shadow],
        "transition-colors",
        className,
      )}
    >
      {children}
    </div>
  );
}

