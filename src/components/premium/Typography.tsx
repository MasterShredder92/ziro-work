import * as React from "react";
import { cn } from "./utils/cn";

type TextTone = "default" | "muted" | "accent" | "danger" | "warning";
type TextAlign = "left" | "center" | "right";

const toneClass: Record<TextTone, string> = {
  default: "text-[var(--z-fg)]",
  muted: "text-[color-mix(in_oklab,var(--z-fg),transparent_35%)]",
  accent: "text-[var(--z-accent)]",
  danger: "text-[var(--z-danger)]",
  warning: "text-[var(--z-warning)]",
};

const alignClass: Record<TextAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  tone?: TextTone;
  align?: TextAlign;
};

function headingBase(className?: string) {
  return cn(
    "font-[var(--z-font-sans)] tracking-[-0.02em] text-balance",
    toneClass.default,
    className,
  );
}

export function H1({ className, tone = "default", align = "left", ...props }: HeadingProps) {
  return (
    <h1
      {...props}
      className={cn(
        headingBase("text-3xl sm:text-4xl font-semibold leading-[1.05]"),
        toneClass[tone],
        alignClass[align],
        className,
      )}
    />
  );
}

export function H2({ className, tone = "default", align = "left", ...props }: HeadingProps) {
  return (
    <h2
      {...props}
      className={cn(
        headingBase("text-2xl sm:text-3xl font-semibold leading-[1.1]"),
        toneClass[tone],
        alignClass[align],
        className,
      )}
    />
  );
}

export function H3({ className, tone = "default", align = "left", ...props }: HeadingProps) {
  return (
    <h3
      {...props}
      className={cn(
        headingBase("text-xl sm:text-2xl font-semibold leading-[1.15]"),
        toneClass[tone],
        alignClass[align],
        className,
      )}
    />
  );
}

export function H4({ className, tone = "default", align = "left", ...props }: HeadingProps) {
  return (
    <h4
      {...props}
      className={cn(
        headingBase("text-lg sm:text-xl font-semibold leading-[1.2]"),
        toneClass[tone],
        alignClass[align],
        className,
      )}
    />
  );
}

export function H5({ className, tone = "default", align = "left", ...props }: HeadingProps) {
  return (
    <h5
      {...props}
      className={cn(
        headingBase("text-base sm:text-lg font-semibold leading-[1.25]"),
        toneClass[tone],
        alignClass[align],
        className,
      )}
    />
  );
}

export function H6({ className, tone = "default", align = "left", ...props }: HeadingProps) {
  return (
    <h6
      {...props}
      className={cn(
        headingBase("text-sm sm:text-base font-semibold leading-[1.25]"),
        toneClass[tone],
        alignClass[align],
        className,
      )}
    />
  );
}

export type TextProps<TTag extends keyof React.JSX.IntrinsicElements> = {
  as?: TTag;
  tone?: TextTone;
  align?: TextAlign;
} & React.ComponentPropsWithoutRef<TTag>;

export function Body<TTag extends keyof React.JSX.IntrinsicElements = "p">({
  as,
  className,
  tone = "default",
  align = "left",
  ...props
}: TextProps<TTag>) {
  const Comp = (as ?? "p") as unknown as React.ElementType;
  return (
    <Comp
      {...props}
      className={cn(
        "font-[var(--z-font-sans)] text-sm sm:text-[0.95rem] leading-relaxed tracking-[-0.01em]",
        toneClass[tone],
        alignClass[align],
        className,
      )}
    />
  );
}

export function Caption<TTag extends keyof React.JSX.IntrinsicElements = "p">({
  as,
  className,
  tone = "muted",
  align = "left",
  ...props
}: TextProps<TTag>) {
  const Comp = (as ?? "p") as unknown as React.ElementType;
  return (
    <Comp
      {...props}
      className={cn(
        "font-[var(--z-font-sans)] text-xs leading-snug tracking-[-0.01em]",
        toneClass[tone],
        alignClass[align],
        className,
      )}
    />
  );
}

