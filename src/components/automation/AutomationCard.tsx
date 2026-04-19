"use client";

import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/components/ui/utils";

export type AutomationCardProps = {
  title: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
};

export function AutomationCard({ title, description, enabled, onEnabledChange }: AutomationCardProps) {
  return (
    <Card
      padding="md"
      radius="md"
      variant="elevated"
      className={cn(
        "border-[var(--z-border)] transition-[border-color,box-shadow] duration-200",
        enabled &&
          "border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_88%)]",
      )}
    >
      <Switch checked={enabled} onCheckedChange={onEnabledChange} label={title} description={description} />
    </Card>
  );
}
