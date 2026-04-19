"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";

export type OnboardingChecklistItem = {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  actionLabel: string;
  onAction: () => void;
};

export type OnboardingChecklistProps = {
  steps: OnboardingChecklistItem[];
};

export function OnboardingChecklist({ steps }: OnboardingChecklistProps) {
  return (
    <ol className="space-y-[var(--z-space-4)]">
      {steps.map((step, idx) => (
        <li
          key={step.id}
          className={cn(
            "flex gap-[var(--z-space-4)] rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-4)] sm:p-[var(--z-space-5)]",
            step.done && "border-[color-mix(in_oklab,var(--z-accent),transparent_65%)]"
          )}
        >
          <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border text-[var(--z-fg)]",
                step.done
                  ? "border-[var(--z-accent)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)] text-black"
                  : "border-[var(--z-border-2)] bg-[var(--z-surface-2)]"
              )}
              aria-label={step.done ? "Completed" : "Not completed"}
            >
              {step.done ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
            </span>
          </div>
          <div className="min-w-0 flex-1 space-y-[var(--z-space-3)]">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-extrabold text-[var(--z-fg)]">{step.title}</div>
                {step.description ? (
                  <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_38%)]">
                    {step.description}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant={step.done ? "secondary" : "primary"}
                size="sm"
                className="mt-2 w-full shrink-0 sm:mt-0 sm:w-auto"
                onClick={step.onAction}
              >
                {step.actionLabel}
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
