"use client";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
import { PageTransition } from "@/components/system/PageTransition";
import { DashboardSection } from "@/components/dashboard/DashboardSection";

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

const DashboardMetricsBar = dynamic(
  () => import("@/components/dashboard/DashboardMetricsBar").then((m) => ({ default: m.DashboardMetricsBar })),
  {
    loading: () => (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
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

const TasksPanel = dynamic(
  () => import("@/components/dashboard/TasksPanel").then((m) => ({ default: m.TasksPanel })),
  { loading: () => <BlockSkeleton rows={4} /> },
);

const TeacherUtilization = dynamic(
  () => import("@/components/dashboard/TeacherUtilization").then((m) => ({ default: m.TeacherUtilization })),
  { loading: () => <BlockSkeleton rows={5} /> },
);

const ActivityFeed = dynamic(
  () => import("@/components/dashboard/ActivityFeed").then((m) => ({ default: m.ActivityFeed })),
  { loading: () => <BlockSkeleton rows={5} /> },
);

export function DashboardClient() {
  return (
    <PageShell
      showBreadcrumb={false}
      shellClassName="min-h-full bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,color-mix(in_oklab,var(--z-accent),transparent_94%),transparent_52%)] p-3 pt-2 sm:p-6 sm:pt-5"
      mainClassName="mt-0"
    >
      <PageTransition>
        <div
          className="mx-auto w-full flex flex-col gap-4 sm:gap-8"
          data-dashboard-rev="6"
          data-app="ziro-work"
        >
          {/* ── Revenue metrics bar ─────────────────────────────── */}
          <DashboardMetricsBar />

          {/* ── Overdue alert ───────────────────────────────────── */}
          <OverdueAlert />

          {/* ── Tasks + Teacher Utilization ─────────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
            <DashboardSection
              title="Action items"
              description="Leads to contact, unpaid balances, and open capacity signals."
            >
              <TasksPanel />
            </DashboardSection>

            <DashboardSection
              title="Teacher utilization"
              description="Student sessions booked this month. Excludes 5th-week and non-session blocks."
            >
              <TeacherUtilization />
            </DashboardSection>
          </div>

          {/* ── Recent activity ──────────────────────────────────── */}
          <DashboardSection
            title="Recent activity"
            description="Key events this month — enrollments, teacher changes, cancellations."
          >
            <ActivityFeed showTitle={false} />
          </DashboardSection>
        </div>
      </PageTransition>
    </PageShell>
  );
}
