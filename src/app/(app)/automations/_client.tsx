"use client";

import * as React from "react";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { HubLink } from "@/components/publishing/HubLink";
import { AutomationCard } from "@/components/automation/AutomationCard";

export function AutomationsClient() {
  const [nurture, setNurture] = React.useState(true);
  const [winBack, setWinBack] = React.useState(false);
  const [referral, setReferral] = React.useState(true);

  return (
    <PageShell>
      <div className="flex flex-col gap-[var(--z-space-8)]">
        <div className="flex flex-col gap-[var(--z-space-3)]">
          <PageHeader
            title="Automations"
            subtitle="Marketing toggles for UX review — no server wiring yet."
          />
          <HubLink label="Back to Publishing Hub" href="/publishing-hub" />
        </div>
        <div className="grid max-w-3xl grid-cols-1 gap-[var(--z-space-4)]">
          <AutomationCard
            title="Nurture sequence"
            description="Drip reminders after trial and first invoice to keep momentum."
            enabled={nurture}
            onEnabledChange={setNurture}
          />
          <AutomationCard
            title="Win-back sequence"
            description="Re-engage paused students with escalating offers and social proof."
            enabled={winBack}
            onEnabledChange={setWinBack}
          />
          <AutomationCard
            title="Referral prompt"
            description="Ask happy families for referrals after their fifth completed lesson."
            enabled={referral}
            onEnabledChange={setReferral}
          />
        </div>
      </div>
    </PageShell>
  );
}
