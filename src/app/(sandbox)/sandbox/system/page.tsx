"use client";

import Link from "next/link";
import * as React from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationsProvider } from "@/components/notifications/NotificationsProvider";
import { TenantSwitcher } from "@/components/tenant/TenantSwitcher";
import { TenantUiProvider } from "@/components/tenant/TenantUiContext";
import { GlobalLoader } from "@/components/system/GlobalLoader";
import { ErrorBoundary, SegmentErrorView } from "@/components/system/ErrorBoundary";
import { Button } from "@/components/ui/Button";

const DEMO_TENANT = "00000000-0000-0000-0000-000000000001";
export const dynamic = "force-dynamic";

function ThrowOnce() {
  const [boom, setBoom] = React.useState(false);
  if (boom) throw new Error("Sandbox-triggered render failure");
  return (
    <Button type="button" variant="secondary" size="sm" onClick={() => setBoom(true)}>
      Trigger error
    </Button>
  );
}

export default function SystemSandboxPage() {
  const [loader, setLoader] = React.useState(false);
  const [demoError] = React.useState(() => new Error("Example route error payload"));

  return (
    <div className="space-y-[var(--z-space-8)]">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold">System layer</h1>
        <Link className="text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>

      <section className="space-y-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]">
          TenantSwitcher
        </h2>
        <TenantUiProvider defaultTenantId={DEMO_TENANT}>
          <TenantSwitcher />
        </TenantUiProvider>
      </section>

      <section className="space-y-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]">
          NotificationBell
        </h2>
        <TenantUiProvider defaultTenantId={DEMO_TENANT}>
          <NotificationsProvider tenantId={DEMO_TENANT}>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="text-xs text-[var(--z-muted)]">Opens drawer; uses live events when configured.</span>
            </div>
          </NotificationsProvider>
        </TenantUiProvider>
      </section>

      <section className="space-y-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]">GlobalLoader</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" variant="secondary" onClick={() => setLoader(true)}>
            Show overlay
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setLoader(false)}>
            Hide
          </Button>
        </div>
        <GlobalLoader visible={loader} />
      </section>

      <section className="space-y-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]">ErrorBoundary</h2>
        <ErrorBoundary>
          <div className="flex flex-wrap items-center gap-3">
            <ThrowOnce />
            <span className="text-xs text-[var(--z-muted)]">Class boundary catches child render throws.</span>
          </div>
        </ErrorBoundary>
      </section>

      <section className="space-y-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]">
          SegmentErrorView
        </h2>
        <SegmentErrorView error={demoError} reset={() => undefined} title="Example segment error" />
      </section>
    </div>
  );
}
