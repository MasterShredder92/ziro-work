import type { Metadata } from "next";
import { docsPageMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = docsPageMetadata(
  "Studio Map",
  "Orb-first mental model for rosters.",
  "studio-map",
);

export default function DocsStudioMapPage() {
  return (
    <div className="space-y-[var(--z-space-8)]">
      <PageHeader title="Studio Map" subtitle="Orb-first mental model for rosters." />
      <Section title="Studio orb" accent spacing="default">
        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          The center orb anchors the brand; teacher satellites lazy-load students to keep queries tight.
        </Card>
      </Section>
      <Section title="Neon affordances" spacing="default">
        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          Hover rings and inactive clusters reuse the same accent mix-ins as settings cards for visual continuity.
        </Card>
      </Section>
    </div>
  );
}
