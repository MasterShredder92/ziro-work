"use client";

import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { List } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";

const faq = [
  {
    id: "faq-1",
    title: "Where do announcements pull from?",
    description: "They read the latest static changelog entry and respect a dismiss flag in localStorage.",
    action: <Badge variant="neutral">Announcements</Badge>,
  },
  {
    id: "faq-2",
    title: "How do I ship release notes?",
    description: "Owners can draft UI-only payloads under Admin → Release notes (local preview + storage).",
    action: <Badge variant="success">Owner</Badge>,
  },
];

const shortcuts = [
  { id: "sc-1", title: "⌘K", description: "Command palette", action: <Badge variant="neutral">Global</Badge> },
  { id: "sc-2", title: "Esc", description: "Close modals / dialogs", action: <Badge variant="neutral">Global</Badge> },
];

const support = [
  {
    id: "su-1",
    title: "Email the team",
    description: "support@zirowork.example",
    action: <Badge variant="warning">Human</Badge>,
  },
];

const docLinks = [
  {
    id: "dl-1",
    title: "Documentation home",
    description: "/docs",
    action: (
      <Link href="/docs" className="text-xs font-semibold text-[var(--z-accent)] hover:underline">
        Open
      </Link>
    ),
  },
  {
    id: "dl-2",
    title: "Changelog",
    description: "/docs/changelog",
    action: (
      <Link href="/docs/changelog" className="text-xs font-semibold text-[var(--z-accent)] hover:underline">
        Open
      </Link>
    ),
  },
];

export function HelpClient() {
  return (
    <PageShell title="Help">
      <div className="space-y-[var(--z-space-10)]">
        <PageHeader title="Help hub" subtitle="Answers, shortcuts, and docs—same neon language as the product." />

        <Section title="FAQ" accent spacing="default">
          <List items={faq} />
        </Section>

        <Section title="Keyboard shortcuts" spacing="default">
          <List items={shortcuts} />
        </Section>

        <Section title="Contact support" spacing="default">
          <List items={support} />
        </Section>

        <Section title="Documentation" spacing="default">
          <List items={docLinks} />
        </Section>
      </div>
    </PageShell>
  );
}
