"use client";

import Link from "next/link";
import * as React from "react";
import { AutomationCard } from "@/components/automation/AutomationCard";

export default function SandboxAutomationsPage() {
  const [a, setA] = React.useState(true);
  const [b, setB] = React.useState(false);

  return (
    <div className="space-y-[var(--z-space-8)]">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold">Automations sandbox</h1>
        <Link className="text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>
      <div className="grid max-w-xl grid-cols-1 gap-[var(--z-space-4)]">
        <AutomationCard
          title="Sample nurture"
          description="Preview card + switch styling in isolation."
          enabled={a}
          onEnabledChange={setA}
        />
        <AutomationCard
          title="Sample win-back"
          description="Second row to validate spacing and hover states."
          enabled={b}
          onEnabledChange={setB}
        />
      </div>
    </div>
  );
}
