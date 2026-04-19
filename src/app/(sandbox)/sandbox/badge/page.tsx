"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export default function SandboxBadgePage() {
  return (
    <div className="space-y-[var(--z-space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Badge</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>

      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
        <div className="text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider mb-[var(--z-space-3)]">
          Variants
        </div>
        <div className="flex flex-wrap gap-[var(--z-space-3)] items-center">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
        </div>
      </div>

      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
        <div className="text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider mb-[var(--z-space-3)]">
          Active (neon accent)
        </div>
        <div className="flex flex-wrap gap-[var(--z-space-3)] items-center">
          <Badge variant="neutral" active>Neutral</Badge>
          <Badge variant="success" active>Success</Badge>
          <Badge variant="warning" active>Warning</Badge>
          <Badge variant="danger" active>Danger</Badge>
        </div>
      </div>
    </div>
  );
}

