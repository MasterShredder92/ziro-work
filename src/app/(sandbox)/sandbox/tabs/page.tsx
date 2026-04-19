"use client";

import * as React from "react";
import Link from "next/link";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";

export default function SandboxTabsPage() {
  const [active, setActive] = React.useState("overview");

  return (
    <div className="space-y-[var(--z-space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Tabs</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>

      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
        <Tabs
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "activity", label: <span className="inline-flex items-center gap-2">Activity <Badge variant="neutral">12</Badge></span> },
            { id: "settings", label: "Settings" },
          ]}
          activeTab={active}
          onChange={setActive}
        />

        <div className="mt-[var(--z-space-5)] text-sm text-[var(--z-muted)]">
          Active tab: <span className="text-[var(--z-fg)] font-semibold">{active}</span>
        </div>
      </div>
    </div>
  );
}

