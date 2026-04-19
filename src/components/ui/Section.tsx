import * as React from "react";
import { cn } from "./utils/cn";
import { Body, Caption, H3 } from "../premium/Typography";

export type SectionSpacing = "tight" | "default" | "loose";

export type SectionProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  accent?: boolean;
  spacing?: SectionSpacing;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

const spacingClass: Record<SectionSpacing, string> = {
  tight: "gap-3",
  default: "gap-5",
  loose: "gap-7",
};

export function Section({
  title,
  description,
  accent = false,
  spacing = "default",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section {...props} className={cn("flex flex-col", spacingClass[spacing], className)}>
      {title || description ? (
        <div className="flex flex-col gap-1">
          {title ? (
            <div className="flex items-start gap-3">
              {accent ? (
                <span
                  aria-hidden="true"
                  className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--z-accent)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--z-accent),transparent_86%)]"
                />
              ) : null}
              <H3 className={cn(accent ? "text-[var(--z-fg)]" : undefined)}>{title}</H3>
            </div>
          ) : null}
          {description ? (
            <Caption className="max-w-3xl text-[color-mix(in_oklab,var(--z-fg),transparent_40%)]">
              {description}
            </Caption>
          ) : null}
        </div>
      ) : null}

      <Body as="div" className="contents">
        {children}
      </Body>
    </section>
  );
}

