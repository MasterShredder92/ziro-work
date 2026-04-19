import type { Metadata } from "next";
import { docsPageMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = docsPageMetadata(
  "Dashboard",
  "Operational cockpit with premium restraint.",
  "dashboard",
);

export default function DocsDashboardPage() {
  return (
    <div className="space-y-[var(--z-space-8)]">
      <PageHeader title="Dashboard" subtitle="Operational cockpit with premium restraint." />
      <Section title="Feeds" accent spacing="default">
        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          Activity streams stay virtualized for speed; badges echo severity using shared danger + warning tokens.
        </Card>
      </Section>
      <Section title="Command" spacing="default">
        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          ⌘K opens the palette—route hints respect the same typography scale as the rest of the shell.
        </Card>
      </Section>
    </div>
  );
}
