"use client";

import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";

export type ListItem = {
  id: string;
  title: React.ReactNode;
  /** When "plain", title slot is not forced to truncated heading styles (for form controls). */
  titleLayout?: "default" | "plain";
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onPress?: () => void;
};

export type ListProps = React.HTMLAttributes<HTMLDivElement> & {
  items: ListItem[];
  /** Merged into each row (e.g. neon-ramp for command palette). */
  itemClassName?: string;
};

export function List({ items, itemClassName, className, ...props }: ListProps) {
  return (
    <div className={cn("space-y-[var(--z-space-3)]", className)} {...props}>
      {items.map((item) => {
        const body = (
          <>
            {item.icon ? (
              <div className="mt-0.5 text-[var(--z-muted)]">{item.icon}</div>
            ) : null}
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  item.titleLayout === "plain"
                    ? "min-w-0"
                    : "min-w-0 text-sm font-semibold text-[var(--z-fg)] truncate",
                )}
              >
                {item.title}
              </div>
              {item.description ? (
                <div className="mt-1 text-xs text-[var(--z-muted)]">{item.description}</div>
              ) : null}
            </div>
            {item.action ? (
              <div className="shrink-0">{item.action}</div>
            ) : null}
          </>
        );
        const rowClass = cn(
          "flex items-start gap-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-[var(--z-space-4)] py-[var(--z-space-3)] z-hover-micro-subtle",
          itemClassName,
        );
        if (item.onPress) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onPress}
              className={cn(
                rowClass,
                "w-full text-left transition-colors",
                "hover:border-[color-mix(in_oklab,var(--z-accent),transparent_65%)] hover:bg-[var(--z-surface-2)]",
                focusRingClassName()
              )}
            >
              {body}
            </button>
          );
        }
        return (
          <div key={item.id} className={rowClass}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

