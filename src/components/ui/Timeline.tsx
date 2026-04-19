"use client";

import * as React from "react";
import { cn } from "@/components/ui/utils";

export type TimelineItemProps = {
  id: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  description?: React.ReactNode;
  accent?: boolean;
};

export type TimelineProps = React.HTMLAttributes<HTMLDivElement> & {
  items: TimelineItemProps[];
};

export function Timeline({ items, className, ...props }: TimelineProps) {
  return (
    <div className={cn("relative", className)} {...props}>
      <div
        className="pointer-events-none absolute left-[15px] top-2 bottom-2 w-px bg-[var(--z-border)] sm:left-[17px]"
        aria-hidden
      />
      <ul className="space-y-[var(--z-space-6)]">
        {items.map((item) => (
          <li key={item.id} className="relative flex gap-[var(--z-space-4)] pl-1 sm:gap-[var(--z-space-5)]">
            <div
              className={cn(
                "relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[var(--z-surface-2)] text-[var(--z-muted)] sm:h-9 sm:w-9",
                item.accent
                  ? "border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] text-[var(--z-accent)] shadow-[0_0_16px_color-mix(in_oklab,var(--z-accent),transparent_82%)]"
                  : "border-[var(--z-border)]",
              )}
            >
              {item.icon}
            </div>
            <div className="min-w-0 flex-1 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-[var(--z-space-4)] py-[var(--z-space-3)]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="text-sm font-semibold text-[var(--z-fg)]">{item.title}</div>
                {item.meta ? (
                  <div className="text-xs font-medium text-[var(--z-muted)] tabular-nums">{item.meta}</div>
                ) : null}
              </div>
              {item.description ? (
                <div className="mt-1 text-xs leading-relaxed text-[var(--z-muted)]">{item.description}</div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
