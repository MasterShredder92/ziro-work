"use client";

import { useMemo, useState } from "react";
import type {
  BrandingProfile,
  ThemePreset,
} from "@/lib/branding";
import { ColorPicker } from "./ColorPicker";
import { ThemePreviewCard } from "./ThemePreviewCard";

export function ThemeEditorClient({
  tenantId,
  canWrite,
  profile,
  themes,
  activeThemeKey,
}: {
  tenantId: string;
  canWrite: boolean;
  profile: BrandingProfile | null;
  themes: ThemePreset[];
  activeThemeKey: string | null;
}) {
  const initial = profile?.colors;
  const [primary, setPrimary] = useState(initial?.primary ?? "#00ff88");
  const [secondary, setSecondary] = useState(initial?.secondary ?? "#00cc6e");
  const [accent, setAccent] = useState(initial?.accent ?? "#00ff88");
  const [background, setBackground] = useState(initial?.background ?? "#080808");
  const [surface, setSurface] = useState(initial?.surface ?? "#101012");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const qs = useMemo(() => `tenantId=${encodeURIComponent(tenantId)}`, [tenantId]);

  if (!profile) {
    return (
      <div className="rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]">
        No branding profile exists for this tenant yet. Seed a profile row or create one via the API.
      </div>
    );
  }

  async function saveColors() {
    if (!canWrite || !profile) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/branding/profile?${qs}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          patch: {
            id: profile.id,
            colors: {
              ...profile.colors,
              primary,
              secondary,
              accent,
              background,
              surface,
            },
          },
        }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      setMsg("Saved.");
    } finally {
      setBusy(false);
    }
  }

  async function applyTheme(themeKey: string) {
    if (!canWrite) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/branding/theme?${qs}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({ action: "apply", theme_key: themeKey }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      setMsg(`Applied theme ${themeKey}.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {themes.map((t) => (
          <ThemePreviewCard
            key={t.theme_key}
            theme={t}
            active={activeThemeKey === t.theme_key}
            disabled={!canWrite || busy}
            onSelect={applyTheme}
          />
        ))}
      </section>

      <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-4">
        <div className="text-sm font-semibold text-[var(--z-fg)]">Palette</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ColorPicker label="Primary" value={primary} onChange={setPrimary} disabled={!canWrite} />
          <ColorPicker label="Secondary" value={secondary} onChange={setSecondary} disabled={!canWrite} />
          <ColorPicker label="Accent" value={accent} onChange={setAccent} disabled={!canWrite} />
          <ColorPicker label="Background" value={background} onChange={setBackground} disabled={!canWrite} />
          <ColorPicker label="Surface" value={surface} onChange={setSurface} disabled={!canWrite} />
        </div>
        <button
          type="button"
          disabled={!canWrite || !profile || busy}
          onClick={saveColors}
          className="rounded-[var(--z-radius-md)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-4 py-2 text-sm font-semibold text-[#00ff88] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save palette to profile"}
        </button>
        {msg ? <div className="text-xs text-[var(--z-muted)]">{msg}</div> : null}
      </section>
    </div>
  );
}
