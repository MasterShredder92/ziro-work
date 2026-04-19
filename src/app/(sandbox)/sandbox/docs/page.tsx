"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils/cn";

const tiles = [
  { title: "Getting Started", body: "Tenant + operator checklist." },
  { title: "Lifecycle", body: "Stages + signals overview." },
  { title: "Dashboard", body: "Feeds + command palette." },
];

export default function SandboxDocsPage() {
  return (
    <div className="space-y-[var(--z-space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Docs (sandbox)</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>

      <PageHeader title="Layout QA" subtitle="Mirrors the docs shell without nested routing." />
      <Section title="Card grid" accent spacing="default">
        <div className="grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-3">
          {tiles.map((t) => (
            <Card
              key={t.title}
              variant="elevated"
              padding="md"
              radius="lg"
              shadow="sm"
              className={cn("border-[var(--z-border)]", "hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)]")}
            >
              <div className="text-sm font-extrabold">{t.title}</div>
              <p className="mt-2 text-xs text-[var(--z-muted)]">{t.body}</p>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
