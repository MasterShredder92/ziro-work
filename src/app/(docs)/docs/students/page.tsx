import type { Metadata } from "next";
import { docsPageMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = docsPageMetadata(
  "Students & Teachers",
  "Profiles, rosters, and payroll-adjacent hints.",
  "students",
);

export default function DocsStudentsPage() {
  return (
    <div className="space-y-[var(--z-space-8)]">
      <PageHeader title="Students & Teachers" subtitle="Profiles, rosters, and payroll-adjacent hints." />
      <Section title="Students" accent spacing="default">
        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          Deep profile cards stack invoices, schedule, and risk using the same Card + Section language as settings.
        </Card>
      </Section>
      <Section title="Teachers" spacing="default">
        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          Teacher views echo capacity + payroll heuristics while keeping typography calm for daily use.
        </Card>
      </Section>
    </div>
  );
}
