"use client";

import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
import { PageTransition } from "@/components/system/PageTransition";

/* ── Dashboard-only components (no bleed to other pages) ─────────────── */

function ShimmerBlock({ h = "h-[6.5rem]" }: { h?: string }) {
  return (
    <div
      className={`${h} rounded-2xl`}
      style={{
        background: "var(--z-surface)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s infinite",
        border: "1px solid var(--z-border)",
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

const RevenueGaps = dynamic(
  () => import("./_RevenueGaps").then((m) => ({ default: m.RevenueGaps })),
  { loading: () => <PanelSkeleton rows={4} /> },
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
        @keyframes gradientBorder {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px var(--z-accent-readable); }
          50% { opacity: 0.5; box-shadow: 0 0 12px var(--z-accent-readable), 0 0 20px var(--z-accent-glow); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <PageTransition>
        <div
          className="mx-auto w-full flex flex-col gap-5 sm:gap-7"
          data-dashboard-rev="10"
          data-app="ziro-work"
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <div
            className="flex items-end justify-between"
            style={{ animation: "fadeInUp 0.4s ease both" }}
          >
            <div>
              <h1
                className="text-2xl font-extrabold tracking-tight sm:text-3xl"
                style={{
                  color: "var(--z-fg)",
                }}
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
                background: "var(--z-accent-bg)",
                border: "1px solid var(--z-accent-glow)",
                boxShadow: "0 0 20px var(--z-accent-glow)",
              }}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: "var(--z-accent-readable)", animation: "livePulse 2s ease-in-out infinite" }}
              />
              <span className="text-[11px] font-bold" style={{ color: "var(--z-accent-readable)" }}>
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
            <Panel
              title="Revenue · This Month"
              description="Collected vs outstanding vs scheduled"
              accentColor="#c4f036"
            >
              <RevenueChart />
            </Panel>

            <Panel
              title="Action Items"
              description="Unpaid invoices, open capacity, hiring signals"
              accentColor="#ef4444"
            >
              <ActionPanel />
            </Panel>
          </div>

          {/* ── Revenue Gap Engine + Instrument Demand ──────────────── */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
            <Panel
              title="Revenue Gap Engine"
              description="Open capacity by location — money left on the table"
              accentColor="#ef4444"
              featured
            >
              <RevenueGaps />
            </Panel>

            <Panel
              title="Instrument Demand"
              description="Active students by instrument — most to least"
              accentColor="#7c3aed"
            >
              <InstrumentChart />
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
