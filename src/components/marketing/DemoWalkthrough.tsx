"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";
import { cn, focusRingClassName } from "@/components/ui/utils";

const steps = ["Map", "Lifecycle", "Dashboard"] as const;

export function DemoWalkthrough() {
  const { trackEvent } = useAnalytics();
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    trackEvent("demo_mode_enter", {});
  }, [trackEvent]);

  return (
    <div className="space-y-[var(--z-space-10)]">
      <PageHeader
        title="Interactive demo"
        subtitle="A lightweight walkthrough—no tenant writes, pure UI signal."
      />
      <Section title="Steps" accent spacing="default">
        <div className="flex flex-wrap gap-2">
          {steps.map((label, i) => (
            <Button
              key={label}
              type="button"
              variant={i === step ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                setStep(i);
                trackEvent("demo_mode_step", { step: label, index: i });
              }}
            >
              {label}
            </Button>
          ))}
        </div>
        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="mt-[var(--z-space-4)]">
          <p className="text-sm text-[var(--z-muted)]">
            {step === 0 && "Studio Map orbits teachers and lazy-loads rosters with neon affordances."}
            {step === 1 && "Lifecycle spine keeps intake → win-back receipts aligned with tokens."}
            {step === 2 && "Dashboard concentrates KPIs, feed, and quick actions without breaking flow."}
          </p>
        </Card>
        <Link
          prefetch
          href="/dashboard"
          className={cn(
            "mt-6 inline-flex h-10 items-center justify-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-5 text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]",
            focusRingClassName(),
          )}
          onClick={() => trackEvent("demo_mode_open_app", {})}
        >
          Open live app
        </Link>
      </Section>
    </div>
  );
}
