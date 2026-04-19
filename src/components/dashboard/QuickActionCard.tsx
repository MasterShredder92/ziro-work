"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";

export type QuickActionCardProps = {
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
};

export function QuickActionCard({ title, description, actionLabel, onClick }: QuickActionCardProps) {
  return (
    <Card
      padding="md"
      radius="md"
      variant="default"
      className={cn(
        "neon-ramp group transition-[border-color,box-shadow] duration-[var(--z-duration-fast)] [transition-timing-function:var(--z-ease-smooth)]",
        "hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_55%)]",
      )}
    >
      <div className="flex flex-col gap-[var(--z-space-4)] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-[var(--z-space-2)]">
          <h3 className="text-sm font-extrabold tracking-tight text-[var(--z-fg)]">{title}</h3>
          <p className="text-xs leading-relaxed text-[var(--z-muted)]">{description}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0 border-[var(--z-border)] group-hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] group-hover:text-[var(--z-accent)]"
          onClick={onClick}
        >
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}
