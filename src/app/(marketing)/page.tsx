import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";
import { MarketingTrackedLink } from "@/components/marketing/MarketingTrackedLink";
import { Card } from "@/components/ui/Card";
import { cn, focusRingClassName } from "@/components/ui/utils";

const homeDesc =
  "The operating system for serious music studios—lifecycle, billing, agents, and studio map in a charcoal console with neon signal.";

export const metadata: Metadata = mergePageMetadata({
  title: "Home",
  description: homeDesc,
  openGraph: {
    title: "ZiroWork · Operating system for studios",
    description: homeDesc,
    url: siteBaseUrl(),
  },
  twitter: { title: "ZiroWork", description: homeDesc },
});

const HeroOrb = dynamic(() => import("@/components/marketing/HeroOrb").then((m) => m.HeroOrb), {
  ssr: true,
  loading: () => (
    <div className="mx-auto aspect-square w-[min(72vw,320px)] max-w-sm animate-pulse rounded-full bg-[var(--z-surface-2)]" />
  ),
});

const primaryCta = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-[var(--z-radius-md)] px-6 text-sm font-semibold transition-colors",
  "bg-[var(--z-accent)] text-black hover:bg-[color-mix(in_oklab,var(--z-accent),white_10%)]",
  focusRingClassName()
);

const secondaryCta = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-6 text-sm font-semibold transition-colors",
  "bg-[var(--z-surface)] text-[var(--z-fg)] hover:border-[var(--z-border-2)] hover:bg-[color-mix(in_oklab,var(--z-surface),white_4%)]",
  focusRingClassName()
);

const ghostCta = cn(
  "inline-flex h-10 items-center justify-center rounded-[var(--z-radius-md)] px-4 text-sm font-semibold transition-colors",
  "text-[var(--z-accent)] hover:bg-white/5",
  focusRingClassName()
);

export default function MarketingHomePage() {
  return (
    <div className="space-y-[var(--z-space-16)]">
      <section className="grid gap-[var(--z-space-10)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--z-accent)]">Founder polish</p>
          <h1 className="mt-[var(--z-space-3)] text-4xl font-extrabold tracking-tight text-[var(--z-fg)] sm:text-5xl">
            The operating system for serious music studios.
          </h1>
          <p className="mt-[var(--z-space-4)] max-w-xl text-lg text-[color-mix(in_oklab,var(--z-fg),transparent_35%)]">
            Lifecycle, billing, agents, and studio map — unified in a charcoal console with neon signal.
          </p>
          <div className="mt-[var(--z-space-6)] flex flex-wrap gap-3">
            <MarketingTrackedLink href="/onboarding" eventName="marketing_cta_onboarding_home" className={primaryCta}>
              Start onboarding
            </MarketingTrackedLink>
            <MarketingTrackedLink href="/dashboard" eventName="marketing_cta_jump_app_home" className={secondaryCta}>
              Jump to app
            </MarketingTrackedLink>
          </div>
        </div>
        <div className="flex flex-col items-center gap-[var(--z-space-6)]">
          <HeroOrb />
          <Card
            variant="elevated"
            padding="lg"
            radius="lg"
            className="w-full max-w-md border-[color-mix(in_oklab,var(--z-accent),transparent_70%)]"
          >
            <div className="space-y-3 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_30%)]">
              <p className="font-semibold text-[var(--z-fg)]">What ships today</p>
              <ul className="list-inside list-disc space-y-2">
                <li>Guided onboarding + demo mode</li>
                <li>Command palette & global search</li>
                <li>Studio map & lifecycle intelligence</li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-[var(--z-space-4)] sm:grid-cols-3">
        {[
          { t: "Lifecycle OS", d: "Intake → retention on one spine." },
          { t: "Neon-grade UI", d: "Tokens, cards, and motion tuned for focus." },
          { t: "Agent-native", d: "Automations with human-readable receipts." },
        ].map((f) => (
          <Card key={f.t} variant="outline" padding="md" radius="md">
            <div className="text-sm font-extrabold text-[var(--z-fg)]">{f.t}</div>
            <p className="mt-2 text-sm text-[var(--z-muted)]">{f.d}</p>
          </Card>
        ))}
      </section>

      <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-8)] text-center">
        <h2 className="text-2xl font-extrabold text-[var(--z-fg)]">Pricing that stays out of the way</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--z-muted)]">
          Simple seat-based tiers — detailed on the pricing page. Start in onboarding to configure your studio shell.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <MarketingTrackedLink href="/pricing" eventName="marketing_cta_pricing_home" className={primaryCta}>
            View pricing
          </MarketingTrackedLink>
          <MarketingTrackedLink href="/onboarding" eventName="marketing_cta_begin_setup_home" className={ghostCta}>
            Begin setup
          </MarketingTrackedLink>
        </div>
      </section>
    </div>
  );
}
