"use client";

import * as React from "react";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ProductTour } from "@/components/tour/ProductTour";

export default function SandboxTourPage() {
  const [open, setOpen] = React.useState(false);
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl space-y-[var(--z-space-6)]">
        <PageHeader title="Sandbox · Product tour" subtitle="Opens the same tour overlay used in the app shell." />
        <Button type="button" variant="primary" onClick={() => setOpen(true)}>
          Preview tour
        </Button>
        <div
          data-tour="dashboard-metrics"
          className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]"
        >
          Dummy target for step 1 when launched from this page.
        </div>
      </div>
      <ProductTour open={open} onClose={() => setOpen(false)} />
    </PageShell>
  );
}
