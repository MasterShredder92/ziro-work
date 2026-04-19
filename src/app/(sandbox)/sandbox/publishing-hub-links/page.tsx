"use client";

import Link from "next/link";
import { HubLink } from "@/components/publishing/HubLink";

export default function SandboxPublishingHubLinksPage() {
  return (
    <div className="space-y-[var(--z-space-8)]">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold">Publishing Hub links</h1>
        <Link className="text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>

      <p className="max-w-2xl text-sm text-[var(--z-muted)]">
        Short label, wrapped long label, and motion notes. Toggle “Reduce motion” in OS settings to confirm{" "}
        <code className="text-[var(--z-accent)]">motion-reduce</code> paths on{" "}
        <code className="text-[var(--z-accent)]">HubLink</code>.
      </p>

      <section className="space-y-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]">Short</h2>
        <HubLink label="Back to Publishing Hub" href="/publishing-hub" />
      </section>

      <section className="space-y-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]">Long (narrow column)</h2>
        <div className="max-w-[220px]">
          <HubLink
            label="Back to Publishing Hub — owner workspace for templates, automations, announcements, and release notes"
            href="/publishing-hub"
          />
        </div>
      </section>

      <section className="space-y-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]">Reduced motion</h2>
        <p className="text-xs text-[var(--z-muted)]">
          Same component: hover still brightens the underline; horizontal nudge is disabled when prefers-reduced-motion
          is on.
        </p>
        <HubLink label="Back to Publishing Hub (check motion)" href="/publishing-hub" />
      </section>
    </div>
  );
}
