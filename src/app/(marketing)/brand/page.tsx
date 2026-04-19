import type { Metadata } from "next";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LogoShowcase } from "@/components/brand/LogoShowcase";

const desc =
  "How to use the ZiroWork mark—clear space, color tokens, and do / don't patterns for partners and press.";

export const metadata: Metadata = mergePageMetadata({
  title: "Brand",
  description: desc,
  openGraph: {
    title: "Brand · ZiroWork",
    description: desc,
    url: `${siteBaseUrl()}/brand`,
  },
  twitter: { title: "Brand · ZiroWork", description: desc },
});

const tokens = [
  { token: "--z-bg", usage: "Canvas / app background" },
  { token: "--z-fg", usage: "Primary text" },
  { token: "--z-surface", usage: "Raised panels" },
  { token: "--z-surface-2", usage: "Nested chrome" },
  { token: "--z-border", usage: "Default hairlines" },
  { token: "--z-accent", usage: "Primary action + neon signal" },
  { token: "--z-muted", usage: "Secondary labels" },
  { token: "--z-danger", usage: "Destructive + risk" },
];

export default function BrandPage() {
  return (
    <div className="space-y-[var(--z-space-12)]">
      <PageHeader title="Brand" subtitle="Guidelines for the charcoal console and neon signal system." />

      <Section title="Logo usage" description="Prefer the dark tile on charcoal marketing; use light tile on photography." accent>
        <div className="grid gap-[var(--z-space-4)] lg:grid-cols-2">
          <Card variant="default" padding="lg" radius="lg" className="space-y-3">
            <div className="text-sm font-extrabold text-[var(--z-fg)]">Lockup</div>
            <p className="text-sm text-[var(--z-muted)]">Keep the mark and wordmark together; do not stretch or recolor outside approved tokens.</p>
            <LogoShowcase variant="dark" />
          </Card>
          <Card variant="default" padding="lg" radius="lg" className="space-y-3">
            <div className="text-sm font-extrabold text-[var(--z-fg)]">Minimum legibility</div>
            <p className="text-sm text-[var(--z-muted)]">At small sizes, rely on the simplified mark with increased padding inside the frame.</p>
            <div className="max-w-[200px]">
              <LogoShowcase variant="mono" />
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Clear space" description="Maintain breathing room equal to the height of the “O” in WORK." accent>
        <Card variant="elevated" padding="lg" radius="lg" className="flex justify-center">
          <div className="relative inline-block p-[clamp(1.5rem,4vw,3rem)]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[var(--z-radius-lg)] border border-dashed border-[color-mix(in_oklab,var(--z-accent),transparent_45%)]"
            />
            <div className="max-w-xs">
              <LogoShowcase variant="dark" />
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Color tokens" description="Reference table for design partners (values resolve at runtime)." accent>
        <Card variant="outline" padding="none" radius="lg" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-[var(--z-border)] bg-[var(--z-surface-2)] text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--z-muted)]">
                <tr>
                  <th className="px-4 py-3">Token</th>
                  <th className="px-4 py-3">Usage</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((row) => (
                  <tr key={row.token} className="border-b border-[var(--z-border)] last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--z-accent)]">{row.token}</td>
                    <td className="px-4 py-3 text-[var(--z-muted)]">{row.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      <Section title="Do / Don&apos;t" description="UI-only examples for decks and partner reviews." accent>
        <div className="grid gap-[var(--z-space-4)] md:grid-cols-2">
          <Card variant="elevated" padding="md" radius="lg" className="border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]">
            <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--z-accent)]">Do</div>
            <p className="mt-2 text-sm text-[var(--z-muted)]">Charcoal field, neon border, restrained copy hierarchy.</p>
            <div className="mt-4">
              <LogoShowcase variant="dark" />
            </div>
          </Card>
          <Card variant="default" padding="md" radius="lg" className="opacity-80">
            <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--z-danger)]">Don&apos;t</div>
            <p className="mt-2 text-sm text-[var(--z-muted)]">Rainbow gradients behind the mark, drop shadows on neon, or low-contrast text.</p>
            <div
              className="mt-4 rounded-[var(--z-radius-md)] p-4"
              style={{
                background:
                  "linear-gradient(125deg, color-mix(in oklab, var(--z-danger), transparent 10%), color-mix(in oklab, var(--z-accent), white 25%), color-mix(in oklab, var(--z-warning), transparent 5%))",
              }}
            >
              <LogoShowcase variant="light" className="border-[color-mix(in_oklab,white,transparent_55%)]" />
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Downloads" description="Buttons are UI-only—wire CDN or export jobs when assets ship." accent>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="primary" size="md">
            Logo pack
          </Button>
          <Button type="button" variant="secondary" size="md">
            Color palette
          </Button>
          <Button type="button" variant="ghost" size="md">
            Press kit bundle
          </Button>
        </div>
      </Section>
    </div>
  );
}
