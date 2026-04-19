"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { List } from "@/components/ui/List";

export default function SandboxDrawerPage() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-[var(--z-space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Drawer</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>

      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open Drawer
        </Button>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title="Premium Drawer">
        <div className="space-y-[var(--z-space-5)]">
          <div className="text-sm text-[var(--z-muted)]">
            Slide-in shell from the right. Tokens control width + spacing.
          </div>
          <List
            items={[
              { id: "a", title: "Quick action", description: "Example content inside drawer." },
              { id: "b", title: "Secondary action", description: "No routing/data logic." },
            ]}
          />
          <div className="flex gap-[var(--z-space-3)]">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

