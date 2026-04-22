"use client";

import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTenantSettings } from "@/hooks/data/useTenantSettings";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function TeachersSettingsClient() {
  const settings = useTenantSettings(DEFAULT_TENANT_ID);
  const kpi = React.useMemo(() => asRecord(settings.data?.kpi_settings), [settings.data?.kpi_settings]);

  const [maxStudents, setMaxStudents] = React.useState("18");
  const [saving, setSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "success" | "error">("idle");

  React.useEffect(() => {
    if (kpi.default_max_students != null) setMaxStudents(String(kpi.default_max_students));
  }, [kpi]);

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kpi_settings: {
            ...(settings.data?.kpi_settings as Record<string, unknown> ?? {}),
            default_max_students: Number(maxStudents) || 18,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaveStatus("success");
      await settings.reload();
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }


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
            hint="Maximum number of active students per teacher before the roster flags as full."
          />
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            {saveStatus === "success" && <span className="text-xs text-[var(--z-success)]">Saved</span>}
            {saveStatus === "error" && <span className="text-xs text-[var(--z-danger)]">Save failed</span>}
          </div>
        </Card>
      </SettingsSection>
    </PageShell>
  );
}
