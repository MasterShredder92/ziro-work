"use client";

import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Card } from "@/components/ui/Card";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";

const THEME_KEY = "zirowork.theme.v1";

type ThemeState = {
  accent: "green" | "blue" | "purple";
  neon: number;
  density: "compact" | "default" | "spacious";
};

const ACCENTS: Record<ThemeState["accent"], string> = {
  green: "#00ff88",
  blue: "#4dabff",
  purple: "#c56bff",
};

const ACCENT_OPTIONS: SelectOption[] = [
  { value: "green", label: "Neon green" },
  { value: "blue", label: "Electric blue" },
  { value: "purple", label: "Ultraviolet" },
];

const DENSITY_OPTIONS: SelectOption[] = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "spacious", label: "Spacious" },
];

function densityScale(d: ThemeState["density"]) {
  if (d === "compact") return 0.9;
  if (d === "spacious") return 1.12;
  return 1;
}

function applyTheme(next: ThemeState) {
  const root = document.documentElement;
  root.style.setProperty("--z-accent-color", ACCENTS[next.accent]);
  root.style.setProperty("--z-neon-strength", String(next.neon));
  root.style.setProperty("--z-density-scale", String(densityScale(next.density)));
}

export function ThemeSettingsClient() {
  const [accent, setAccent] = React.useState<ThemeState["accent"]>("green");
  const [neon, setNeon] = React.useState(1);
  const [density, setDensity] = React.useState<ThemeState["density"]>("default");

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(THEME_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ThemeState>;
      if (parsed.accent) setAccent(parsed.accent);
      if (typeof parsed.neon === "number") setNeon(parsed.neon);
      if (parsed.density) setDensity(parsed.density);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    applyTheme({ accent, neon, density });
    try {
      localStorage.setItem(THEME_KEY, JSON.stringify({ accent, neon, density }));
    } catch {
      /* ignore */
    }
  }, [accent, neon, density]);

  return (
    <PageShell title="Theme">
      <div className="mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
        <Link className="text-[var(--z-accent)] hover:underline" href="/settings">
          ← All settings
        </Link>
      </div>

      <SettingsSection
        title="Charcoal + neon controls"
        description="Variables bind to `--z-accent-color`, `--z-neon-strength`, and `--z-density-scale` on the document root."
      >
        <div className="grid grid-cols-1 gap-[var(--z-space-4)] lg:grid-cols-2">
          <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="space-y-[var(--z-space-4)]">
            <Select
              label="Accent color"
              options={ACCENT_OPTIONS}
              value={accent}
              onChange={(e) => setAccent(e.target.value as ThemeState["accent"])}
            />
            <Slider
              label="Neon intensity"
              min={0.35}
              max={1.65}
              step={0.05}
              value={neon}
              onValueChange={setNeon}
              hint="Multiplies glow strength on switches + focus rings."
            />
          </Card>

          <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="space-y-[var(--z-space-4)]">
            <Select
              label="Density"
              options={DENSITY_OPTIONS}
              value={density}
              onChange={(e) => setDensity(e.target.value as ThemeState["density"])}
            />
            <div
              className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-[calc(var(--z-space-4)*var(--z-density-scale,1))]"
              style={{ fontSize: "calc(0.85rem * var(--z-density-scale, 1))" }}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">Preview</div>
              <p className="mt-2 text-sm text-[var(--z-fg)]">
                Density scales padding + type rhythm for future surfaces—tokens stay centralized.
              </p>
            </div>
          </Card>
        </div>
      </SettingsSection>
    </PageShell>
  );
}
