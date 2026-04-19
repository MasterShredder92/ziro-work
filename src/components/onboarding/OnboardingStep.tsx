"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export type OnboardingStepProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export function OnboardingStep({ title, description, actionLabel, onAction }: OnboardingStepProps) {
  return (
    <Card
      variant="elevated"
      padding="md"
      radius="lg"
      className="border-[color-mix(in_oklab,var(--z-accent),transparent_78%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_88%)]"
    >
      <div className="space-y-[var(--z-space-3)]">
        <div className="text-sm font-extrabold text-[var(--z-fg)]">{title}</div>
        <p className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_38%)]">{description}</p>
        <Button type="button" variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}
