"use client";

import { BookOpen, Mail, Megaphone, Workflow } from "lucide-react";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { HubCard } from "@/components/publishing/HubCard";

export default function PublishingHubPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-[var(--z-space-8)]">
        <PageHeader
          title="Publishing Hub"
          subtitle="Owner workspace for templates, automations, announcements, and release notes — unified charcoal + neon surface."
        />

        <div className="grid grid-cols-1 gap-[var(--z-space-8)] md:grid-cols-2">
          <Section
            accent
            spacing="tight"
            title="Email Templates"
            description="Lifecycle, billing, and marketing copy. Pair with transactional preview for token merges."
          >
            <HubCard
              icon={<Mail className="h-5 w-5" />}
              title="Email templates"
              description="Open the template library and editor — preview lives at transactional email preview."
              href="/email-templates"
            />
          </Section>

          <Section
            accent
            spacing="tight"
            title="Automations"
            description="Nurture, win-back, and referral toggles for UX review before backend wiring."
          >
            <HubCard
              icon={<Workflow className="h-5 w-5" />}
              title="Automations"
              description="Review sequences and switches in the dedicated automations workspace."
              href="/automations"
            />
          </Section>

          <Section
            accent
            spacing="tight"
            title="Announcements"
            description="Compose in-app announcements with CTA — drafts persist in localStorage on this device."
          >
            <HubCard
              icon={<Megaphone className="h-5 w-5" />}
              title="Announcements"
              description="Title, body, and CTA with a live preview card beside the composer."
              href="/announcements"
            />
          </Section>

          <Section
            accent
            spacing="tight"
            title="Release Notes"
            description="Draft version bullets and mirror the public ChangelogEntry card before you publish."
          >
            <HubCard
              icon={<BookOpen className="h-5 w-5" />}
              title="Release notes"
              description="Edit highlights and validate the changelog layout in one pass."
              href="/release-notes"
            />
          </Section>
        </div>
      </div>
    </PageShell>
  );
}
