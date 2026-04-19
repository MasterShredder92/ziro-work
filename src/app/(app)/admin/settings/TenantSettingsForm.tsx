"use client";

import { useState } from "react";
import type { TenantSettings, TenantSettingsInput } from "@/lib/admin/adminTypes";

type Section = keyof Pick<
  TenantSettings,
  "billing" | "scheduling" | "messaging" | "automation" | "forms" | "storage"
>;

const SECTIONS: Array<{ key: Section; label: string; description: string }> = [
  {
    key: "billing",
    label: "Billing",
    description: "Tax rates, invoice terms, currency, payment methods.",
  },
  {
    key: "scheduling",
    label: "Scheduling",
    description: "Default lesson durations, buffers, business hours.",
  },
  {
    key: "messaging",
    label: "Messaging",
    description: "Email & SMS providers, quiet hours.",
  },
  {
    key: "automation",
    label: "Automation",
    description: "Rate limits, concurrency, retry behavior.",
  },
  {
    key: "forms",
    label: "Forms",
    description: "Public form rules, captcha, throttle.",
  },
  {
    key: "storage",
    label: "Storage",
    description: "Upload size limits, retention, allowed MIME types.",
  },
];

export type TenantSettingsFormProps = {
  tenantId: string;
  settings: TenantSettings;
  canWrite: boolean;
};

export function TenantSettingsForm({
  tenantId,
  settings,
  canWrite,
}: TenantSettingsFormProps) {
  const [current, setCurrent] = useState<TenantSettings>(settings);
  const [drafts, setDrafts] = useState<Record<Section, string>>({
    billing: JSON.stringify(settings.billing ?? {}, null, 2),
    scheduling: JSON.stringify(settings.scheduling ?? {}, null, 2),
    messaging: JSON.stringify(settings.messaging ?? {}, null, 2),
    automation: JSON.stringify(settings.automation ?? {}, null, 2),
    forms: JSON.stringify(settings.forms ?? {}, null, 2),
    storage: JSON.stringify(settings.storage ?? {}, null, 2),
  });
  const [saving, setSaving] = useState<Section | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Section, string>>>({});
  const [savedAt, setSavedAt] = useState<Partial<Record<Section, string>>>({});

  async function save(section: Section) {
    setSaving(section);
    setErrors((e) => ({ ...e, [section]: undefined }));
    try {
      const parsed = JSON.parse(drafts[section] ?? "{}") as Record<
        string,
        unknown
      >;
      const patch: TenantSettingsInput = { [section]: parsed };
      const res = await fetch(
        `/api/admin/settings?tenantId=${encodeURIComponent(tenantId)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(patch),
        },
      );
      const data = (await res.json().catch(() => null)) as {
        data?: TenantSettings;
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      if (data?.data) {
        setCurrent(data.data);
        setDrafts((d) => ({
          ...d,
          [section]: JSON.stringify(data.data![section], null, 2),
        }));
      }
      setSavedAt((s) => ({
        ...s,
        [section]: new Date().toLocaleTimeString(),
      }));
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [section]: err instanceof Error ? err.message : "Failed to save",
      }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-[var(--z-muted)]">
        Last updated {new Date(current.updated_at).toLocaleString()}
      </div>
      {SECTIONS.map((s) => (
        <div
          key={s.key}
          className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-[var(--z-fg)]">{s.label}</div>
              <div className="text-xs text-[var(--z-muted)]">{s.description}</div>
            </div>
            {savedAt[s.key] ? (
              <span className="text-[11px] text-[var(--z-muted)]">
                Saved at {savedAt[s.key]}
              </span>
            ) : null}
          </div>
          <textarea
            value={drafts[s.key]}
            onChange={(e) =>
              setDrafts((d) => ({ ...d, [s.key]: e.target.value }))
            }
            disabled={!canWrite}
            rows={8}
            className="mt-2 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] p-2 font-mono text-xs"
          />
          {errors[s.key] ? (
            <div className="mt-2 text-xs text-red-400">{errors[s.key]}</div>
          ) : null}
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={!canWrite || saving === s.key}
              onClick={() => save(s.key)}
              className="h-8 rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-3 text-xs font-semibold text-black disabled:opacity-50"
            >
              {saving === s.key ? "Saving…" : "Save section"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
