"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { PageTransition } from "@/components/system/PageTransition";

type DashboardMetrics = {
  activeStudents: number;
  activeFamilies: number;
  collectedCents: number;
  totalInvoicedCents: number;
  outstandingCents: number;
  overdueCount: number;
  scheduledCents: number;
  projectedMonthlyCents: number;
  schoolName?: string;
  mtd?: { start: string; end: string; today: string };
};

type SystemNode = {
  id: string;
  eyebrow: string;
  title: string;
  value: string;
  label: string;
  pulse: "green" | "purple" | "blue" | "red" | "amber";
  x: number;
  y: number;
  href?: string;
  children?: ReactNode;
};

function usd(cents = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function ShimmerBlock({ h = "h-[6.5rem]" }: { h?: string }) {
  return (
    <div
      className={`${h} rounded-2xl`}
      style={{
        background: "rgba(10,10,12,0.72)",
        backgroundImage:
          "linear-gradient(90deg, rgba(12,12,16,0.72) 25%, rgba(0,255,136,0.08) 50%, rgba(12,12,16,0.72) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s infinite",
        border: "1px solid rgba(0,255,136,0.16)",
      }}
    />
  );
}

function StripSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_2fr_1fr_1fr]">
      {[1, 2, 3, 4, 5].map((i) => (
        <ShimmerBlock key={i} h="h-[140px]" />
      ))}
    </div>
  );
}
function CapacitySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <ShimmerBlock key={i} h="h-[220px]" />
      ))}
    </div>
  );
}
function PlatformSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <ShimmerBlock key={i} h="h-[260px]" />
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

function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/dashboard/metrics", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (mounted) setMetrics(json as DashboardMetrics);
      })
      .catch(() => {
        if (mounted) setMetrics(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return metrics;
}

function PulseLine({ from, to, delay = 0 }: { from: { x: number; y: number }; to: { x: number; y: number }; delay?: number }) {
  const x1 = from.x;
  const y1 = from.y;
  const x2 = to.x;
  const y2 = to.y;
  return (
    <line
      x1={`${x1}%`}
      y1={`${y1}%`}
      x2={`${x2}%`}
      y2={`${y2}%`}
      className="zw-neural-line"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

function BrainCore({ metrics }: { metrics: DashboardMetrics | null }) {
  const schoolName = metrics?.schoolName?.trim() || "Adkins Music Lessons";
  const collected = usd(metrics?.collectedCents ?? 0);
  const projected = usd(metrics?.projectedMonthlyCents ?? 0);

  return (
    <div className="zw-brain-core" aria-label={`${schoolName} ZiroWork command brain`}>
      <div className="zw-orbit zw-orbit-one" />
      <div className="zw-orbit zw-orbit-two" />
      <div className="zw-orbit zw-orbit-three" />
      <div className="zw-brain-inner">
        <div className="zw-fire-z" aria-hidden="true">
          Z
        </div>
        <div className="zw-brain-name">{schoolName}</div>
        <div className="zw-brain-title">ZIROWORK BRAIN</div>
        <div className="zw-brain-income">{collected}</div>
        <div className="zw-brain-caption">income collected this month</div>
        <div className="zw-brain-footer">
          <span>Projected {projected}</span>
          <span>{metrics?.activeStudents ?? "—"} active students</span>
        </div>
      </div>
    </div>
  );
}

function NeuralNodeContent({ node }: { node: SystemNode }) {
  return (
    <>
      <div className="zw-node-header">
        <span>{node.eyebrow}</span>
        <i />
      </div>
      <div className="zw-node-title">{node.title}</div>
      <div className="zw-node-metric">{node.value}</div>
      <div className="zw-node-label">{node.label}</div>
      {node.children ? <div className="zw-node-body">{node.children}</div> : null}
    </>
  );
}

function NeuralNode({ node }: { node: SystemNode }) {
  const className = `zw-system-node zw-node-${node.pulse}`;
  const style = { left: `${node.x}%`, top: `${node.y}%` };

  if (node.href) {
    return (
      <Link href={node.href} className={className} style={style}>
        <NeuralNodeContent node={node} />
      </Link>
    );
  }

  return (
    <div className={className} style={style}>
      <NeuralNodeContent node={node} />
    </div>
  );
}

function OutcomeRail({ metrics }: { metrics: DashboardMetrics | null }) {
  const signals = [
    {
      label: "Revenue captured",
      value: usd(metrics?.collectedCents ?? 0),
      trend: "+ MTD",
      tone: "green",
    },
    {
      label: "Recovery target",
      value: usd(metrics?.outstandingCents ?? 0),
      trend: `${metrics?.overdueCount ?? 0} overdue`,
      tone: metrics?.overdueCount ? "red" : "green",
    },
    {
      label: "Active families",
      value: String(metrics?.activeFamilies ?? "—"),
      trend: "live roster",
      tone: "purple",
    },
    {
      label: "Next month",
      value: usd(metrics?.projectedMonthlyCents ?? 0),
      trend: "projected",
      tone: "blue",
    },
  ];

  return (
    <aside className="zw-outcome-rail" aria-label="Command outcomes">
      <div className="zw-rail-title">OUTCOME SIGNALS</div>
      {signals.map((signal) => (
        <div className={`zw-signal zw-signal-${signal.tone}`} key={signal.label}>
          <div>
            <span>{signal.label}</span>
            <strong>{signal.value}</strong>
          </div>
          <em>{signal.trend}</em>
        </div>
      ))}
      <div className="zw-rail-footer">ONE SCHOOL. ONE BRAIN. LIVE COMMAND.</div>
    </aside>
  );
}

function CommandFeed({ metrics }: { metrics: DashboardMetrics | null }) {
  const items = [
    {
      title: "Collect the money already earned",
      body: `${usd(metrics?.outstandingCents ?? 0)} sits in revenue recovery. Attack overdue invoices first.`,
      href: "/billing/invoices",
      tone: "red",
    },
    {
      title: "Fill open weekly lesson capacity",
      body: "Studio capacity is the growth map. Open blocks are the fastest path to revenue.",
      href: "/schedule",
      tone: "green",
    },
    {
      title: "Convert uncontacted leads",
      body: "Enrollment speed wins. Work the lead queue before the 48-hour decay window.",
      href: "/crm/leads",
      tone: "purple",
    },
  ];

  return (
    <div className="zw-command-feed">
      {items.map((item, idx) => (
        <Link className={`zw-feed-item zw-feed-${item.tone}`} href={item.href} key={item.title}>
          <span>0{idx + 1}</span>
          <div>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function AgentOrbitMobile() {
  const agents = [
    ["Raven", "Retention scanner", "Active"],
    ["Revenue", "Invoice recovery", "Live"],
    ["Enroll", "Lead converter", "Watching"],
    ["Schedule", "Capacity mapper", "Active"],
    ["Reviews", "Growth engine", "Ready"],
  ];

  return (
    <div className="zw-agent-scroll" aria-label="Agent orbit">
      {agents.map(([name, role, status]) => (
        <div className="zw-agent-pill" key={name}>
          <span>{name}</span>
          <strong>{role}</strong>
          <em>{status}</em>
        </div>
      ))}
    </div>
  );
}

function NeuralDesktop({ metrics }: { metrics: DashboardMetrics | null }) {
  const nodes = useMemo<SystemNode[]>(
    () => [
      {
        id: "enrollment",
        eyebrow: "01 ENROLLMENT ENGINE",
        title: "Lead-to-student converter",
        value: usd(metrics?.scheduledCents ?? 0),
        label: "scheduled invoice pressure",
        pulse: "green",
        x: 7,
        y: 8,
        href: "/crm/leads",
      },
      {
        id: "lifecycle",
        eyebrow: "02 STUDENT LIFECYCLE",
        title: "Student health monitor",
        value: String(metrics?.activeStudents ?? "—"),
        label: "active students in motion",
        pulse: "purple",
        x: 66,
        y: 10,
        href: "/students",
      },
      {
        id: "lessons",
        eyebrow: "03 LESSON OPERATIONS",
        title: "Schedule command",
        value: "Live",
        label: "rooms, teachers, students",
        pulse: "blue",
        x: 72,
        y: 42,
        href: "/schedule",
      },
      {
        id: "revenue",
        eyebrow: "04 REVENUE RECOVERY",
        title: "Money waiting",
        value: usd(metrics?.outstandingCents ?? 0),
        label: `${metrics?.overdueCount ?? 0} overdue invoices`,
        pulse: metrics?.overdueCount ? "red" : "green",
        x: 63,
        y: 70,
        href: "/billing/invoices",
      },
      {
        id: "retention",
        eyebrow: "05 RETENTION INTELLIGENCE",
        title: "Risk scanner",
        value: "Raven",
        label: "student threats + save plays",
        pulse: "amber",
        x: 36,
        y: 78,
        href: "/crm/families",
      },
      {
        id: "capacity",
        eyebrow: "06 TEACHER CAPACITY",
        title: "Open slots become cash",
        value: usd(metrics?.projectedMonthlyCents ?? 0),
        label: "next month projected",
        pulse: "green",
        x: 14,
        y: 67,
        href: "/teachers",
      },
      {
        id: "agents",
        eyebrow: "07 AI AGENTS",
        title: "Robot operator layer",
        value: "5",
        label: "agents feeding the brain",
        pulse: "purple",
        x: 8,
        y: 39,
        href: "/marketing-insights",
      },
      {
        id: "command",
        eyebrow: "08 COMMAND CENTER",
        title: "Owner decision layer",
        value: "Now",
        label: "what to attack next",
        pulse: "green",
        x: 35,
        y: 9,
      },
    ],
    [metrics],
  );

  return (
    <section className="zw-neural-desktop" aria-label="ZiroWork neural command center">
      <svg className="zw-neural-map" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {nodes.map((node, idx) => (
          <PulseLine key={node.id} from={{ x: 50, y: 50 }} to={{ x: node.x + 10, y: node.y + 7 }} delay={idx * 0.22} />
        ))}
      </svg>
      <div className="zw-starfield" />
      <BrainCore metrics={metrics} />
      {nodes.map((node) => (
        <NeuralNode key={node.id} node={node} />
      ))}
      <OutcomeRail metrics={metrics} />
    </section>
  );
}

function IntelligenceModule({ title, eyebrow, children, accent = "green" }: { title: string; eyebrow: string; children: ReactNode; accent?: "green" | "purple" | "blue" }) {
  return (
    <section className={`zw-intel-module zw-intel-${accent}`}>
      <div className="zw-module-head">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function DashboardClient() {
  const metrics = useDashboardMetrics();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <PageShell
      showBreadcrumb={false}
      shellClassName="min-h-full overflow-hidden bg-[#050506] p-2 pt-2 sm:p-5 sm:pt-4"
      mainClassName="mt-0"
    >
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes brainPulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); filter: drop-shadow(0 0 34px rgba(0,255,136,0.3)); } 50% { transform: translate(-50%, -50%) scale(1.025); filter: drop-shadow(0 0 58px rgba(191,54,248,0.42)); } }
        @keyframes orbitSpin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes lineFlow { 0% { stroke-dashoffset: 120; opacity: .08; } 45% { opacity: .9; } 100% { stroke-dashoffset: 0; opacity: .22; } }
        @keyframes floatNode { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes scanDrift { from { background-position: 0 0, 0 0; } to { background-position: 0 80px, 80px 0; } }
        @keyframes sparkBlink { 0%, 100% { opacity: .34; transform: scale(.9); } 50% { opacity: 1; transform: scale(1.25); } }
        @keyframes flameShift { 0%,100% { text-shadow: 0 0 14px #00ff88, 0 0 36px rgba(0,255,136,.5), 0 -8px 30px rgba(191,54,248,.35); } 50% { text-shadow: 0 0 18px #bf36f8, 0 0 48px rgba(191,54,248,.65), 0 -10px 34px rgba(0,255,136,.42); } }

        .zw-dashboard-shell { position: relative; isolation: isolate; --z-surface:rgba(255,255,255,.045); --z-surface-hover:rgba(0,255,136,.08); --z-border:rgba(0,255,136,.18); --z-fg:#ffffff; --z-muted:rgba(255,255,255,.56); }
        .zw-dashboard-shell::before { content: ""; position: fixed; inset: 65px 0 0 64px; pointer-events: none; z-index: -1; background:
          radial-gradient(circle at 48% 42%, rgba(0,255,136,.18), transparent 18%),
          radial-gradient(circle at 62% 36%, rgba(191,54,248,.16), transparent 24%),
          radial-gradient(circle at 30% 74%, rgba(0,255,136,.08), transparent 26%),
          linear-gradient(180deg, #050506 0%, #09090c 48%, #030304 100%);
        }
        .zw-dashboard-header { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:14px; }
        .zw-dashboard-kicker { display:flex; align-items:center; gap:8px; color:#00ff88; font:800 10px/1 Space Grotesk, sans-serif; letter-spacing:.22em; text-transform:uppercase; }
        .zw-dashboard-kicker i { width:7px; height:7px; border-radius:999px; background:#00ff88; box-shadow:0 0 14px rgba(0,255,136,.9); animation:sparkBlink 1.8s ease-in-out infinite; }
        .zw-dashboard-title { margin-top:6px; font:950 clamp(28px,4vw,54px)/.9 Space Grotesk, sans-serif; letter-spacing:-.07em; background:linear-gradient(120deg,#f8fff0 0%,#00ff88 35%,#bf36f8 82%); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; filter:drop-shadow(0 0 24px rgba(0,255,136,.22)); }
        .zw-dashboard-date { color:var(--z-muted); font:700 11px/1.4 Space Grotesk, sans-serif; margin-top:8px; }
        .zw-live-badge { display:flex; align-items:center; gap:8px; padding:9px 12px; border-radius:999px; background:rgba(0,255,136,.08); border:1px solid rgba(0,255,136,.28); color:#00ff88; font:900 11px/1 Space Grotesk, sans-serif; box-shadow:0 0 28px rgba(0,255,136,.12); }
        .zw-live-badge i { width:8px; height:8px; border-radius:999px; background:#00ff88; box-shadow:0 0 12px rgba(0,255,136,.95); animation:sparkBlink 1.4s ease-in-out infinite; }

        .zw-neural-desktop { position:relative; min-height:830px; border-radius:42px; overflow:hidden; border:1px solid rgba(0,255,136,.17); background:
          radial-gradient(circle at 50% 50%, rgba(0,255,136,.10), transparent 15%),
          radial-gradient(circle at 50% 50%, rgba(191,54,248,.16), transparent 25%),
          linear-gradient(135deg, rgba(5,5,6,.94), rgba(9,11,14,.96) 48%, rgba(5,4,8,.98));
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.025), inset 0 0 80px rgba(0,255,136,.05), 0 30px 120px rgba(0,0,0,.48);
        }
        .zw-neural-desktop::before { content:""; position:absolute; inset:0; background-image: linear-gradient(rgba(0,255,136,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(191,54,248,.045) 1px, transparent 1px); background-size:40px 40px; mask-image:radial-gradient(circle at center, black 0%, transparent 74%); animation:scanDrift 18s linear infinite; }
        .zw-starfield { position:absolute; inset:0; background-image: radial-gradient(circle, rgba(0,255,136,.72) 0 1px, transparent 1.5px), radial-gradient(circle, rgba(191,54,248,.7) 0 1px, transparent 1.5px); background-size: 90px 90px, 130px 130px; background-position: 20px 30px, 70px 10px; opacity:.22; }
        .zw-neural-map { position:absolute; inset:0; width:100%; height:100%; z-index:1; }
        .zw-neural-line { stroke:url(#zwLineGradient); stroke-width:.18; stroke-dasharray: 5 8; stroke-linecap:round; animation:lineFlow 3.2s linear infinite; filter:drop-shadow(0 0 4px rgba(0,255,136,.5)); }
        .zw-neural-map line:nth-child(odd) { stroke:#00ff88; }
        .zw-neural-map line:nth-child(even) { stroke:#bf36f8; }

        .zw-brain-core { position:absolute; left:50%; top:50%; width:250px; height:250px; transform:translate(-50%,-50%); z-index:4; animation:brainPulse 5s ease-in-out infinite; }
        .zw-orbit { position:absolute; left:50%; top:50%; border-radius:999px; transform:translate(-50%,-50%); pointer-events:none; }
        .zw-orbit-one { width:100%; height:100%; border:1px solid rgba(0,255,136,.45); box-shadow:0 0 34px rgba(0,255,136,.28), inset 0 0 28px rgba(0,255,136,.12); }
        .zw-orbit-two { width:116%; height:116%; border:1px dashed rgba(191,54,248,.45); animation:orbitSpin 22s linear infinite; }
        .zw-orbit-three { width:137%; height:137%; border:1px solid rgba(255,255,255,.08); animation:orbitSpin 34s linear reverse infinite; }
        .zw-brain-inner { position:absolute; inset:18px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; border-radius:999px; background:radial-gradient(circle at 50% 34%, rgba(255,255,255,.12), transparent 14%), radial-gradient(circle at 50% 58%, rgba(0,255,136,.16), rgba(191,54,248,.13) 36%, rgba(4,5,7,.97) 68%); border:1px solid rgba(0,255,136,.34); box-shadow:inset 0 0 45px rgba(0,0,0,.75), 0 0 80px rgba(191,54,248,.24); }
        .zw-fire-z { font:1000 54px/.8 Space Grotesk, sans-serif; letter-spacing:-.14em; padding-right:8px; color:#f8fff0; animation:flameShift 2.8s ease-in-out infinite; }
        .zw-brain-name { max-width:170px; margin-top:8px; color:#fff; font:900 15px/1.05 Space Grotesk, sans-serif; letter-spacing:-.04em; }
        .zw-brain-title { margin-top:6px; color:#00ff88; font:900 9px/1 Space Grotesk, sans-serif; letter-spacing:.22em; }
        .zw-brain-income { margin-top:12px; color:#fff; font:1000 30px/.9 Space Grotesk, sans-serif; letter-spacing:-.08em; text-shadow:0 0 26px rgba(0,255,136,.38); }
        .zw-brain-caption { margin-top:5px; color:rgba(255,255,255,.54); font:800 9px/1 Space Grotesk, sans-serif; text-transform:uppercase; letter-spacing:.12em; }
        .zw-brain-footer { position:absolute; left:26px; right:26px; bottom:24px; display:flex; justify-content:space-between; gap:8px; color:rgba(255,255,255,.58); font:800 8px/1.1 Space Grotesk, sans-serif; }

        .zw-system-node { position:absolute; z-index:3; width:245px; min-height:132px; padding:14px; border-radius:18px; text-decoration:none; background:linear-gradient(145deg, rgba(13,17,20,.86), rgba(7,8,11,.94)); border:1px solid rgba(0,255,136,.16); box-shadow:inset 0 1px 0 rgba(255,255,255,.05), 0 18px 54px rgba(0,0,0,.34); backdrop-filter:blur(16px); animation:floatNode 6s ease-in-out infinite; overflow:hidden; }
        .zw-system-node::before { content:""; position:absolute; inset:0; background:radial-gradient(circle at 0 0, var(--node-glow), transparent 58%); opacity:.8; pointer-events:none; }
        .zw-system-node::after { content:""; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--node-color); box-shadow:0 0 18px var(--node-color); }
        .zw-system-node:hover { transform:translateY(-5px) scale(1.015); border-color:var(--node-color); box-shadow:0 24px 70px rgba(0,0,0,.45), 0 0 34px var(--node-glow); }
        .zw-node-green { --node-color:#00ff88; --node-glow:rgba(0,255,136,.18); }
        .zw-node-purple { --node-color:#bf36f8; --node-glow:rgba(191,54,248,.19); }
        .zw-node-blue { --node-color:#38bdf8; --node-glow:rgba(56,189,248,.16); }
        .zw-node-red { --node-color:#ff3b6b; --node-glow:rgba(255,59,107,.18); }
        .zw-node-amber { --node-color:#f59e0b; --node-glow:rgba(245,158,11,.15); }
        .zw-node-header { position:relative; z-index:1; display:flex; justify-content:space-between; align-items:center; color:var(--node-color); font:900 10px/1 Space Grotesk, sans-serif; letter-spacing:.1em; }
        .zw-node-header i { width:7px; height:7px; border-radius:999px; background:var(--node-color); box-shadow:0 0 12px var(--node-color); animation:sparkBlink 2s ease-in-out infinite; }
        .zw-node-title { position:relative; z-index:1; margin-top:11px; color:#fff; font:900 15px/1.05 Space Grotesk, sans-serif; letter-spacing:-.04em; }
        .zw-node-metric { position:relative; z-index:1; margin-top:11px; color:var(--node-color); font:1000 28px/.9 Space Grotesk, sans-serif; letter-spacing:-.07em; }
        .zw-node-label { position:relative; z-index:1; margin-top:6px; color:rgba(255,255,255,.52); font:750 10px/1.2 Space Grotesk, sans-serif; }

        .zw-dashboard-shell .zw-outcome-rail { position:absolute; right:18px; top:18px; bottom:18px; width:190px; z-index:4; display:flex; flex-direction:column; gap:12px; padding:14px; border-radius:26px; background:linear-gradient(180deg, rgba(5,5,7,.92), rgba(9,5,14,.88)) !important; border:1px solid rgba(0,255,136,.26) !important; color:#fff !important; box-shadow:inset 0 0 40px rgba(0,255,136,.055), 0 0 42px rgba(191,54,248,.14); backdrop-filter:blur(18px); }
        .zw-rail-title { color:#00ff88; font:1000 10px/1.2 Space Grotesk, sans-serif; letter-spacing:.2em; }
        .zw-dashboard-shell .zw-signal { padding:12px; border-radius:15px; background:rgba(255,255,255,.045) !important; border:1px solid rgba(255,255,255,.09) !important; color:#fff !important; }
        .zw-signal span { display:block; color:rgba(255,255,255,.48); font:800 9px/1 Space Grotesk, sans-serif; text-transform:uppercase; letter-spacing:.1em; }
        .zw-signal strong { display:block; margin-top:7px; color:#fff; font:1000 20px/.9 Space Grotesk, sans-serif; letter-spacing:-.06em; }
        .zw-signal em { display:block; margin-top:7px; font:800 10px/1 Space Grotesk, sans-serif; font-style:normal; }
        .zw-signal-green em { color:#00ff88; } .zw-signal-purple em { color:#bf36f8; } .zw-signal-blue em { color:#38bdf8; } .zw-signal-red em { color:#ff3b6b; }
        .zw-dashboard-shell .zw-rail-footer { margin-top:auto; padding:12px; border-radius:16px; color:#00ff88 !important; font:900 9px/1.35 Space Grotesk, sans-serif; letter-spacing:.13em; border:1px solid rgba(0,255,136,.22) !important; background:rgba(0,255,136,.075) !important; }

        .zw-intel-grid { display:grid; grid-template-columns:1fr; gap:18px; margin-top:18px; }
        .zw-intel-module { position:relative; overflow:hidden; border-radius:24px; padding:18px; background:linear-gradient(145deg, rgba(10,10,12,.86), rgba(5,5,6,.96)); border:1px solid rgba(0,255,136,.14); box-shadow:inset 0 1px 0 rgba(255,255,255,.04), 0 24px 80px rgba(0,0,0,.28); }
        .zw-intel-module::before { content:""; position:absolute; inset:0; background:radial-gradient(circle at 12% 0, var(--module-glow), transparent 32%); pointer-events:none; }
        .zw-intel-green { --module-color:#00ff88; --module-glow:rgba(0,255,136,.13); } .zw-intel-purple { --module-color:#bf36f8; --module-glow:rgba(191,54,248,.14); } .zw-intel-blue { --module-color:#38bdf8; --module-glow:rgba(56,189,248,.12); }
        .zw-module-head { position:relative; z-index:1; display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin-bottom:14px; }
        .zw-module-head span { color:var(--module-color); font:1000 10px/1 Space Grotesk, sans-serif; letter-spacing:.2em; }
        .zw-module-head h2 { color:#fff; font:1000 18px/.95 Space Grotesk, sans-serif; letter-spacing:-.05em; margin:0; }

        .zw-mobile-command { display:none; }
        .zw-agent-scroll { display:flex; gap:10px; overflow-x:auto; padding:2px 2px 10px; scroll-snap-type:x mandatory; }
        .zw-agent-pill { min-width:156px; scroll-snap-align:start; padding:12px; border-radius:18px; background:rgba(255,255,255,.04); border:1px solid rgba(0,255,136,.16); box-shadow:inset 0 0 24px rgba(0,255,136,.035); }
        .zw-agent-pill span { color:#00ff88; font:1000 13px/1 Space Grotesk, sans-serif; }
        .zw-agent-pill strong { display:block; margin-top:7px; color:#fff; font:850 11px/1.2 Space Grotesk, sans-serif; }
        .zw-agent-pill em { display:block; margin-top:8px; color:#bf36f8; font:900 9px/1 Space Grotesk, sans-serif; font-style:normal; text-transform:uppercase; letter-spacing:.12em; }
        .zw-command-feed { display:grid; gap:10px; }
        .zw-feed-item { display:flex; gap:12px; padding:13px; border-radius:18px; text-decoration:none; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); }
        .zw-feed-item span { display:grid; place-items:center; width:32px; height:32px; flex:0 0 auto; border-radius:999px; color:#030304; background:var(--feed-color); font:1000 12px/1 Space Grotesk, sans-serif; box-shadow:0 0 18px var(--feed-glow); }
        .zw-feed-item strong { color:#fff; font:950 13px/1.05 Space Grotesk, sans-serif; }
        .zw-feed-item p { margin:5px 0 0; color:rgba(255,255,255,.54); font:700 11px/1.35 Space Grotesk, sans-serif; }
        .zw-feed-green { --feed-color:#00ff88; --feed-glow:rgba(0,255,136,.35); } .zw-feed-purple { --feed-color:#bf36f8; --feed-glow:rgba(191,54,248,.35); } .zw-feed-red { --feed-color:#ff3b6b; --feed-glow:rgba(255,59,107,.35); }
        .zw-mobile-dock { position:sticky; bottom:10px; z-index:30; display:none; grid-template-columns:repeat(5,1fr); gap:6px; margin-top:14px; padding:8px; border-radius:22px; background:rgba(5,5,7,.86); border:1px solid rgba(0,255,136,.18); backdrop-filter:blur(18px); box-shadow:0 18px 70px rgba(0,0,0,.55); }
        .zw-mobile-dock a { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:48px; border-radius:16px; color:rgba(255,255,255,.64); text-decoration:none; font:900 9px/1.1 Space Grotesk, sans-serif; text-transform:uppercase; letter-spacing:.08em; background:rgba(255,255,255,.03); }
        .zw-mobile-dock a:first-child { color:#030304; background:#00ff88; box-shadow:0 0 18px rgba(0,255,136,.28); }

@media (max-width: 1380px) {
	          .zw-neural-desktop { min-height:760px; }
	          .zw-system-node { width:220px; }
	          .zw-dashboard-shell .zw-outcome-rail { display:none; }
	        }
        @media (max-width: 1023px) {
          .zw-neural-desktop { display:none; }
          .zw-mobile-command { display:flex; flex-direction:column; gap:14px; }
          .zw-mobile-brain-wrap { position:relative; min-height:340px; border-radius:34px; overflow:hidden; border:1px solid rgba(0,255,136,.17); background:radial-gradient(circle at 50% 45%, rgba(0,255,136,.16), transparent 30%), radial-gradient(circle at 64% 34%, rgba(191,54,248,.18), transparent 34%), #050506; }
          .zw-mobile-brain-wrap .zw-brain-core { width:240px; height:240px; }
          .zw-mobile-dock { display:grid; }
          .zw-dashboard-shell::before { inset:65px 0 0 0; }
          .zw-dashboard-header { align-items:flex-start; }
          .zw-live-badge { display:none; }
        }
        @media (min-width: 1024px) {
          .zw-intel-grid { grid-template-columns:1fr 1fr; }
          .zw-intel-module:first-child, .zw-intel-module:nth-child(2) { grid-column:1 / -1; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; scroll-behavior:auto !important; }
        }
      `}</style>
      <PageTransition>
        <div className="zw-dashboard-shell mx-auto flex w-full flex-col gap-4" data-dashboard-rev="12" data-app="ziro-work">
          <header className="zw-dashboard-header">
            <div>
              <div className="zw-dashboard-kicker"><i /> LIVE SCHOOL OPERATING SYSTEM</div>
              <h1 className="zw-dashboard-title">COMMAND CENTER</h1>
              <p className="zw-dashboard-date">{today}</p>
            </div>
            <div className="zw-live-badge"><i /> BRAIN ONLINE</div>
          </header>

          <NeuralDesktop metrics={metrics} />

          <section className="zw-mobile-command" aria-label="Mobile ZiroWork command center">
            <div className="zw-mobile-brain-wrap">
              <div className="zw-starfield" />
              <BrainCore metrics={metrics} />
            </div>
            <AgentOrbitMobile />
            <CommandFeed metrics={metrics} />
          </section>

          <div className="zw-intel-grid">
            <IntelligenceModule eyebrow="LIVE OWNER VITALS" title="Command Strip" accent="green">
              <CommandStrip />
            </IntelligenceModule>
            <IntelligenceModule eyebrow="CAPACITY MAP" title="Studio Capacity" accent="purple">
              <StudioCapacity />
            </IntelligenceModule>
            <IntelligenceModule eyebrow="AGENT NETWORK" title="Platform Intelligence" accent="blue">
              <PlatformCards />
            </IntelligenceModule>
            <IntelligenceModule eyebrow="DEMAND SIGNAL" title="Instrument Demand" accent="purple">
              <InstrumentChart />
            </IntelligenceModule>
            <IntelligenceModule eyebrow="ENROLLMENT ENGINE" title="Lead Pipeline" accent="green">
              <LeadsBox />
            </IntelligenceModule>
          </div>

          <nav className="zw-mobile-dock" aria-label="Mobile command dock">
            <Link href="/crm/leads">Leads</Link>
            <Link href="/schedule">Schedule</Link>
            <Link href="/students">Students</Link>
            <Link href="/billing/invoices">Money</Link>
            <Link href="/crm/search">Search</Link>
          </nav>
        </div>
      </PageTransition>
    </PageShell>
  );
}
