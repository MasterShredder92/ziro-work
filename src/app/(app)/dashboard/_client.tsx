"use client";

import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
import { PageTransition } from "@/components/system/PageTransition";
import { DashboardSection } from "@/components/dashboard/DashboardSection";

function AgentGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="h-52 animate-pulse rounded-2xl border border-[var(--z-border)] bg-[var(--z-surface-2)]"
        />
      ))}
    </div>
  );
}

function BlockSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)]"
        />
      ))}
    </div>
  );
}

const AgentCards = dynamic(
  () => import("@/components/agent/AgentCards").then((m) => ({ default: m.AgentCards })),
  { loading: () => <AgentGridSkeleton /> },
);

const QuickActions = dynamic(
  () => import("@/components/dashboard/QuickActions").then((m) => ({ default: m.QuickActions })),
  { loading: () => <BlockSkeleton rows={4} /> },
);

const ActivityFeed = dynamic(
  () => import("@/components/dashboard/ActivityFeed").then((m) => ({ default: m.ActivityFeed })),
  { loading: () => <BlockSkeleton rows={5} /> },
);

const DashboardMetricsBar = dynamic(
  () => import("@/components/dashboard/DashboardMetricsBar").then((m) => ({ default: m.DashboardMetricsBar })),
  {
    loading: () => (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[5.25rem] animate-pulse rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)]" />
        ))}
      </div>
    ),
  },
);

const OverdueAlert = dynamic(
  () => import("@/components/dashboard/OverdueAlert").then((m) => ({ default: m.OverdueAlert })),
  { loading: () => null },
);

export function DashboardClient() {
  return (
    <PageShell
      showBreadcrumb={false}
      shellClassName="min-h-full bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,color-mix(in_oklab,var(--z-accent),transparent_94%),transparent_52%)] p-4 pt-3 sm:p-6 sm:pt-5"
      mainClassName="mt-0"
    >
      <PageTransition>
        <div
          className="mx-auto max-w-[1600px] flex flex-col gap-8"
          data-dashboard-rev="5"
          data-app="ziro-work"
        >
          {/* ── Hero header ─────────────────────────────────────── */}
          <header className="border-b border-[color-mix(in_oklab,var(--z-border),transparent_35%)] pb-4">
            <h1 className="bg-gradient-to-br from-[var(--z-fg)] to-[color-mix(in_oklab,var(--z-fg),transparent_25%)] bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-[1.65rem]">
              Your Crew
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_38%)]">
              7 agents working for you right now. Click any one to see what they&apos;re doing and jump straight to their page.
            </p>
          </header>

          {/* ── Revenue metrics bar ─────────────────────────────── */}
          <DashboardMetricsBar />

          {/* ── Overdue alert ───────────────────────────────────── */}
          <OverdueAlert />

          {/* ── Agent circles — full width, no sidebar ──────────── */}
          <DashboardSection
            id="team"
            title="Your crew"
            withSurface={false}
          >
            <div data-tour="agent-cards">
              <AgentCards />
            </div>
          </DashboardSection>

          {/* ── Shortcuts ────────────────────────────────────────── */}
          <DashboardSection title="Shortcuts" description="Jump to the work that usually needs a human.">
            <div data-tour="quick-actions">
              <QuickActions showTitle={false} />
            </div>
          </DashboardSection>

          {/* ── Recent activity ──────────────────────────────────── */}
          <DashboardSection
            title="Recent activity"
            description="Latest events across your studio. The last 7 days show up first."
          >
            <div data-tour="activity-feed">
              <ActivityFeed showTitle={false} />
            </div>
          </DashboardSection>
        </div>
      </PageTransition>
    </PageShell>
  );
}
