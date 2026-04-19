"use client";

import * as React from "react";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { HubLink } from "@/components/publishing/HubLink";
import { ReleaseEditor } from "@/components/release/ReleaseEditor";
import { ChangelogEntry } from "@/components/changelog/ChangelogEntry";

const STORAGE_KEY = "ziro.releaseNotesDraft.v1";

type ReleaseDraft = {
  version: string;
  date: string;
  items: string[];
};

const DEFAULT_DRAFT: ReleaseDraft = {
  version: "0.9.0",
  date: "Apr 17, 2026",
  items: ["Polished studio map interactions.", "Faster agent handoffs for enrollment tasks.", "Neon-tuned command palette."],
};

function loadDraft(): ReleaseDraft {
  if (typeof window === "undefined") return DEFAULT_DRAFT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DRAFT;
    const parsed = JSON.parse(raw) as Partial<ReleaseDraft>;
    return {
      version: typeof parsed.version === "string" ? parsed.version : DEFAULT_DRAFT.version,
      date: typeof parsed.date === "string" ? parsed.date : DEFAULT_DRAFT.date,
      items: Array.isArray(parsed.items) ? parsed.items.filter((x) => typeof x === "string") : DEFAULT_DRAFT.items,
    };
  } catch {
    return DEFAULT_DRAFT;
  }
}

export function ReleaseNotesClient() {
  const [draft, setDraft] = React.useState<ReleaseDraft>(DEFAULT_DRAFT);

  React.useEffect(() => {
    queueMicrotask(() => setDraft(loadDraft()));
  }, []);

  const persist = React.useCallback((next: ReleaseDraft) => {
    setDraft(next);
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  return (
    <PageShell>
      <div className="flex flex-col gap-[var(--z-space-8)]">
        <div className="flex flex-col gap-[var(--z-space-3)]">
          <PageHeader title="Release Notes" subtitle="Draft changelog entries locally — export to git when ready." />
          <HubLink label="Back to Publishing Hub" href="/publishing-hub" />
        </div>
        <ReleaseEditor
          version={draft.version}
          date={draft.date}
          items={draft.items}
          onChange={(next) => persist(next)}
        />
        <ChangelogEntry version={draft.version} date={draft.date} items={draft.items} />
      </div>
    </PageShell>
  );
}
