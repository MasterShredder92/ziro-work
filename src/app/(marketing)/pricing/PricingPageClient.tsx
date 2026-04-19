"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { PricingCalculator } from "@/components/pricing/PricingCalculator";
import { useMarketingConversion } from "@/components/marketing/MarketingConversionContext";
import { Button } from "@/components/ui/Button";
import { MarketingTrackedLink } from "@/components/marketing/MarketingTrackedLink";
import { cn, focusRingClassName } from "@/components/ui/utils";

const trial = cn(
  "inline-flex h-10 items-center justify-center rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-5 text-sm font-extrabold text-black transition-colors hover:bg-[color-mix(in_oklab,var(--z-accent),white_10%)]",
  focusRingClassName()
);

const demo = cn(
  "inline-flex h-10 items-center justify-center rounded-[var(--z-radius-md)] border border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] px-5 text-sm font-extrabold text-[var(--z-accent)] transition-colors hover:bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)]",
  focusRingClassName()
);

export function PricingPageClient() {
  const { openComparePlans } = useMarketingConversion();

  return (
    <div className="space-y-[var(--z-space-12)]">
      <PageHeader
        title="Pricing"
        subtitle="Transparent tiers for studios that want signal without bloat."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={openComparePlans}>
              Compare plans
            </Button>
            <MarketingTrackedLink href="/demo" eventName="marketing_pricing_try_demo" className={demo}>
              Try Demo
            </MarketingTrackedLink>
          </div>
        }
      />

      <Section title="Estimator" accent description="Slide roster shape — we highlight the recommended plan.">
        <PricingCalculator />
      </Section>

      <Section title="Plans" accent>
        <div className="grid gap-[var(--z-space-4)] md:grid-cols-3">
          {[
            {
              name: "Launch",
              price: "$49",
              blurb: "Solo director + one location.",
              bullets: ["Lifecycle", "Map", "Dashboard"],
            },
            {
              name: "Scale",
              price: "$129",
              blurb: "Multi-teacher roster + automations.",
              bullets: ["Automations", "Palette", "Priority"],
            },
            {
              name: "Command",
              price: "Talk",
              blurb: "Multi-site + API + white-glove.",
              bullets: ["Dedicated", "API", "SLA"],
            },
          ].map((p) => (
            <Card key={p.name} variant="elevated" padding="lg" radius="lg">
              <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--z-accent)]">{p.name}</div>
              <div className="mt-3 text-3xl font-extrabold text-[var(--z-fg)]">{p.price}</div>
              <p className="mt-2 text-sm text-[var(--z-muted)]">{p.blurb}</p>
              <ul className="mt-4 space-y-1 text-xs text-[color-mix(in_oklab,var(--z-fg),transparent_35%)]">
                {p.bullets.map((b) => (
                  <li key={b}>· {b}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <MarketingTrackedLink href="/signup" eventName="marketing_pricing_signup" className={trial}>
            Start free trial
          </MarketingTrackedLink>
          <MarketingTrackedLink href="/demo" eventName="marketing_pricing_demo_footer" className={demo}>
            Try Demo
          </MarketingTrackedLink>
          <Button type="button" variant="ghost" size="sm" onClick={openComparePlans}>
            Open compare drawer
          </Button>
        </div>
      </Section>
    </div>
  );
}
