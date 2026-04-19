import * as React from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils";

export type ColorSwatchProps = {
  name: string;
  value: string;
  className?: string;
};

export function ColorSwatch({ name, value, className }: ColorSwatchProps) {
  return (
    <Card
      variant="outline"
      padding="none"
      radius="md"
      className={cn(
        "overflow-hidden border-[color-mix(in_oklab,var(--z-accent),transparent_42%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_90%)]",
        className,
      )}
    >
      <div className="h-20 w-full" style={{ background: value }} aria-hidden />
      <div className="space-y-1 border-t border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2">
        <div className="text-xs font-semibold text-[var(--z-fg)]">{name}</div>
        <div className="font-mono text-[11px] text-[var(--z-muted)]">{value}</div>
      </div>
    </Card>
  );
}
