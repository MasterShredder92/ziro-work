import type { Metadata } from "next";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";
import { MarketingTrackedLink } from "@/components/marketing/MarketingTrackedLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { cn, focusRingClassName } from "@/components/ui/utils";

const desc =
  "We build the console we wanted while operating high-touch studios—guided onboarding, demo mode, and neon-grade UI.";

export const metadata: Metadata = mergePageMetadata({
  title: "About",
  description: desc,
  openGraph: {
    title: "About · ZiroWork",
    description: desc,
    url: `${siteBaseUrl()}/about`,
  },
  twitter: { title: "About · ZiroWork", description: desc },
});

const cta = cn(
  "mt-6 inline-flex h-10 items-center justify-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-5 text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]",
  focusRingClassName()
);

export default function AboutPage() {
  return (
    <div className="space-y-[var(--z-space-12)]">
      <PageHeader
        title="About ZiroWork"
        subtitle="We build the console we wanted while operating high-touch studios."
      />
      <Section title="Updates" accent>
        <Card variant="outline" padding="md">
          <ul className="space-y-3 text-sm text-[var(--z-muted)]">
            <li>
              <span className="font-semibold text-[var(--z-fg)]">Apr 2026</span> — Guided onboarding, demo mode,
              marketing shell, and interactive tour.
            </li>
            <li>
              <span className="font-semibold text-[var(--z-fg)]">Mar 2026</span> — Global intelligence layer: search,
              palette, notifications.
            </li>
          </ul>
        </Card>
        <MarketingTrackedLink href="/features" eventName="marketing_cta_about_features" className={cta}>
          Read feature notes
        </MarketingTrackedLink>
      </Section>
    </div>
  );
}
