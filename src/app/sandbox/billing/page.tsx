"use client";

import * as React from "react";
import { BillingSummaryCard } from "@/components/billing/BillingSummaryCard";
import { BillingUsageCard } from "@/components/billing/BillingUsageCard";
import { PlanSelector, type BillingPlanOption } from "@/components/billing/PlanSelector";
import { MOCK_USAGE_DEFAULTS } from "@/lib/billing/mockUsage";

const DEMO_PLANS: BillingPlanOption[] = [
  { id: "a", name: "Sandbox A", price: "$0", features: ["Demo row", "Neon hover"] },
  { id: "b", name: "Sandbox B", price: "$12", features: ["Meter preview", "Charcoal shell"], highlighted: true },
];

export default function SandboxBillingPage() {
  const [plan, setPlan] = React.useState<string | null>("b");

  return (
    <div className="min-h-full bg-[var(--z-bg)] p-[var(--z-space-8)] text-[var(--z-fg)]">
      <div className="mx-auto max-w-5xl space-y-[var(--z-space-10)]">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--z-muted)]">Sandbox</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Billing UI</h1>
        </header>

        <section className="space-y-[var(--z-space-3)]">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]">Summary</h2>
          <BillingSummaryCard planName="Sandbox" renewalDate="—" status="trialing" />
        </section>

        <section className="space-y-[var(--z-space-3)]">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]">Plan selector</h2>
          <PlanSelector plans={DEMO_PLANS} selectedPlanId={plan} onSelect={setPlan} />
        </section>

        <section className="space-y-[var(--z-space-3)]">
          <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]">Usage meters</h2>
          <BillingUsageCard
            usage={{
              ...MOCK_USAGE_DEFAULTS,
              activeStudents: 72,
              storageMB: 9200,
            }}
          />
        </section>
      </div>
    </div>
  );
}
