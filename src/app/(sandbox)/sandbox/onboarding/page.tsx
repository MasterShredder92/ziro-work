"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";

export default function SandboxOnboardingPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl space-y-[var(--z-space-8)]">
        <PageHeader title="Sandbox · Onboarding checklist" subtitle="Visual QA only — no persistence." />
        <OnboardingChecklist
          steps={[
            {
              id: "a",
              title: "Sample step A",
              description: "Demonstrates completed state styling.",
              done: true,
              actionLabel: "Action",
              onAction: () => {},
            },
            {
              id: "b",
              title: "Sample step B",
              description: "Demonstrates pending state + primary action.",
              done: false,
              actionLabel: "Continue",
              onAction: () => {},
            },
          ]}
        />
      </div>
    </PageShell>
  );
}
