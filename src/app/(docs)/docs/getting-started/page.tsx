import type { Metadata } from "next";
import { docsPageMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = docsPageMetadata(
  "Getting Started",
  "Bring ZiroWork online in three calm passes.",
  "getting-started",
);

export default function DocsGettingStartedPage() {
  return (
    <div className="space-y-[var(--z-space-8)]">
      <PageHeader title="Getting Started" subtitle="Bring ZiroWork online in three calm passes." />
      <Section title="1 · Tenant" spacing="default">
        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          Connect Supabase, set `NEXT_PUBLIC_ZIRO_DEFAULT_TENANT_ID`, and verify the tenant switcher resolves the
          correct studio.
        </Card>
      </Section>
      <Section title="2 · Operators" spacing="default">
        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          Walk through Dashboard → Studio Map → Students to validate data hooks and charcoal surfaces.
        </Card>
      </Section>
      <Section title="3 · Automations" spacing="default">
        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          Toggle lifecycle automations under Settings, then observe announcements + changelog for release hygiene.
        </Card>
      </Section>
    </div>
  );
}
