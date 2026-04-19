"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DashboardMetricsBar } from "@/components/dashboard/DashboardMetricsBar";
import { QuickActions } from "@/components/dashboard/QuickActions";

export default function SandboxDashboardPage() {
  return (
    <div className="space-y-[var(--z-space-8)]">
      <div className="flex items-center justify-between gap-3">
        <PageHeader title="Dashboard (sandbox)" subtitle="Static layout preview with live data hooks." />
        <Link className="text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>
      <DashboardMetricsBar />
      <QuickActions />
      <ActivityFeed />
    </div>
  );
}
