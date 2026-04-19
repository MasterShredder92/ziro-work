import * as React from "react";
import { cn } from "./utils/cn";
import { H1, H2 } from "../premium/Typography";

export type PageHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLElement>, "title">;

export function PageHeader({ title, subtitle, actions, className, ...props }: PageHeaderProps) {
  return (
    <header
      {...props}
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <H1 className="truncate">{title}</H1>
        <div
          className="neon-ramp mt-3 h-[2px] w-14 rounded-full bg-[var(--z-accent-color)]"
          aria-hidden
        />
        {subtitle ? (
          <H2
            className="mt-2 text-base font-medium text-[color-mix(in_oklab,var(--z-fg),transparent_38%)] sm:text-lg"
            tone="default"
          >
            {subtitle}
          </H2>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

