"use client";

import Link from "next/link";
import { List } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";
import { ChangelogEntry } from "@/components/changelog/ChangelogEntry";
import { CHANGELOG_ENTRIES } from "@/lib/changelog/entries";

export default function SandboxChangelogPage() {
  const items = CHANGELOG_ENTRIES.map((e) => ({
    id: e.version,
    title: e.version,
    description: e.date,
    action: <Badge variant="neutral">{e.highlights.length} items</Badge>,
  }));

  return (
    <div className="space-y-[var(--z-space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Changelog (sandbox)</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>

      <List items={items} />

      <div className="space-y-[var(--z-space-4)]">
        {CHANGELOG_ENTRIES.map((e) => (
          <ChangelogEntry key={e.version} version={e.version} date={e.date} items={e.highlights} />
        ))}
      </div>
    </div>
  );
}
