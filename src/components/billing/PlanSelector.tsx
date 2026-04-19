"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";

export type BillingPlanOption = {
  id: string;
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
};

export type PlanSelectorProps = {
  plans: BillingPlanOption[];
  selectedPlanId?: string | null;
  onSelect?: (planId: string) => void;
  className?: string;
};

export function PlanSelector({ plans, selectedPlanId, onSelect, className }: PlanSelectorProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-[var(--z-space-4)] md:grid-cols-2 xl:grid-cols-3", className)}>
      {plans.map((p) => {
        const selected = p.id === selectedPlanId;
        return (
          <Card
            key={p.id}
            variant="elevated"
            padding="lg"
            radius="lg"
            shadow="sm"
            className={cn(
              "group z-card-interact flex h-full flex-col border-[var(--z-border)]",
              "hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)]",
              "hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent-color),transparent_72%),0_0_28px_color-mix(in_oklab,var(--z-accent-color),transparent_85%)]",
              p.highlighted && "border-[color-mix(in_oklab,var(--z-accent-color),transparent_40%)]",
              selected && "ring-1 ring-[color-mix(in_oklab,var(--z-accent-color),transparent_55%)]",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-lg font-extrabold tracking-tight text-[var(--z-fg)] group-hover:text-[var(--z-accent-color)]">
                {p.name}
              </div>
              {p.highlighted ? (
                <Badge variant="success" active>
                  Popular
                </Badge>
              ) : null}
            </div>
            <div className="mt-2 text-2xl font-extrabold text-[var(--z-accent-color)]">{p.price}</div>
            <ul className="mt-[var(--z-space-4)] flex-1 space-y-2 text-xs text-[color-mix(in_oklab,var(--z-fg),transparent_18%)]">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--z-accent-color)] shadow-[0_0_8px_color-mix(in_oklab,var(--z-accent-color),transparent_55%)]" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant={selected ? "secondary" : "primary"}
              className="mt-[var(--z-space-6)] w-full"
              disabled={!onSelect}
              onClick={() => onSelect?.(p.id)}
            >
              {selected ? "Current plan" : "Select plan (UI)"}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
