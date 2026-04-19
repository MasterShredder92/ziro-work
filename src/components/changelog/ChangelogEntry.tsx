"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils/cn";

export type ChangelogEntryProps = {
  version: string;
  date: string;
  items: string[];
  className?: string;
};

export function ChangelogEntry({ version, date, items, className }: ChangelogEntryProps) {
  return (
    <Card
      variant="elevated"
      padding="lg"
      radius="lg"
      shadow="sm"
      className={cn(
        "border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_78%),0_0_28px_color-mix(in_oklab,var(--z-accent),transparent_88%)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-[var(--z-space-3)]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" active>
            {version}
          </Badge>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">{date}</span>
        </div>
      </div>
      <ul className="mt-[var(--z-space-5)] space-y-[var(--z-space-3)] text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
        {items.map((item, idx) => (
          <li key={`${idx}-${item}`} className="flex gap-[var(--z-space-3)]">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--z-accent)] shadow-[0_0_10px_color-mix(in_oklab,var(--z-accent),transparent_55%)]"
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
