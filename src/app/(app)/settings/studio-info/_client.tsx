"use client";

import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useTenantSettings } from "@/hooks/data/useTenantSettings";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

const TIMEZONES: SelectOption[] = [
  { value: "America/New_York", label: "Eastern (US)" },
  { value: "America/Chicago", label: "Central (US)" },
  { value: "America/Denver", label: "Mountain (US)" },
  { value: "America/Los_Angeles", label: "Pacific (US)" },
  { value: "UTC", label: "UTC" },
];

const BILLING_CYCLES: SelectOption[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

export function StudioInfoSettingsClient() {
  const settings = useTenantSettings(DEFAULT_TENANT_ID);
  const row = settings.data;

  const schedule = React.useMemo(() => asRecord(row?.schedule), [row?.schedule]);
  const kpi = React.useMemo(() => asRecord(row?.kpi_settings), [row?.kpi_settings]);

  const [studioName, setStudioName] = React.useState("");
  const [timezone, setTimezone] = React.useState("America/New_York");
  const [billingCycle, setBillingCycle] = React.useState("monthly");
  const [logoName, setLogoName] = React.useState<string | null>(null);

  React.useEffect(() => {
    const name =
      (schedule.studio_display_name as string | undefined) ??
      (kpi.display_name as string | undefined) ??
      `Ziro · ${DEFAULT_TENANT_ID.slice(0, 8)}`;
    setStudioName(String(name));
    setTimezone(String(schedule.timezone ?? "America/New_York"));
    setBillingCycle(String(schedule.default_billing_cycle ?? "monthly"));
  }, [schedule, kpi]);

  return (
    <PageShell title="Studio Info">
      <div className="mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
        <Link className="text-[var(--z-accent)] hover:underline" href="/settings">
          ← All settings
        </Link>
      </div>
      <SettingsSection
        title="Studio identity"
        description="Ground truth for how your studio shows up across ZiroWork."
      >
        {settings.error ? (
          <p className="text-sm text-[var(--z-danger)]">{settings.error.message}</p>
        ) : null}

        <SettingsGroup title="Basics">
          <Input label="Studio name" value={studioName} onChange={(e) => setStudioName(e.target.value)} />
          <Select
            label="Timezone"
            options={TIMEZONES}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />
          <Select
            label="Default billing cycle"
            options={BILLING_CYCLES}
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value)}
          />
        </SettingsGroup>

        <SettingsGroup title="Logo (UI only)">
          <p className="text-xs text-[var(--z-muted)]">
            Upload preview is local—wire storage when your tenant asset pipeline is ready.
          </p>
          <div className="flex flex-wrap items-center gap-[var(--z-space-3)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border-2)] bg-[var(--z-surface-2)] text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
              Logo
            </div>
            <div className="flex flex-col gap-[var(--z-space-2)] sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = () => setLogoName(input.files?.[0]?.name ?? null);
                  input.click();
                }}
              >
                Choose file
              </Button>
              {logoName ? <span className="text-xs text-[var(--z-muted)]">{logoName}</span> : null}
            </div>
          </div>
        </SettingsGroup>

        <div className="flex flex-wrap gap-[var(--z-space-3)]">
          <Button type="button" variant="primary" size="md" disabled>
            Save changes
          </Button>
          <Button type="button" variant="ghost" size="md" onClick={() => settings.reload()}>
            Reload from server
          </Button>
        </div>
      </SettingsSection>
    </PageShell>
  );
}
