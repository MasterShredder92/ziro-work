"use client";

import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { Switch } from "@/components/ui/Switch";
import { useTenantSettings } from "@/hooks/data/useTenantSettings";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function AutomationsSettingsClient() {
  const settings = useTenantSettings(DEFAULT_TENANT_ID);
  const pipelines = React.useMemo(() => asRecord(settings.data?.pipelines), [settings.data?.pipelines]);

  const [advance, setAdvance] = React.useState(Boolean(pipelines.auto_advance_lifecycle ?? false));
  const [atRisk, setAtRisk] = React.useState(Boolean(pipelines.auto_detect_at_risk ?? true));
  const [winBack, setWinBack] = React.useState(Boolean(pipelines.auto_win_back ?? false));

  React.useEffect(() => {
    setAdvance(Boolean(pipelines.auto_advance_lifecycle ?? false));
    setAtRisk(Boolean(pipelines.auto_detect_at_risk ?? true));
    setWinBack(Boolean(pipelines.auto_win_back ?? false));
  }, [pipelines]);

  const enabledToggleCount = React.useMemo(
    () => [advance, atRisk, winBack].filter(Boolean).length,
    [advance, atRisk, winBack],
  );

  return (
    <PageShell title="Automations">
      <div className="mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
        <Link className="text-[var(--z-accent)] hover:underline" href="/settings">
          ← All settings
        </Link>
      </div>

      <SettingsSection
        title="Lifecycle automations"
        description={`Toggles are optimistic UI—bind to automation workers when ready (${enabledToggleCount} enabled).`}
      >
        {settings.error ? (
          <p className="text-sm text-[var(--z-danger)]">{settings.error.message}</p>
        ) : null}

        <SettingsGroup title="Signals">
          <Switch
            checked={advance}
            onCheckedChange={setAdvance}
            label="Auto-advance lifecycle stages"
            description="Progress students when attendance + billing signals are green."
          />
          <Switch
            checked={atRisk}
            onCheckedChange={setAtRisk}
            label="Auto-detect at-risk students"
            description="Blend attendance streaks, invoices, and lifecycle notes."
          />
          <Switch
            checked={winBack}
            onCheckedChange={setWinBack}
            label="Auto-start win-back sequences"
            description="Trigger win-back playbooks after dormancy thresholds."
          />
        </SettingsGroup>
      </SettingsSection>
    </PageShell>
  );
}
