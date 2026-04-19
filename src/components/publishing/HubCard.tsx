"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils";

export type HubCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
};

export function HubCard({ icon, title, description, href }: HubCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-[var(--z-radius-md)] outline-none",
        "focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--z-accent),transparent_40%)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--z-bg)]",
      )}
    >
      <Card
        padding="lg"
        radius="md"
        variant="elevated"
        shadow="sm"
        className={cn(
          "h-full border-[var(--z-border)] transition-[border-color,box-shadow,transform] duration-200",
          "motion-safe:group-hover:scale-[1.02] motion-reduce:group-hover:scale-100",
          "group-hover:border-[color-mix(in_oklab,var(--z-accent),transparent_50%)]",
          "group-hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_72%),0_0_28px_color-mix(in_oklab,var(--z-accent),transparent_90%)]",
        )}
      >
        <div className="flex items-start gap-[var(--z-space-4)]">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)]",
              "transition-colors duration-200 group-hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] group-hover:text-[var(--z-accent)]",
            )}
            aria-hidden
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1 space-y-[var(--z-space-2)]">
            <h3 className="text-base font-extrabold tracking-tight text-[var(--z-fg)]">{title}</h3>
            <p className="text-sm leading-relaxed text-[var(--z-muted)]">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
