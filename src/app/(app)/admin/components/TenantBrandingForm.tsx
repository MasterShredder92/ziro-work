"use client";

import { useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { LogoUploader } from "./LogoUploader";
import { TimezoneSelector } from "./TimezoneSelector";
import type { Tenant } from "@/lib/admin/adminTypes";

export type TenantBrandingFormProps = {
  tenantId: string;
  tenant: Tenant | null;
  canWrite: boolean;
  onSaved?: (next: Tenant) => void;
};

export function TenantBrandingForm({
  tenantId,
  tenant,
  canWrite,
  onSaved,
}: TenantBrandingFormProps) {
  const [name, setName] = useState(tenant?.name ?? "");
  const [slug, setSlug] = useState(tenant?.slug ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(tenant?.logo_url ?? null);
  const [primaryColor, setPrimaryColor] = useState(
    tenant?.primary_color ?? "#00E0A4",
  );
  const [accentColor, setAccentColor] = useState(
    tenant?.accent_color ?? "#66D9FF",
  );
  const [timezone, setTimezone] = useState(tenant?.timezone ?? "America/New_York");
  const [locale, setLocale] = useState(tenant?.locale ?? "en-US");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/tenant?tenantId=${encodeURIComponent(tenantId)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name,
            slug: slug || null,
            logo_url: logoUrl,
            primary_color: primaryColor,
            accent_color: accentColor,
            timezone,
            locale,
          }),
        },
      );
      const data = (await res.json().catch(() => null)) as {
        data?: Tenant;
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      if (data?.data) onSaved?.(data.data);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save branding");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
            Tenant name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canWrite}
            className="h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
            Slug
          </span>
          <input
            value={slug ?? ""}
            onChange={(e) => setSlug(e.target.value)}
            disabled={!canWrite}
            className="h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 font-mono text-sm"
          />
        </label>
      </div>

      <LogoUploader
        value={logoUrl}
        onChange={setLogoUrl}
        disabled={!canWrite}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ColorPicker
          label="Primary color"
          value={primaryColor}
          onChange={setPrimaryColor}
          disabled={!canWrite}
        />
        <ColorPicker
          label="Accent color"
          value={accentColor}
          onChange={setAccentColor}
          disabled={!canWrite}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TimezoneSelector
          value={timezone}
          onChange={setTimezone}
          disabled={!canWrite}
        />
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
            Locale
          </span>
          <input
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            disabled={!canWrite}
            className="h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 font-mono text-sm"
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-[var(--z-radius-md)] border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!canWrite || saving}
          onClick={save}
          className="h-9 rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-4 text-sm font-semibold text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save branding"}
        </button>
        {savedAt ? (
          <span className="text-xs text-[var(--z-muted)]">
            Saved at {savedAt}
          </span>
        ) : null}
      </div>
    </div>
  );
}
