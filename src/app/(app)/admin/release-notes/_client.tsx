"use client";

import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ChangelogEntry } from "@/components/changelog/ChangelogEntry";

const DRAFT_KEY = "ziro.releaseDraft";

type Draft = { version: string; date: string; highlights: string[] };

export function ReleaseNotesAdminClient() {
  const [version, setVersion] = React.useState("0.5.0");
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [highlightsText, setHighlightsText] = React.useState("First highlight\nSecond highlight");
  const [preview, setPreview] = React.useState<Draft | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Draft;
      if (parsed?.version) setVersion(parsed.version);
      if (parsed?.date) setDate(parsed.date);
      if (Array.isArray(parsed?.highlights)) setHighlightsText(parsed.highlights.join("\n"));
    } catch {
      /* ignore */
    }
  }, []);

  const onSubmit = React.useCallback(() => {
    const highlights = highlightsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const draft: Draft = { version, date, highlights };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
    setPreview(draft);
  }, [version, date, highlightsText]);

  return (
    <PageShell title="Release notes">
      <div className="mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
        <Link className="text-[var(--z-accent)] hover:underline" href="/settings/permissions">
          ← Permissions
        </Link>
      </div>

      <PageHeader
        title="Release notes automation"
        subtitle="Drafts stay in localStorage—wire to CI when you are ready to publish."
      />

      <div className="mt-[var(--z-space-8)] grid grid-cols-1 gap-[var(--z-space-8)] lg:grid-cols-2">
        <Section title="Composer" accent spacing="tight">
          <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="space-y-[var(--z-space-4)]">
            <Input label="Version" value={version} onChange={(e) => setVersion(e.target.value)} />
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="flex flex-col gap-[var(--z-space-2)]">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">
                Highlights (one per line)
              </label>
              <textarea
                className="min-h-[140px] w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] py-[var(--z-space-3)] text-sm text-[var(--z-fg)]"
                value={highlightsText}
                onChange={(e) => setHighlightsText(e.target.value)}
              />
            </div>
            <Button type="button" variant="primary" size="md" onClick={onSubmit}>
              Save draft to browser
            </Button>
          </Card>
        </Section>

        <Section title="Preview" spacing="tight">
          {preview ? (
            <ChangelogEntry version={preview.version} date={preview.date} items={preview.highlights} />
          ) : (
            <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="text-sm text-[var(--z-muted)]">
              Submit the form to render a ChangelogEntry from your draft.
            </Card>
          )}
        </Section>
      </div>
    </PageShell>
  );
}
