"use client";

import Link from "next/link";
import * as React from "react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";

const ACCENTS = [
  { value: "green", label: "Neon green" },
  { value: "blue", label: "Electric blue" },
  { value: "purple", label: "Ultraviolet" },
];

const DENSITY = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "spacious", label: "Spacious" },
];

const ACCENT_HEX: Record<string, string> = {
  green: "#c4f036",
  blue: "#4dabff",
  purple: "#c56bff",
};

export default function SandboxThemeSettingsPage() {
  const [accent, setAccent] = React.useState("green");
  const [neon, setNeon] = React.useState(1);
  const [density, setDensity] = React.useState("default");

  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--z-accent-color", ACCENT_HEX[accent] ?? ACCENT_HEX.green);
    root.style.setProperty("--z-neon-strength", String(neon));
    const scale = density === "compact" ? 0.9 : density === "spacious" ? 1.12 : 1;
    root.style.setProperty("--z-density-scale", String(scale));
  }, [accent, neon, density]);

  return (
    <div className="space-y-[var(--z-space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Theme (sandbox)</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox/settings">
          Back
        </Link>
      </div>

      <SettingsSection title="Theme controls" description="Live CSS variables on the document root.">
        <div className="grid grid-cols-1 gap-[var(--z-space-4)] lg:grid-cols-2">
          <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="space-y-[var(--z-space-4)]">
            <Select label="Accent" options={ACCENTS} value={accent} onChange={(e) => setAccent(e.target.value)} />
            <Slider label="Neon strength" min={0.35} max={1.65} step={0.05} value={neon} onValueChange={setNeon} />
          </Card>
          <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="space-y-[var(--z-space-4)]">
            <Select label="Density" options={DENSITY} value={density} onChange={(e) => setDensity(e.target.value)} />
            <div
              className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-[calc(var(--z-space-4)*var(--z-density-scale,1))]"
              style={{ fontSize: "calc(0.85rem * var(--z-density-scale, 1))" }}
            >
              Density preview card
            </div>
          </Card>
        </div>
      </SettingsSection>
    </div>
  );
}
