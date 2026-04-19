"use client";

import * as React from "react";
import { CommandPalette } from "@/components/command/CommandPalette";

export default function SandboxCommandsPage() {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="space-y-[var(--z-space-6)]">
      <div>
        <h1 className="text-lg font-extrabold text-[var(--z-fg)]">Command palette</h1>
        <p className="mt-1 text-sm text-[var(--z-muted)]">
          Visual QA for tabbed command center. Toggle with the button or your global ⌘K / Ctrl+K
          shortcut when the app shell is mounted.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-2 text-sm font-semibold text-[var(--z-fg)] hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]"
      >
        Open command palette
      </button>
      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        tenantId={process.env.NEXT_PUBLIC_ZIRO_DEFAULT_TENANT_ID ?? ""}
      />
    </div>
  );
}
