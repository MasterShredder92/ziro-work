"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils";

export type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
};

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <Card
      variant="elevated"
      padding="lg"
      radius="lg"
      className={cn(
        "border-[color-mix(in_oklab,var(--z-accent),transparent_78%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_88%)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]",
        className
      )}
    >
      <div className="flex items-start gap-[var(--z-space-4)]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--z-radius-md)] border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] text-black">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-[var(--z-fg)]">{title}</h3>
          <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_38%)]">{description}</p>
        </div>
      </div>
    </Card>
  );
}
