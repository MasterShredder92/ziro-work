"use client";

import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
import { PageTransition } from "@/components/system/PageTransition";

/* ── Dashboard-only components (no bleed to other pages) ─────────────── */

function ShimmerBlock({ h = "h-[6.5rem]" }: { h?: string }) {
  return (
    <div
      className={`${h} animate-pulse rounded-2xl`}
      style={{
        background: "#111113",
        border: "1px solid rgba(255,255,255,0.06)",
        backgroundImage:
          "linear-gradient(90deg, #111113 25%, rgba(255,255,255,0.04) 50%, #111113 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s infinite",
      }}
    />
  );
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <ShimmerBlock key={i} h="h-[6.5rem]" />
      ))}
    </div>
  );
}

function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <ShimmerBlock key={i} h="h-14" />
      ))}
    </div>
  );
}

const KpiStrip = dynamic(
  () => import("./_KpiStrip").then((m) => ({ default: m.KpiStrip })),
  { loading: () => <KpiSkeleton /> },
);

const OverdueBanner = dynamic(
  () => import("./_OverdueBanner").then((m) => ({ default: m.OverdueBanner })),
  { loading: () => null },
);

const LeadsBox = dynamic(
  () => import("./_LeadsBox").then((m) => ({ default: m.LeadsBox })),
  { loading: () => <ShimmerBlock h="h-[120px]" /> },
);

const RevenueChart = dynamic(
  () => import("./_RevenueChart").then((m) => ({ default: m.RevenueChart })),
  { loading: () => <ShimmerBlock h="h-[280px]" /> },
);

const ActionPanel = dynamic(
  () => import("./_ActionPanel").then((m) => ({ default: m.ActionPanel })),
  { loading: () => <PanelSkeleton rows={3} /> },
);

const InstrumentChart = dynamic(
  () => import("./_InstrumentChart").then((m) => ({ default: m.InstrumentChart })),
  { loading: () => <PanelSkeleton rows={6} /> },
);

const TeacherPanel = dynamic(
  () => import("./_TeacherPanel").then((m) => ({ default: m.TeacherPanel })),
  { loading: () => <PanelSkeleton rows={6} /> },
);

const ActivityStream = dynamic(
  () => import("./_ActivityStream").then((m) => ({ default: m.ActivityStream })),
  { loading: () => <PanelSkeleton rows={6} /> },
);

const Panel = dynamic(
  () => import("./_Panel").then((m) => ({ default: m.Panel })),
  { ssr: false },
);

export function DashboardClient() {
  return (
    <PageShell
      showBreadcrumb={false}
      shellClassName="min-h-full bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,color-mix(in_oklab,var(--z-accent),transparent_94%),transparent_52%)] p-3 pt-2 sm:p-6 sm:pt-5"
      mainClassName="mt-0"
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <PageTransition>
        <div
          className="mx-auto w-full flex flex-col gap-5 sm:gap-7"
          data-dashboard-rev="8"
          data-app="ziro-work"
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="flex items-end justify-between">
            <div>
              <h1
                className="text-2xl font-extrabold tracking-tight sm:text-3xl"
                style={{ color: "var(--z-fg)" }}
              >
                Command Center
              </h1>
              <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--z-muted)" }}>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div
              className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{
                background: "rgba(0,255,136,0.08)",
                border: "1px solid rgba(0,255,136,0.25)",
              }}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: "#00ff88", boxShadow: "0 0 6px #00ff88" }}
              />
              <span className="text-[11px] font-bold" style={{ color: "#00ff88" }}>
                Live
              </span>
            </div>
          </div>

          {/* ── KPI strip ───────────────────────────────────────────── */}
          <KpiStrip />

          {/* ── Overdue alert ───────────────────────────────────────── */}
          <OverdueBanner />

          {/* ── LEADS — top priority box ────────────────────────────── */}
          <LeadsBox />

          {/* ── Revenue chart + Action items ────────────────────────── */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.4fr]">
            {/* Revenue donut */}
            <Panel
              title="Revenue · This Month"
              description="Collected vs outstanding vs scheduled"
              accentColor="#00ff88"
            >
              <RevenueChart />
            </Panel>

            {/* Action items — invoices, capacity, hiring (leads moved out) */}
            <Panel
              title="Action Items"
              description="Unpaid invoices, open capacity, hiring signals"
              accentColor="#ef4444"
            >
              <ActionPanel />
            </Panel>
          </div>

          {/* ── Instrument demand + Teacher utilization ─────────────── */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Panel
              title="Instrument Demand"
              description="Active students by instrument — most to least"
              accentColor="#7c3aed"
            >
              <InstrumentChart />
            </Panel>

            <Panel
              title="Teacher Utilization"
              description="Sessions booked MTD — stacked by location"
              accentColor="#d97706"
            >
              <TeacherPanel />
            </Panel>
          </div>

          {/* ── Activity feed ───────────────────────────────────────── */}
          <Panel
            title="Recent Activity"
            description="Key events — enrollments, payments, teacher changes"
            accentColor="#2563eb"
          >
            <ActivityStream />
          </Panel>
        </div>
      </PageTransition>
    </PageShell>
  );
}
