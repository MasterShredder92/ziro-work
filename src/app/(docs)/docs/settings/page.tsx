import type { Metadata } from "next";
import { docsPageMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = docsPageMetadata(
  "Settings",
  "Tenant truth + experience controls.",
  "settings",
);

export default function DocsSettingsPage() {
  return (
    <div className="space-y-[var(--z-space-8)]">
      <PageHeader title="Settings" subtitle="Tenant truth + experience controls." />
      <Section title="Framework" accent spacing="default">
        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          SettingsSection pairs PageHeader with Section; SettingsGroup nests controls inside elevated cards.
        </Card>
      </Section>
      <Section title="Theme tokens" spacing="default">
        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          `--z-accent-color`, `--z-neon-strength`, and `--z-density-scale` bind to the document root for live previews.
        </Card>
      </Section>
    </div>
  );
}
