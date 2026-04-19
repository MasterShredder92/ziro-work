"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

export default function SandboxModalPage() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-[var(--z-space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Modal</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>

      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open Modal
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Premium Modal">
        <div className="space-y-[var(--z-space-4)]">
          <div className="text-sm text-[var(--z-muted)]">
            Backdrop blur + neon accent border. Composable content.
          </div>
          <div className="flex items-center gap-[var(--z-space-2)]">
            <Badge variant="success" active>Ready</Badge>
            <Badge variant="neutral">Shell</Badge>
          </div>
          <div className="flex gap-[var(--z-space-3)]">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

