"use client";

import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { List } from "@/components/ui/List";
import { useTenantSettings } from "@/hooks/data/useTenantSettings";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function TeachersSettingsClient() {
  const settings = useTenantSettings(DEFAULT_TENANT_ID);
  const kpi = React.useMemo(() => asRecord(settings.data?.kpi_settings), [settings.data?.kpi_settings]);

  const [maxStudents, setMaxStudents] = React.useState("18");
  const [sequenceNotes, setSequenceNotes] = React.useState(
    "Day 0 welcome · Day 3 curriculum check · Day 10 retention pulse",
  );

  React.useEffect(() => {
    if (kpi.default_max_students != null) setMaxStudents(String(kpi.default_max_students));
    if (typeof kpi.onboarding_sequence === "string") setSequenceNotes(kpi.onboarding_sequence);
  }, [kpi]);

  const steps = [
    { id: "1", title: "Invite teacher", description: "Send magic link + policy pack." },
    { id: "2", title: "Capacity audit", description: "Align roster targets with payroll bands." },
    { id: "3", title: "First 30 days", description: "Automations nudge attendance + lesson notes." },
  ];

  return (
    <PageShell title="Teachers">
      <div className="mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
        <Link className="text-[var(--z-accent)] hover:underline" href="/settings">
          ← All settings
        </Link>
      </div>
      <SettingsSection
        title="Teacher program defaults"
        description="Operational guardrails before teachers hit the roster."
      >
        {settings.error ? (
          <p className="text-sm text-[var(--z-danger)]">{settings.error.message}</p>
        ) : null}

        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="space-y-[var(--z-space-4)]">
          <div className="text-sm font-semibold text-[var(--z-fg)]">Default max students / teacher</div>
          <Input
            label="Seats"
            inputMode="numeric"
            value={maxStudents}
            onChange={(e) => setMaxStudents(e.target.value)}
            hint="Hydrates from `kpi_settings.default_max_students` when configured."
          />
        </Card>

        <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="space-y-[var(--z-space-4)]">
          <div className="text-sm font-semibold text-[var(--z-fg)]">Default onboarding sequence</div>
          <Input label="Playbook notes" value={sequenceNotes} onChange={(e) => setSequenceNotes(e.target.value)} />
          <div>
            <div className="mb-[var(--z-space-2)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">
              Reference checklist
            </div>
            <List items={steps} />
          </div>
        </Card>
      </SettingsSection>
    </PageShell>
  );
}
