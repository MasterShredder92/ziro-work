"use client";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
import { PageTransition } from "@/components/system/PageTransition";

function ShimmerBlock({ h = "h-[6.5rem]" }: { h?: string }) {
  return (
    <div
      className={`${h} rounded-2xl`}
      style={{
        background: "var(--z-surface)",
        backgroundImage: "linear-gradient(90deg, var(--z-surface) 25%, var(--z-surface-hover, rgba(255,255,255,0.04)) 50%, var(--z-surface) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s infinite",
        border: "1px solid var(--z-border)",
      }}
    />
  );
}
function StripSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 1fr 1fr", gap: 12 }}>
      {[1,2,3,4,5].map((i) => <ShimmerBlock key={i} h="h-[140px]" />)}
    </div>
  );
}
function CapacitySkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      {[1,2,3,4].map((i) => <ShimmerBlock key={i} h="h-[220px]" />)}
    </div>
  );
}
function PlatformSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {[1,2,3].map((i) => <ShimmerBlock key={i} h="h-[260px]" />)}
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

const CommandStrip = dynamic(
  () => import("./_CommandStrip").then((m) => ({ default: m.CommandStrip })),
  { loading: () => <StripSkeleton /> },
);
const StudioCapacity = dynamic(
  () => import("./_StudioCapacity").then((m) => ({ default: m.StudioCapacity })),
  { loading: () => <CapacitySkeleton /> },
);
const PlatformCards = dynamic(
  () => import("./_PlatformCards").then((m) => ({ default: m.PlatformCards })),
  { loading: () => <PlatformSkeleton /> },
);
const InstrumentChart = dynamic(
  () => import("./_InstrumentChart").then((m) => ({ default: m.InstrumentChart })),
  { loading: () => <PanelSkeleton rows={6} /> },
);
const LeadsBox = dynamic(
  () => import("./_LeadsBox").then((m) => ({ default: m.LeadsBox })),
  { loading: () => <ShimmerBlock h="h-[120px]" /> },
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
        @keyframes livePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(196,240,54,0.6); }
          50% { opacity: 0.5; box-shadow: 0 0 14px rgba(196,240,54,0.8), 0 0 24px rgba(196,240,54,0.3); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <PageTransition>
        <div
          className="mx-auto w-full flex flex-col gap-6"
          data-dashboard-rev="11"
          data-app="ziro-work"
        >
          {/* Header */}
          <div className="flex items-end justify-between" style={{ animation: "fadeInUp 0.4s ease both" }}>
            <div>
              <h1
                className="text-2xl font-extrabold tracking-tight sm:text-3xl"
                style={{
                  background: "linear-gradient(135deg, #c4f036 0%, #bf36f8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 20px rgba(196,240,54,0.3))",
                  fontFamily: "Space Grotesk, sans-serif",
                  letterSpacing: "-0.02em",
                }}
              >
                COMMAND CENTER
              </h1>
              <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div
              className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ background: "var(--z-accent-bg)", border: "1px solid var(--z-accent-glow)", boxShadow: "0 0 20px var(--z-accent-glow)" }}
            >
              <div className="h-2 w-2 rounded-full" style={{ background: "var(--z-accent-readable)", animation: "livePulse 2s ease-in-out infinite" }} />
              <span className="text-[11px] font-bold" style={{ color: "var(--z-accent-readable)", fontFamily: "Space Grotesk, sans-serif" }}>Live</span>
            </div>
          </div>

          {/* ROW 1: Command Strip */}
          <div style={{ animation: "fadeInUp 0.5s ease both 0.05s" }}>
            <CommandStrip />
          </div>

          {/* ROW 2: Studio Capacity */}
          <div style={{ animation: "fadeInUp 0.5s ease both 0.1s" }}>
            <StudioCapacity />
          </div>

          {/* ROW 3: Platform Intelligence */}
          <div style={{ animation: "fadeInUp 0.5s ease both 0.15s" }}>
            <PlatformCards />
          </div>

          {/* ROW 4: Demand & Pipeline */}
          <div style={{ animation: "fadeInUp 0.5s ease both 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 3, height: 22, background: "linear-gradient(180deg, #c4f036, #bf36f8)", borderRadius: 2, flexShrink: 0, boxShadow: "0 0 8px rgba(196,240,54,0.4)" }} />
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--z-fg)", fontFamily: "Space Grotesk, sans-serif" }}>
                Demand &amp; Pipeline
              </span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--z-border), transparent)" }} />
            </div>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.4fr]">
              <Panel title="Instrument Demand" description="Active students by instrument — most to least" accentColor="#bf36f8">
                <InstrumentChart />
              </Panel>
              <Panel title="Leads Pipeline" description="Uncontacted leads — contact within 48 hours" accentColor="#c4f036">
                <LeadsBox />
              </Panel>
            </div>
          </div>

        </div>
      </PageTransition>
    </PageShell>
  );
}
