import type { Metadata } from "next";
import { docsPageMetadata } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { List } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";
import { ChangelogEntry } from "@/components/changelog/ChangelogEntry";
import { CHANGELOG_ENTRIES } from "@/lib/changelog/entries";

export const metadata: Metadata = docsPageMetadata(
  "Changelog",
  "Curated releases for operators and builders.",
  "changelog",
);

export default function DocsChangelogPage() {
  const listItems = CHANGELOG_ENTRIES.map((e) => ({
    id: e.version,
    title: e.version,
    description: `${e.date} · ${e.highlights.length} highlights`,
    action: (
      <Badge variant="success" active>
        Stable
      </Badge>
    ),
  }));

  return (
    <div className="space-y-[var(--z-space-8)]">
      <PageHeader title="Changelog" subtitle="Curated releases for operators and builders." />

      <Section title="At a glance" accent spacing="default">
        <List items={listItems} />
      </Section>

      <Section title="Release notes" spacing="loose">
        <div className="space-y-[var(--z-space-5)]">
          {CHANGELOG_ENTRIES.map((e) => (
            <ChangelogEntry key={e.version} version={e.version} date={e.date} items={e.highlights} />
          ))}
        </div>
      </Section>
    </div>
  );
}
