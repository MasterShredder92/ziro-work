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
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [logoUploading, setLogoUploading] = React.useState(false);
  const [logoError, setLogoError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const name =
      (schedule.studio_display_name as string | undefined) ??
      (kpi.display_name as string | undefined) ??
      `Ziro · ${DEFAULT_TENANT_ID.slice(0, 8)}`;
    setStudioName(String(name));
    setTimezone(String(schedule.timezone ?? "America/New_York"));
    setBillingCycle(String(schedule.default_billing_cycle ?? "monthly"));
    if (schedule.logo_url) setLogoUrl(String(schedule.logo_url));
  }, [schedule, kpi]);

  async function handleLogoUpload(file: File) {
    setLogoUploading(true);
    setLogoError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/logo", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
      setLogoUrl((j as { url?: string }).url ?? null);
      setLogoName(file.name);
      await settings.reload();
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: studioName,
          timezone,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
      }
      setSaveStatus("success");
      await settings.reload();
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

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

        <SettingsGroup title="Studio Logo">
          <p className="text-xs text-[var(--z-muted)]">
            Upload your studio logo. It will be saved and displayed across ZiroWork.
          </p>
          <div className="flex flex-wrap items-center gap-[var(--z-space-3)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border-2)] bg-[var(--z-surface-2)] overflow-hidden">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Studio logo" className="h-full w-full object-contain" />
              ) : (
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">Logo</span>
              )}
            </div>
            <div className="flex flex-col gap-[var(--z-space-2)] sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={logoUploading}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = () => {
                    const file = input.files?.[0];
                    if (file) void handleLogoUpload(file);
                  };
                  input.click();
                }}
              >
                {logoUploading ? "Uploading…" : "Choose file"}
              </Button>
              {logoName && !logoUploading ? <span className="text-xs text-[var(--z-muted)]">{logoName}</span> : null}
              {logoError ? <span className="text-xs text-[var(--z-danger)]">{logoError}</span> : null}
            </div>
          </div>
        </SettingsGroup>

        {saveStatus === "success" && (
          <p className="text-sm text-green-500">Settings saved successfully.</p>
        )}
        {saveStatus === "error" && saveError && (
          <p className="text-sm text-[var(--z-danger)]">Error: {saveError}</p>
        )}

        <div className="flex flex-wrap gap-[var(--z-space-3)]">
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={saving || settings.isLoading}
            onClick={handleSave}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="ghost" size="md" onClick={() => settings.reload()}>
            Reload from server
          </Button>
        </div>
      </SettingsSection>
    </PageShell>
  );
}
