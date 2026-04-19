import type { Metadata } from "next";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { LogoShowcase } from "@/components/brand/LogoShowcase";
import { ColorSwatch } from "@/components/brand/ColorSwatch";
import { H1, H2, Body } from "@/components/premium/Typography";

const desc =
  "Official ZiroWork press kit—logos, palette, typography, product stills, and founder bio for launch coverage.";

export const metadata: Metadata = mergePageMetadata({
  title: "Press kit",
  description: desc,
  openGraph: {
    title: "Press kit · ZiroWork",
    description: desc,
    url: `${siteBaseUrl()}/press-kit`,
  },
  twitter: { title: "Press kit · ZiroWork", description: desc },
});

const palette = [
  { name: "Background", value: "var(--z-bg)" },
  { name: "Foreground", value: "var(--z-fg)" },
  { name: "Surface", value: "var(--z-surface)" },
  { name: "Accent", value: "var(--z-accent)" },
  { name: "Muted", value: "var(--z-muted)" },
  { name: "Danger", value: "var(--z-danger)" },
];

export default function PressKitPage() {
  return (
    <div className="space-y-[var(--z-space-12)]">
      <PageHeader
        title="Press kit"
        subtitle="Charcoal console, neon signal—assets and copy helpers for launch coverage."
      />

      <Section title="Logos" description="Light, dark, and monochrome lockups (SVG placeholders)." accent spacing="loose">
        <div className="grid gap-[var(--z-space-4)] sm:grid-cols-3">
          <Card variant="elevated" padding="md" radius="lg" className="space-y-2">
            <div className="text-xs font-semibold text-[var(--z-muted)]">Light</div>
            <LogoShowcase variant="light" />
          </Card>
          <Card variant="elevated" padding="md" radius="lg" className="space-y-2">
            <div className="text-xs font-semibold text-[var(--z-muted)]">Dark</div>
            <LogoShowcase variant="dark" />
          </Card>
          <Card variant="elevated" padding="md" radius="lg" className="space-y-2">
            <div className="text-xs font-semibold text-[var(--z-muted)]">Monochrome</div>
            <LogoShowcase variant="mono" />
          </Card>
        </div>
      </Section>

      <Section title="Color palette" description="Core charcoal stack plus neon accent and semantic accents." accent>
        <div className="grid gap-[var(--z-space-4)] sm:grid-cols-2 lg:grid-cols-3">
          {palette.map((c) => (
            <ColorSwatch key={c.name} name={c.name} value={c.value} />
          ))}
        </div>
      </Section>

      <Section title="Typography" description="Marketing and product use the same Inter-forward scale." accent>
        <Card variant="default" padding="lg" radius="lg" className="space-y-[var(--z-space-6)]">
          <div className="space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--z-accent)]">Headings</div>
            <H1>Display heading (H1)</H1>
            <H2>Section heading (H2)</H2>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--z-accent)]">Body</div>
            <Body>
              Body copy stays calm: high contrast on charcoal, muted secondary lines for supporting detail, and neon
              reserved for actions and wayfinding.
            </Body>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--z-accent)]">Code</div>
            <pre className="overflow-x-auto rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3 font-mono text-xs text-[color-mix(in_oklab,var(--z-fg),transparent_8%)]">
              npx zirowork doctor --tenant=demo
            </pre>
          </div>
        </Card>
      </Section>

      <Section title="Product screenshots" description="UI-only placeholders—swap with real captures when ready." accent>
        <div className="grid gap-[var(--z-space-4)] md:grid-cols-2">
          {["Dashboard", "Studio Map", "Student profile", "Lifecycle board"].map((label) => (
            <Card key={label} variant="outline" padding="none" radius="lg" className="overflow-hidden">
              <div className="flex aspect-video items-center justify-center border-b border-dashed border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_30%)]">
                <span className="text-xs font-semibold text-[var(--z-muted)]">{label} still</span>
              </div>
              <div className="px-4 py-3 text-sm font-semibold text-[var(--z-fg)]">{label}</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Founder" description="Short bio plus headshot placeholder for decks and articles." accent>
        <Card variant="elevated" padding="lg" radius="lg" className="flex flex-col gap-[var(--z-space-5)] sm:flex-row sm:items-start">
          <div
            className="mx-auto h-28 w-28 shrink-0 rounded-full border border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] bg-[radial-gradient(circle_at_30%_22%,color-mix(in_oklab,var(--z-accent),transparent_55%),var(--z-surface-2)_62%)] shadow-[0_0_0_6px_color-mix(in_oklab,var(--z-accent),transparent_92%)] sm:mx-0"
            aria-label="Founder headshot placeholder"
          />
          <div className="min-w-0 space-y-2 text-center sm:text-left">
            <div className="text-sm font-extrabold text-[var(--z-fg)]">Alex Mercer · Founder, ZiroWork</div>
            <Body tone="muted">
              Operator-first product lead focused on lifecycle clarity for multi-teacher studios. Previously scaled
              education programs where spreadsheets were the source of truth—ZiroWork is the antidote.
            </Body>
          </div>
        </Card>
      </Section>
    </div>
  );
}
