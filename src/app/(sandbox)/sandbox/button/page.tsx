"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function SandboxButtonPage() {
  return (
    <div className="space-y-[var(--z-space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Button</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>

      <div className="space-y-[var(--z-space-4)]">
        <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
          <div className="text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider mb-[var(--z-space-3)]">
            Variants
          </div>
          <div className="flex flex-wrap gap-[var(--z-space-3)]">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>

        <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
          <div className="text-xs font-semibold text-[var(--z-muted)] uppercase tracking-wider mb-[var(--z-space-3)]">
            Sizes
          </div>
          <div className="flex flex-wrap items-center gap-[var(--z-space-3)]">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

