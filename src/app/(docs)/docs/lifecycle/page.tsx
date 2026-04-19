import type { Metadata } from "next";
import { docsPageMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = docsPageMetadata(
  "Lifecycle Engine",
  "Stage-aware orchestration for every family journey.",
  "lifecycle",
);

export default function DocsLifecyclePage() {
  return (
    <div className="space-y-[var(--z-space-8)]">
      <PageHeader title="Lifecycle Engine" subtitle="Stage-aware orchestration for every family journey." />
      <Section title="Stages" accent spacing="default">
        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          Intake through Win-back mirrors your operating playbook. Each stage owns its own surface with shared tokens
          for continuity.
        </Card>
      </Section>
      <Section title="Signals" spacing="default">
        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          Events, invoices, and attendance blend into lifecycle entries—neon badges call attention to risk without
          shouting.
        </Card>
      </Section>
    </div>
  );
}
