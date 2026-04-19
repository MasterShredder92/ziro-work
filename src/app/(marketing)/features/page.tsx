import type { Metadata } from "next";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";
import { MarketingTrackedLink } from "@/components/marketing/MarketingTrackedLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { cn, focusRingClassName } from "@/components/ui/utils";

const desc =
  "Everything in ZiroWork is designed for operators who live in the console daily—studio map, lifecycle spine, palette, and intelligence feed.";

export const metadata: Metadata = mergePageMetadata({
  title: "Features",
  description: desc,
  openGraph: {
    title: "Features · ZiroWork",
    description: desc,
    url: `${siteBaseUrl()}/features`,
  },
  twitter: { title: "Features · ZiroWork", description: desc },
});

const cta = cn(
  "mt-6 inline-flex h-10 items-center justify-center rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-5 text-sm font-semibold text-black transition-colors hover:bg-[color-mix(in_oklab,var(--z-accent),white_10%)]",
  focusRingClassName()
);

export default function FeaturesPage() {
  return (
    <div className="space-y-[var(--z-space-12)]">
      <PageHeader
        title="Features"
        subtitle="Everything in ZiroWork is designed for operators who live in the console daily."
      />
      <Section title="Surface area" accent spacing="loose">
        <div className="grid gap-[var(--z-space-4)] md:grid-cols-2">
          <Card variant="default" padding="md">
            <div className="text-sm font-extrabold text-[var(--z-fg)]">Studio map</div>
            <p className="mt-2 text-sm text-[var(--z-muted)]">
              Teachers, roster load, and drill-down without leaving the map.
            </p>
          </Card>
          <Card variant="default" padding="md">
            <div className="text-sm font-extrabold text-[var(--z-fg)]">Lifecycle spine</div>
            <p className="mt-2 text-sm text-[var(--z-muted)]">
              Intake through win-back with consistent stages and receipts.
            </p>
          </Card>
          <Card variant="default" padding="md">
            <div className="text-sm font-extrabold text-[var(--z-fg)]">Command palette</div>
            <p className="mt-2 text-sm text-[var(--z-muted)]">
              ⌘K navigation, search, and shortcuts without breaking flow.
            </p>
          </Card>
          <Card variant="default" padding="md">
            <div className="text-sm font-extrabold text-[var(--z-fg)]">Intelligence feed</div>
            <p className="mt-2 text-sm text-[var(--z-muted)]">
              Events, invoices, and risk surfaced with neon badges.
            </p>
          </Card>
        </div>
        <MarketingTrackedLink href="/onboarding" eventName="marketing_cta_features_onboarding" className={cta}>
          Configure in onboarding
        </MarketingTrackedLink>
      </Section>
    </div>
  );
}
