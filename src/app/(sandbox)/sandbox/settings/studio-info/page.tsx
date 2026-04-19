"use client";

import Link from "next/link";
import * as React from "react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (US)" },
  { value: "America/Los_Angeles", label: "Pacific (US)" },
];

const BILLING = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
];

export default function SandboxStudioInfoSettingsPage() {
  const [name, setName] = React.useState("Northwind Music Lab");
  const [tz, setTz] = React.useState("America/New_York");
  const [cycle, setCycle] = React.useState("monthly");

  return (
    <div className="space-y-[var(--z-space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Studio Info (sandbox)</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox/settings">
          Back
        </Link>
      </div>

      <SettingsSection title="Studio identity" description="Static fixture—no tenant fetch.">
        <SettingsGroup title="Basics">
          <Input label="Studio name" value={name} onChange={(e) => setName(e.target.value)} />
          <Select label="Timezone" options={TIMEZONES} value={tz} onChange={(e) => setTz(e.target.value)} />
          <Select label="Billing cycle" options={BILLING} value={cycle} onChange={(e) => setCycle(e.target.value)} />
        </SettingsGroup>
        <SettingsGroup title="Logo (UI only)">
          <Button type="button" variant="secondary" size="sm">
            Choose file
          </Button>
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
}
