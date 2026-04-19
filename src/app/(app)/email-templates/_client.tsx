"use client";

import * as React from "react";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { HubLink } from "@/components/publishing/HubLink";
import { EmailTemplateCard } from "@/components/email/EmailTemplateCard";
import { EmailEditor } from "@/components/email/EmailEditor";
import type { EmailTemplateModel } from "@/components/email/emailTypes";

const SEED: EmailTemplateModel[] = [
  {
    id: "tpl-onb-1",
    title: "Welcome to the studio",
    description: "Warm intro after enrollment with next steps.",
    category: "Onboarding",
    body: "Hi {{studentName}},\n\nWelcome to {{studioName}}. Your first lesson is booked with {{teacherName}}.",
  },
  {
    id: "tpl-life-1",
    title: "Lifecycle nudge",
    description: "Gentle reminder when a student stalls in onboarding.",
    category: "Lifecycle",
    body: "Hi {{studentName}},\n\nWe noticed you have not completed your profile. Tap below to finish in under a minute.",
  },
  {
    id: "tpl-bill-1",
    title: "Invoice issued",
    description: "Sent when a new invoice is created.",
    category: "Billing",
    body: "Hello {{familyName}},\n\nA new invoice for {{invoiceAmount}} is ready. View and pay from your portal.",
  },
  {
    id: "tpl-win-1",
    title: "We miss you",
    description: "Win-back outreach for paused students.",
    category: "Win-back",
    body: "Hi {{studentName}},\n\nIt has been a while since your last lesson at {{studioName}}. Here is a special offer to return.",
  },
  {
    id: "tpl-mkt-1",
    title: "Monthly spotlight",
    description: "Newsletter-style highlight of studio programs.",
    category: "Marketing",
    body: "Hello families,\n\nThis month we are featuring {{teacherName}} and new group classes. Read more inside.",
  },
];

export function EmailTemplatesClient() {
  const [templates, setTemplates] = React.useState(SEED);
  const [selectedId, setSelectedId] = React.useState(SEED[0]?.id ?? "");

  const current = React.useMemo(
    () => templates.find((t) => t.id === selectedId) ?? templates[0],
    [templates, selectedId],
  );

  return (
    <PageShell>
      <div className="flex flex-col gap-[var(--z-space-8)]">
        <div className="flex flex-col gap-[var(--z-space-3)]">
          <PageHeader
            title="Email Templates"
            subtitle="Charcoal + neon system emails — wire to your ESP when ready."
          />
          <HubLink label="Back to Publishing Hub" href="/publishing-hub" />
        </div>
        <div className="grid grid-cols-1 gap-[var(--z-space-6)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="grid grid-cols-1 gap-[var(--z-space-3)] sm:grid-cols-2">
            {templates.map((t) => (
              <EmailTemplateCard
                key={t.id}
                title={t.title}
                description={t.description}
                category={t.category}
                selected={t.id === selectedId}
                onSelect={() => setSelectedId(t.id)}
              />
            ))}
          </div>
          {current ? (
            <EmailEditor
              template={current}
              onChange={(next) => {
                setTemplates((prev) => prev.map((x) => (x.id === next.id ? next : x)));
              }}
            />
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
