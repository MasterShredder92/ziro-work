"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { GlobalSearch } from "@/components/search/GlobalSearch";

export default function SandboxSearchPage() {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="space-y-[var(--z-space-6)]">
      <div>
        <h1 className="text-lg font-extrabold text-[var(--z-fg)]">Global search</h1>
        <p className="mt-1 text-sm text-[var(--z-muted)]">
          Visual QA for charcoal + neon search shell. Uses live hooks when{" "}
          <code className="text-[var(--z-accent)]">NEXT_PUBLIC_ZIRO_DEFAULT_TENANT_ID</code> is set.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-2 text-sm font-semibold text-[var(--z-fg)] hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]"
      >
        Open search modal
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Search" panelClassName="max-w-2xl">
        <GlobalSearch tenantId={process.env.NEXT_PUBLIC_ZIRO_DEFAULT_TENANT_ID ?? ""} onClose={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
