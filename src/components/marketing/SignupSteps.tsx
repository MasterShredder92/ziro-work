"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";

export function SignupSteps() {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const [step, setStep] = React.useState(0);
  const [studio, setStudio] = React.useState("");

  const advance = () => {
    trackEvent("signup_flow_step", { step, studio });
    if (step >= 2) {
      trackEvent("signup_flow_complete", { studio });
      router.push("/onboarding");
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="space-y-[var(--z-space-10)]">
      <PageHeader title="Start free trial" subtitle="Three quick steps—everything stays UI-only until backend wiring." />
      <Section title={`Step ${step + 1} of 3`} accent spacing="default">
        {step === 0 ? (
          <Input label="Studio name" value={studio} onChange={(e) => setStudio(e.target.value)} />
        ) : null}
        {step === 1 ? (
          <p className="text-sm text-[var(--z-muted)]">Invite teammates after provisioning—placeholder step.</p>
        ) : null}
        {step === 2 ? (
          <p className="text-sm text-[var(--z-muted)]">Confirm plan tier (mock) and continue into onboarding.</p>
        ) : null}
        <Button type="button" variant="primary" size="md" className="mt-4" onClick={advance}>
          {step >= 2 ? "Finish & go to onboarding" : "Continue"}
        </Button>
      </Section>
    </div>
  );
}
