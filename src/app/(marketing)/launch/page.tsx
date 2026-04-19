import type { Metadata } from "next";
import Link from "next/link";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";
import { HeroOrb } from "@/components/marketing/HeroOrb";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { cn, focusRingClassName } from "@/components/ui/utils";

const desc =
  "Introducing ZiroWork—public launch with charcoal console polish, studio map depth, and lifecycle clarity for operators.";

export const metadata: Metadata = mergePageMetadata({
  title: "Launch",
  description: desc,
  openGraph: {
    title: "Introducing ZiroWork",
    description: desc,
    url: `${siteBaseUrl()}/launch`,
  },
  twitter: { title: "Introducing ZiroWork", description: desc },
});

const primaryCta = cn(
  "inline-flex h-11 items-center justify-center rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-6 text-sm font-semibold text-black transition-colors hover:bg-[color-mix(in_oklab,var(--z-accent),white_10%)]",
  focusRingClassName(),
);

const ghostCta = cn(
  "inline-flex h-11 items-center justify-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-6 text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] hover:text-[var(--z-accent)]",
  focusRingClassName(),
);

export default function LaunchPage() {
  return (
    <div className="space-y-[var(--z-space-12)]">
      <section className="grid items-center gap-[var(--z-space-10)] lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--z-accent)]">Public launch</div>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--z-fg)] sm:text-5xl">
            Introducing ZiroWork
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_22%)] sm:text-lg">
            The operating layer for studios that outgrew spreadsheets—lifecycle spine, studio map, billing signals, and
            neon-grade UI in one charcoal console.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className={primaryCta}>
              Create workspace
            </Link>
            <Link href="/press-kit" className={ghostCta}>
              Press kit
            </Link>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <HeroOrb />
        </div>
      </section>

      <Section title="What&apos;s new" accent spacing="loose">
        <div className="grid gap-[var(--z-space-4)] md:grid-cols-3">
          {[
            { t: "Studio Map", d: "Orb-first roster view with drill-ins that stay on the map." },
            { t: "Settings spine", d: "Tenant-aware panels with consistent charcoal + neon chrome." },
            { t: "Student depth", d: "Invoices, schedule, and risk cards on a single profile runway." },
          ].map((x) => (
            <Card key={x.t} variant="elevated" padding="md" radius="lg">
              <div className="text-sm font-extrabold text-[var(--z-fg)]">{x.t}</div>
              <p className="mt-2 text-sm text-[var(--z-muted)]">{x.d}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Why it matters" description="Operators need receipts, not noise—every surface answers a job to be done." accent>
        <Card variant="default" padding="lg" radius="lg" className="max-w-3xl text-sm leading-relaxed text-[var(--z-muted)]">
          Launch quality means predictable hierarchy: charcoal fields, neon only where it signals action, and motion that
          respects focus. ZiroWork keeps teachers, directors, and finance on the same timeline without losing the studio
          voice.
        </Card>
      </Section>

      <Section title="Feature highlights" accent>
        <div className="grid gap-[var(--z-space-4)] sm:grid-cols-2">
          {["Lifecycle stages with receipts", "Command palette + palette search", "Billing posture warnings", "Agent-ready automations"].map(
            (line) => (
              <Card key={line} variant="outline" padding="md" radius="md" className="text-sm font-semibold text-[var(--z-fg)]">
                {line}
              </Card>
            ),
          )}
        </div>
      </Section>

      <Section title="Ship with us" description="Spin up a workspace or share the launch story with your team." accent>
        <div className="flex flex-wrap gap-3">
          <Link href="/signup" className={primaryCta}>
            Go to signup
          </Link>
          <Link href="/features" className={ghostCta}>
            Explore features
          </Link>
        </div>
      </Section>
    </div>
  );
}
