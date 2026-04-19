"use client";

import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils/cn";

export type StudentRiskCardProps = {
  riskScore: number;
  className?: string;
};

function band(score: number) {
  if (score < 35) return { label: "Low", variant: "success" as const };
  if (score < 65) return { label: "Elevated", variant: "warning" as const };
  return { label: "Critical", variant: "danger" as const };
}

export function StudentRiskCard({ riskScore, className }: StudentRiskCardProps) {
  const { label, variant } = band(riskScore);
  return (
    <Card variant="elevated" padding="lg" radius="lg" shadow="sm" className={cn(className)}>
      <Section title="Retention risk" accent spacing="tight">
        <div className="flex flex-wrap items-end justify-between gap-[var(--z-space-4)]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">Composite score</div>
            <div className="mt-2 text-4xl font-black tracking-tight text-[var(--z-fg)]">{riskScore}</div>
            <div className="mt-1 text-xs text-[var(--z-muted)]">0 · 100 scale</div>
          </div>
          <Badge variant={variant} active className="text-sm">
            {label}
          </Badge>
        </div>
      </Section>
    </Card>
  );
}
