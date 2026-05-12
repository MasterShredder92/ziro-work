"use client";

import { useState, useRef, useEffect, useId } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useZiroWorkspace } from "@/components/workspace/ZiroWorkspaceContext";

// ── Types ─────────────────────────────────────────────────────────────────────


interface DashMetrics {
  activeStudents: number;
  activeFamilies: number;
  collectedCents: number;
  totalInvoicedCents: number;
  outstandingCents: number;
  overdueCount: number;
  scheduledCents: number;
  projectedMonthlyCents: number;
}

interface TeacherData {
  teacherId: string;
  teacherName: string;
  totalSessions: number;
  bookedSessions: number;
  byLocation: { locationId: string; locationName: string; sessions: number }[];
}

interface LocRevenue {
  locationId: string;
  collectedCents: number;
  invoicedCents: number;
  outstandingCents: number;
  collectionRate: number;
}

/** Live aggregates from `schedule_blocks` for the Schedule dashboard tile. */
interface ScheduleOverview {
  sessionsByDow: number[];
  mtdBookedSessions: number;
  mtdOpenSlots: number;
  fillRatePct: number;
  teachersTeachingMtd: number;
  range: { mtdStart: string; mtdEnd: string };
}

/** Live CRM aggregates for the Families dashboard tile. */
interface FamiliesOverview {
  activeFamilies: number;
  newFamiliesMtd: number;
  familiesPastDueBalance: number;
  openLeads: number;
  leadsNeedingFirstTouch: number;
  /** Active students with a `family_id` (same scope as location filter on `students.location_id`). */
  activeStudentsLinked: number;
  /** Distinct `family_id` values among those students — denominator for the average. */
  familiesWithActiveStudent: number;
  newFamiliesByWeek: number[];
  weekLabels: string[];
  range: { mtdStart: string; mtdEnd: string };
}

interface AllData {
  metrics: DashMetrics;
  teachers: TeacherData[];
  locationRevenue: LocRevenue[];
  schedule: ScheduleOverview | null;
  families: FamiliesOverview | null;
}

// ── Palette ───────────────────────────────────────────────────────────────────

const GREEN   = "#b4ff00";
const PURPLE  = "#9900ff";
const PINK    = "#ff00cc";
const BLUE    = "#22d3ee";
const AMBER   = "#f59e0b";
const RED     = "#ef4444";
const TEAL    = "#00e5cc";
const FONT    = "'Inter', system-ui, sans-serif";
const NUMFONT = "'Plus Jakarta Sans', system-ui, sans-serif";

/** Heart progress ring: red (low) → yellow (mid) → green (high). */
function healthStrokeRgb(score: number): { r: number; g: number; b: number } {
  const s = Math.max(0, Math.min(100, score)) / 100;
  if (s <= 0.5) {
    const t = s * 2;
    return {
      r: Math.round(239 + (234 - 239) * t),
      g: Math.round(68 + (179 - 68) * t),
      b: Math.round(68 + (8 - 68) * t),
    };
  }
  const t = (s - 0.5) * 2;
  return {
    r: Math.round(234 + (34 - 234) * t),
    g: Math.round(179 + (197 - 179) * t),
    b: Math.round(8 + (94 - 8) * t),
  };
}

function healthStrokeColor(score: number): string {
  const { r, g, b } = healthStrokeRgb(score);
  return `rgb(${r},${g},${b})`;
}

function healthGlowRgba(score: number, a: number): string {
  const { r, g, b } = healthStrokeRgb(score);
  return `rgba(${r},${g},${b},${a})`;
}

/** Matches `AppLocationRail` aside width so fixed dashboard layers leave the rail visible. */
const WORKSPACE_LOCATION_RAIL_PX = 88;

/** Deep black shell with very soft vignettes — neutral / warm, no blue-gray cast. */
const DASHBOARD_SHELL_BACKDROP: Pick<
  CSSProperties,
  "backgroundColor" | "backgroundImage" | "backgroundSize" | "backgroundPosition" | "backgroundRepeat"
> = {
  backgroundColor: "#000000",
  backgroundImage: [
    "radial-gradient(circle at 50% 118%, rgba(180,255,0,0.034) 0%, transparent 48%)",
    "radial-gradient(circle at 50% -14%, rgba(255,255,255,0.02) 0%, transparent 34%)",
    "radial-gradient(circle at 100% 6%, rgba(52,52,52,0.14) 0%, transparent 38%)",
    "radial-gradient(circle at 0% 94%, rgba(46,46,46,0.12) 0%, transparent 38%)",
    "radial-gradient(ellipse 100% 78% at 50% 44%, rgba(10,10,10,0.78) 0%, transparent 72%)",
    "radial-gradient(rgba(255,255,255,0.012) 1px, transparent 1px)",
  ].join(", "),
  backgroundSize: "100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 36px 36px",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat, no-repeat, no-repeat, no-repeat, no-repeat, repeat",
};

// ── Module definitions — center-anchored percentage coordinates ───────────────
//
// left/top are the CENTER of each box (translate(-50%,-50%) anchors to center).
// pathStyle: "H" = horizontal-first L-bend, "V" = vertical-first, "S" = straight.
// dotEdge: which face of the box holds the HTML connector dot (facing the orb).

interface ModDef {
  id: string; label: string; num: string; sub: string;
  color: string; color2?: string; float: string;
  leftPct: number;
  topPct:  number;
  pathStyle: "H" | "V" | "S";
  dotEdge: "top" | "bottom" | "left" | "right";
}

const MODULE_DEFS: ModDef[] = [
  { id: "schedule",  label: "Schedule",   num: "01", sub: "Sessions & Availability",  color: BLUE,   color2: "#0ea5e9", float: "float0", leftPct: 50, topPct: 19, pathStyle: "S", dotEdge: "bottom" },
  { id: "families",  label: "Families",   num: "02", sub: "Household Management",     color: GREEN,  color2: "#22c55e", float: "float1", leftPct: 84, topPct: 18, pathStyle: "H", dotEdge: "left"   },
  { id: "invoices",  label: "Invoices",   num: "03", sub: "Billing & Collections",    color: AMBER,  color2: "#ef4444", float: "float2", leftPct: 85, topPct: 50, pathStyle: "S", dotEdge: "left"   },
  { id: "lifecycle", label: "Life Cycle", num: "04", sub: "Student Journey Tracking", color: PURPLE, color2: PINK,      float: "float3", leftPct: 84, topPct: 82, pathStyle: "H", dotEdge: "left"   },
  { id: "ai-agents", label: "AI Agents",  num: "05", sub: "Autonomous Operations",    color: RED,    color2: PINK,      float: "float4", leftPct: 50, topPct: 84, pathStyle: "S", dotEdge: "top"    },
  { id: "finance",   label: "Financials", num: "06", sub: "Revenue & Projections",    color: GREEN,  color2: "#22c55e", float: "float5", leftPct: 16, topPct: 82, pathStyle: "H", dotEdge: "right"  },
  { id: "payroll",   label: "Payroll",    num: "07", sub: "Teacher Compensation",     color: PINK,   color2: PURPLE,    float: "float6", leftPct: 15, topPct: 50, pathStyle: "S", dotEdge: "right"  },
  { id: "teachers",  label: "Teachers",   num: "08", sub: "Instructor Overview",      color: TEAL,   color2: BLUE,      float: "float7", leftPct: 16, topPct: 18, pathStyle: "H", dotEdge: "right"  },
];

// ── CSS ───────────────────────────────────────────────────────────────────────
// IMPORTANT: float keyframes MUST include translate(-50%,-50%) in every frame
// because animation overrides the inline transform style entirely.

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes ringA  { to { transform: rotate(360deg); } }
  @keyframes ringB  { to { transform: rotate(-360deg); } }
  @keyframes breathe {
    0%,100% { transform:scale(1);    box-shadow:0 0 32px rgba(153,0,255,.28),0 0 64px rgba(180,255,0,.08),inset 0 0 24px rgba(153,0,255,.14); }
    50%     { transform:scale(1.05); box-shadow:0 0 52px rgba(153,0,255,.44),0 0 96px rgba(180,255,0,.12),inset 0 0 36px rgba(153,0,255,.22); }
  }
  @keyframes locPulse { 0%{transform:scale(1);opacity:1;} 40%,100%{transform:scale(1.7);opacity:0;} }
  @keyframes dotBlink { 0%,100%{opacity:1;} 50%{opacity:.2;} }
  @keyframes flashIn  { from{opacity:0;transform:scale(.96);} to{opacity:1;transform:scale(1);} }
  @keyframes ticker   { from{transform:translateX(0);} to{transform:translateX(-50%);} }
  @keyframes glitch {
    0%,91%,100%{transform:translate(0) skewX(0);opacity:1;}
    92%{transform:translate(-3px,0) skewX(-5deg);opacity:.85;}
    93%{transform:translate(3px,0) skewX(3deg);opacity:.9;}
    94%{transform:translate(0) skewX(0);opacity:1;}
  }
  @keyframes float0 { 0%,100%{transform:translate(-50%,-50%) translateY(0px)}   50%{transform:translate(-50%,-50%) translateY(-9px)} }
  @keyframes float1 { 0%,100%{transform:translate(-50%,-50%) translateY(-5px)}  50%{transform:translate(-50%,-50%) translateY(5px)}  }
  @keyframes float2 { 0%,100%{transform:translate(-50%,-50%) translateY(-3px)}  50%{transform:translate(-50%,-50%) translateY(8px)}  }
  @keyframes float3 { 0%,100%{transform:translate(-50%,-50%) translateY(4px)}   50%{transform:translate(-50%,-50%) translateY(-7px)} }
  @keyframes float4 { 0%,100%{transform:translate(-50%,-50%) translateY(-7px)}  50%{transform:translate(-50%,-50%) translateY(4px)}  }
  @keyframes float5 { 0%,100%{transform:translate(-50%,-50%) translateY(2px)}   50%{transform:translate(-50%,-50%) translateY(-8px)} }
  @keyframes float6 { 0%,100%{transform:translate(-50%,-50%) translateY(-4px)}  50%{transform:translate(-50%,-50%) translateY(6px)}  }
  @keyframes float7 { 0%,100%{transform:translate(-50%,-50%) translateY(3px)}   50%{transform:translate(-50%,-50%) translateY(-9px)} }
`;

// ── Routing ───────────────────────────────────────────────────────────────────

const MODULE_WIRE_HREFS: Record<string, string> = {
  schedule:  "/schedule",
  families:  "/crm",
  invoices:  "/invoices",
  lifecycle: "/lifecycle",
  finance:   "/financials",
  payroll:   "/payroll",
  teachers:  "/teachers",
};

// ── Health score ──────────────────────────────────────────────────────────────

function computeHealthScore(d: AllData): number {
  const inv = d.metrics.totalInvoicedCents;
  const collRate = inv > 0 ? (d.metrics.collectedCents / inv) * 100 : 0;
  const tot = d.teachers.reduce((s, t) => s + t.totalSessions, 0);
  const bkd = d.teachers.reduce((s, t) => s + t.bookedSessions, 0);
  const fillRate = tot > 0 ? (bkd / tot) * 100 : 0;
  return Math.min(99, Math.max(0, Math.round(collRate * 0.6 + fillRate * 0.4)));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(cents: number) { return `$${Math.round(cents / 100).toLocaleString()}`; }
function px(n: number) { return Math.round(n * 10) / 10; }

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** 45° chamfer on orthogonal bends — reads like a PCB trace, not a plain L. */
function circuitChamferSize(legA: number, legB: number) {
  const m = Math.min(Math.abs(legA), Math.abs(legB));
  if (m < 2) return 0;
  return Math.min(22, Math.max(9, m * 0.11));
}

/** Horizontal-first bend: orb → … → (ftx, fty), corner at (ftx, ey). */
function circuitPathHFirst(ex: number, ey: number, ftx: number, fty: number) {
  const legH = ftx - ex;
  const legV = fty - ey;
  let c = circuitChamferSize(legH, legV);
  c = Math.min(c, Math.abs(legH) * 0.48, Math.abs(legV) * 0.48);
  const sx = legH >= 0 ? 1 : -1;
  const sy = legV >= 0 ? 1 : -1;
  if (c < 5) {
    return {
      d: `M ${px(ex)} ${px(ey)} L ${px(ftx)} ${px(ey)} L ${px(ftx)} ${px(fty)}`,
      jx: ftx,
      jy: ey,
    };
  }
  const jx = ftx - sx * c * 0.55;
  const jy = ey + sy * c * 0.55;
  return {
    d: `M ${px(ex)} ${px(ey)} L ${px(ftx - sx * c)} ${px(ey)} L ${px(ftx)} ${px(ey + sy * c)} L ${px(ftx)} ${px(fty)}`,
    jx,
    jy,
  };
}

/** Vertical-first bend: corner at (ex, fty). */
function circuitPathVFirst(ex: number, ey: number, ftx: number, fty: number) {
  const legV = fty - ey;
  const legH = ftx - ex;
  let c = circuitChamferSize(legH, legV);
  c = Math.min(c, Math.abs(legH) * 0.48, Math.abs(legV) * 0.48);
  const sx = legH >= 0 ? 1 : -1;
  const sy = legV >= 0 ? 1 : -1;
  if (c < 5) {
    return {
      d: `M ${px(ex)} ${px(ey)} L ${px(ex)} ${px(fty)} L ${px(ftx)} ${px(fty)}`,
      jx: ex,
      jy: fty,
    };
  }
  const jx = ex + sx * c * 0.55;
  const jy = fty - sy * c * 0.55;
  return {
    d: `M ${px(ex)} ${px(ey)} L ${px(ex)} ${px(fty - sy * c)} L ${px(ex + sx * c)} ${px(fty)} L ${px(ftx)} ${px(fty)}`,
    jx,
    jy,
  };
}

/** Diagonal “bus” — soft cubic bend instead of a dead straight wire. */
function circuitPathCurved(ex: number, ey: number, ftx: number, fty: number, seed: string) {
  const dx = ftx - ex;
  const dy = fty - ey;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const pxv = -uy;
  const pyv = ux;
  const h = strHash(seed);
  const polarity = (h & 1) === 0 ? 1 : -1;
  const amp = Math.min(len * 0.085, 34) * polarity;
  const c1x = ex + ux * len * 0.32 + pxv * amp;
  const c1y = ey + uy * len * 0.32 + pyv * amp;
  const c2x = ex + ux * len * 0.68 - pxv * amp * 0.85;
  const c2y = ey + uy * len * 0.68 - pyv * amp * 0.85;
  const mx = ex + dx * 0.5 + pxv * amp * 0.22;
  const my = ey + dy * 0.5 + pyv * amp * 0.22;
  return {
    d: `M ${px(ex)} ${px(ey)} C ${px(c1x)} ${px(c1y)} ${px(c2x)} ${px(c2y)} ${px(ftx)} ${px(fty)}`,
    jx: mx,
    jy: my,
  };
}

// ── Chart primitives ─────────────────────────────────────────────────────────

function DonutChart({ pct, color, color2, size = 88, gid }: {
  pct: number; color: string; color2?: string; size?: number; gid: string;
}) {
  const r = (size - 18) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(Math.max(pct, 0), 100) / 100 * circ;
  const cx = size / 2, cy = size / 2;
  const gId = `dg-${gid}`;
  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color2 ?? color} />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={9} transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`url(#${gId})`} strokeWidth={9}
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={0} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter: `drop-shadow(0 0 8px ${color}99)`, transition: "stroke-dasharray 1s ease" }} />
      <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle"
        fill="#fff" fontSize={size * 0.19} fontWeight="600" fontFamily={NUMFONT}>{pct}%</text>
      <text x={cx} y={cy + size * 0.16} textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,.3)" fontSize={size * 0.1} fontFamily={FONT}>rate</text>
    </svg>
  );
}

function Sparkline({ values, color, w = 300, h = 54, gid }: {
  values: number[]; color: string; w?: number; h?: number; gid: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values), rng = max - min || 1;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h - 6 - ((v - min) / rng) * (h - 14),
  }));
  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i - 1].x + pts[i].x) / 2;
    path += ` C ${cp} ${pts[i - 1].y} ${cp} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }
  const area = `${path} L ${pts[pts.length - 1].x} ${h} L 0 ${h} Z`;
  const last = pts[pts.length - 1];
  const aId = `sl-${gid}`;
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={aId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${aId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      <circle cx={last.x} cy={last.y} r={3.5} fill={color}
        style={{ filter: `drop-shadow(0 0 8px ${color})`, animation: "dotBlink 2s ease-in-out infinite" }} />
    </svg>
  );
}

function MiniBar({ values, labels, color, color2, w = 300, h = 60, gid }: {
  values: number[]; labels?: string[]; color: string; color2?: string; w?: number; h?: number; gid: string;
}) {
  const max = Math.max(...values) || 1;
  const n = values.length;
  const bw = (w / n) * 0.55;
  const step = w / n;
  const bId = `mb-${gid}`;
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={bId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color2 ?? color} stopOpacity={0.55} />
        </linearGradient>
      </defs>
      {values.map((v, i) => {
        const bh = Math.max(2, (v / max) * (h - 14));
        const x = i * step + (step - bw) / 2;
        const y = h - 12 - bh;
        return (
          <g key={i}>
            <rect x={x} y={0} width={bw} height={h - 12} rx={2} fill="rgba(255,255,255,.03)" />
            <rect x={x} y={y} width={bw} height={bh} rx={2} fill={`url(#${bId})`}
              style={{ filter: `drop-shadow(0 0 5px ${color}70)` }} />
            {labels && <text x={x + bw / 2} y={h - 1} textAnchor="middle"
              fill="rgba(255,255,255,.25)" fontSize={7} fontFamily={FONT}>{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ── Inner card primitives ─────────────────────────────────────────────────────

function IC({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(0,0,0,.44)", border: "1px solid rgba(255,255,255,.05)",
      borderRadius: 7, padding: "7px 10px", boxShadow: "inset 0 2px 8px rgba(0,0,0,.45)",
      ...style,
    }}>{children}</div>
  );
}

function SL({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: FONT, fontSize: 8, fontWeight: 500, color: "rgba(255,255,255,.28)", letterSpacing: ".05em", marginBottom: 4 }}>{children}</div>;
}

function SV({ children, color, size }: { children: React.ReactNode; color?: string; size?: number }) {
  return (
    <div style={{
      fontFamily: NUMFONT, fontSize: size ?? 20, fontWeight: 600,
      color: color ?? "#e8e8f4", lineHeight: 1,
      letterSpacing: "-.01em", fontVariantNumeric: "tabular-nums",
    }}>{children}</div>
  );
}

// ── Module content components ─────────────────────────────────────────────────

function ScheduleContent({ data, locId }: { data: AllData; locId: string | null }) {
  const sch = data.schedule;
  if (!sch) {
    return (
      <div style={{ fontFamily: FONT, fontSize: 9, color: "rgba(255,255,255,.28)", padding: "4px 0" }}>
        Schedule metrics unavailable. Check network or try again shortly.
      </div>
    );
  }
  const { sessionsByDow, mtdBookedSessions, mtdOpenSlots, fillRatePct, teachersTeachingMtd, range } = sch;
  const scope = locId ? "This location · MTD" : "All locations · MTD";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      <IC style={{ gridColumn: "1 / -1" }}>
        <SL>Session load by weekday</SL>
        <MiniBar values={sessionsByDow} labels={["M", "T", "W", "T", "F", "S", "S"]} color={BLUE} color2="#0ea5e9" gid="sched" />
        <div style={{ fontFamily: FONT, fontSize: 6.5, color: "rgba(255,255,255,.22)", marginTop: 4, letterSpacing: ".02em" }}>
          {scope} · {range.mtdStart} → {range.mtdEnd}
        </div>
      </IC>
      <IC><SL>Booked sessions</SL><SV color={BLUE}>{mtdBookedSessions}</SV></IC>
      <IC><SL>Capacity fill</SL><SV color={fillRatePct >= 70 ? GREEN : AMBER}>{fillRatePct}%</SV></IC>
      <IC><SL>Teachers w/ sessions</SL><SV>{teachersTeachingMtd}</SV></IC>
      <IC><SL>Open slots posted</SL><SV color={mtdOpenSlots > 0 ? TEAL : "rgba(255,255,255,.35)"}>{mtdOpenSlots}</SV></IC>
    </div>
  );
}

function FamiliesContent({ data, locId }: { data: AllData; locId: string | null }) {
  const fam = data.families;
  if (!fam) {
    return (
      <div style={{ fontFamily: FONT, fontSize: 9, color: "rgba(255,255,255,.28)", padding: "4px 0" }}>
        Family metrics unavailable. Check network or try again shortly.
      </div>
    );
  }
  const scope = locId ? "Primary studio on file" : "All locations";
  const avgStudentsPerFamily =
    fam.familiesWithActiveStudent > 0
      ? (fam.activeStudentsLinked / fam.familiesWithActiveStudent).toFixed(1)
      : "—";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <IC>
        <SL>New families · last 8 weeks</SL>
        <MiniBar values={fam.newFamiliesByWeek} labels={fam.weekLabels} color={GREEN} color2="#22c55e" gid="famwk" />
        <div style={{ fontFamily: FONT, fontSize: 6.5, color: "rgba(255,255,255,.22)", marginTop: 4, letterSpacing: ".02em" }}>
          {scope} · MTD {fam.range.mtdStart} → {fam.range.mtdEnd}
        </div>
      </IC>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <IC><SL>Active families</SL><SV color={GREEN}>{fam.activeFamilies}</SV></IC>
        <IC><SL>New families MTD</SL><SV color={GREEN}>{fam.newFamiliesMtd}</SV></IC>
        <IC><SL>Open leads</SL><SV color={BLUE}>{fam.openLeads}</SV></IC>
        <IC><SL>Needs first touch</SL><SV color={fam.leadsNeedingFirstTouch > 0 ? AMBER : "rgba(255,255,255,.35)"}>{fam.leadsNeedingFirstTouch}</SV></IC>
        <IC><SL>Families past-due</SL><SV color={fam.familiesPastDueBalance > 0 ? AMBER : "rgba(255,255,255,.35)"}>{fam.familiesPastDueBalance}</SV></IC>
        <IC>
          <SL>Avg students / family</SL>
          <SV>{avgStudentsPerFamily}</SV>
          <div style={{ fontFamily: FONT, fontSize: 6, color: "rgba(255,255,255,.18)", marginTop: 3, lineHeight: 1.2 }}>
            Among families with ≥1 active student{locId ? " at this location" : ""}
          </div>
        </IC>
      </div>
    </div>
  );
}

function LifeCycleContent({ data }: { data: AllData }) {
  const active   = data.metrics.activeStudents;
  const atRisk   = data.metrics.overdueCount;
  const enrolled = active + atRisk;
  const churned  = Math.max(1, Math.round(enrolled * 0.07));
  const tiers = [
    { label: "Enrolled", count: enrolled, color: GREEN, pct: 100 },
    { label: "Active",   count: active,   color: BLUE,  pct: enrolled > 0 ? Math.round((active / enrolled) * 100) : 0 },
    { label: "At-Risk",  count: atRisk,   color: AMBER, pct: enrolled > 0 ? Math.round((atRisk / enrolled) * 100) : 0 },
    { label: "Churned",  count: churned,  color: RED,   pct: enrolled > 0 ? Math.round((churned / enrolled) * 100) : 0 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <IC>
        <SL>Student Funnel</SL>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
          {tiers.map(t => (
            <div key={t.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontFamily: FONT, fontSize: 8.5, color: "rgba(255,255,255,.38)" }}>{t.label}</span>
                <span style={{ fontFamily: NUMFONT, fontSize: 8.5, fontWeight: 600, color: t.color, fontVariantNumeric: "tabular-nums" }}>{t.count}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,.06)" }}>
                <div style={{ width: `${t.pct}%`, height: "100%", borderRadius: 3, background: t.color, transition: "width .8s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </IC>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <IC><SL>Active Students</SL><SV color={GREEN}>{active}</SV></IC>
        <IC><SL>At-Risk</SL><SV color={AMBER}>{atRisk}</SV></IC>
      </div>
    </div>
  );
}

function InvoicesContent({ data, locId }: { data: AllData; locId: string | null }) {
  const loc  = locId ? data.locationRevenue.find(l => l.locationId === locId) : null;
  const col  = loc?.collectedCents   ?? data.metrics.collectedCents;
  const inv  = loc?.invoicedCents    ?? data.metrics.totalInvoicedCents;
  const out  = loc?.outstandingCents ?? data.metrics.outstandingCents;
  const rate = loc?.collectionRate   ?? (inv > 0 ? Math.round((col / inv) * 100) : 0);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 6 }}>
      <IC style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 8px" }}>
        <DonutChart pct={rate} color={AMBER} color2="#ef4444" size={78} gid="inv" />
      </IC>
      <div style={{ display: "grid", gap: 8 }}>
        <IC><SL>Outstanding</SL><SV color={AMBER} size={15}>{fmt$(out)}</SV></IC>
        <IC><SL>Invoiced MTD</SL><SV size={15}>{fmt$(inv)}</SV></IC>
        <IC><SL>Overdue Count</SL><SV color={data.metrics.overdueCount > 5 ? RED : AMBER}>{data.metrics.overdueCount}</SV></IC>
      </div>
    </div>
  );
}

function FinancialsContent({ data, locId }: { data: AllData; locId: string | null }) {
  const loc  = locId ? data.locationRevenue.find(l => l.locationId === locId) : null;
  const col  = loc?.collectedCents ?? data.metrics.collectedCents;
  const inv  = loc?.invoicedCents  ?? data.metrics.totalInvoicedCents;
  const proj = data.metrics.projectedMonthlyCents;
  const trend = [0.72, 0.78, 0.85, 0.91, 0.96, 1.0].map(f => Math.round(col * f));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <IC>
        <SL>Revenue Trend — 6 months</SL>
        <div style={{ marginTop: 6 }}><Sparkline values={trend} color={GREEN} gid="fin" /></div>
      </IC>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <IC><SL>Collected</SL><SV color={GREEN} size={13}>{fmt$(col)}</SV></IC>
        <IC><SL>Invoiced</SL><SV size={13}>{fmt$(inv)}</SV></IC>
        <IC><SL>Projected</SL><SV color={BLUE} size={13}>{fmt$(proj)}</SV></IC>
      </div>
    </div>
  );
}

function PayrollContent({ data, locId }: { data: AllData; locId: string | null }) {
  const teachers = locId
    ? data.teachers.filter(t => t.byLocation.some(l => l.locationId === locId))
    : data.teachers;
  const vals  = teachers.slice(0, 6).map(t => t.totalSessions);
  const lbls  = teachers.slice(0, 6).map(t => t.teacherName.split(" ")[0].slice(0, 4));
  const total = teachers.reduce((s, t) => s + t.totalSessions, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <IC>
        <SL>Sessions by Teacher</SL>
        <div style={{ marginTop: 6 }}>
          <MiniBar values={vals.length ? vals : [1]} labels={lbls} color={PINK} color2={PURPLE} gid="pay" />
        </div>
      </IC>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <IC><SL>Active Teachers</SL><SV color={PINK}>{teachers.length}</SV></IC>
        <IC><SL>Total Sessions</SL><SV>{total}</SV></IC>
      </div>
    </div>
  );
}

function AIAgentsContent({ data }: { data: AllData }) {
  const activeAgents = 3;
  const tasksToday   = 47;
  const successRate  = 94;
  const agents: { name: string; task: string; status: "active" | "idle" | "processing" }[] = [
    { name: "Billing Bot",  task: "Overdue notices sent",     status: "active" },
    { name: "Enroll Scout", task: "Monitoring re-engagement", status: "processing" },
    { name: "Schedule AI",  task: "Gap-fill recommendations", status: "active" },
  ];
  const statusColor = (s: "active" | "idle" | "processing") =>
    s === "active" ? GREEN : s === "processing" ? AMBER : "rgba(255,255,255,.25)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <IC><SL>Active</SL><SV color={RED}>{activeAgents}</SV></IC>
        <IC><SL>Tasks Today</SL><SV color={AMBER}>{tasksToday}</SV></IC>
        <IC><SL>Success</SL><SV color={successRate >= 90 ? GREEN : AMBER}>{successRate}%</SV></IC>
      </div>
      <IC>
        <SL>Agent Status</SL>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          {agents.map(ag => (
            <div key={ag.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor(ag.status), boxShadow: `0 0 6px ${statusColor(ag.status)}`, flexShrink: 0, animation: ag.status !== "idle" ? "dotBlink 2s ease-in-out infinite" : "none" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 700, color: "#d8d8e8" }}>{ag.name}</div>
                <div style={{ fontFamily: FONT, fontSize: 7, color: "rgba(255,255,255,.28)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ag.task}</div>
              </div>
              <span style={{ fontFamily: FONT, fontSize: 6.5, letterSpacing: ".1em", color: statusColor(ag.status), textTransform: "uppercase", flexShrink: 0 }}>{ag.status}</span>
            </div>
          ))}
        </div>
      </IC>
      <IC>
        <SL>Actions MTD</SL>
        <MiniBar values={[12, 18, 22, 15, 29, 34, 40].map(v => Math.round(v * (tasksToday / 40)))} labels={["M","T","W","T","F","S","S"]} color={RED} color2={PINK} gid="ai" />
      </IC>
    </div>
  );
}

function TeachersContent({ data, locId }: { data: AllData; locId: string | null }) {
  const COLORS = [TEAL, GREEN, BLUE, PINK, AMBER];
  const teachers = locId
    ? data.teachers.filter(t => t.byLocation.some(l => l.locationId === locId))
    : data.teachers;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {teachers.length === 0 && (
        <IC><div style={{ fontFamily: FONT, fontSize: 10, color: "rgba(255,255,255,.3)", textAlign: "center" }}>No teachers found</div></IC>
      )}
      {teachers.slice(0, 4).map((t, i) => {
        const c = COLORS[i % COLORS.length];
        const initials = t.teacherName.split(" ").map((w: string) => w[0]).join("").slice(0, 2);
        return (
          <IC key={t.teacherId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 11px" }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${c}28, rgba(0,0,0,.4))`,
              border: `1px solid ${c}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: NUMFONT, fontSize: 9, fontWeight: 700, color: c,
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: "#d8d8e8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.teacherName}</div>
              <div style={{ fontFamily: FONT, fontSize: 7.5, color: "rgba(255,255,255,.26)" }}>{t.totalSessions} sessions · {t.bookedSessions} booked</div>
            </div>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: TEAL, boxShadow: `0 0 6px ${TEAL}`, animation: "dotBlink 2.5s ease-in-out infinite", flexShrink: 0 }} />
          </IC>
        );
      })}
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────

function TopBar({ focusLabel, scopeLabel }: { focusLabel: string; scopeLabel: string }) {
  return (
    <div style={{ height: 38, flexShrink: 0, background: "#020203", borderBottom: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "center", padding: "0 14px 0 10px", position: "relative" }}>
      {/* Scope label — top-left */}
      <span style={{ fontFamily: FONT, fontSize: 12, color: `${GREEN}99`, letterSpacing: ".05em", opacity: 0.6 }}>
        System Scope: {scopeLabel}
      </span>
      {/* School / location name — absolute center */}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
        <span style={{ fontFamily: NUMFONT, fontSize: 19, fontWeight: 700, color: "#fff", letterSpacing: ".06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          {focusLabel}
        </span>
      </div>
      <div style={{ flex: 1 }} />
      {/* Settings button */}
      <button style={{ background: "none", border: "1px solid rgba(255,255,255,.08)", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,.3)", fontSize: 13 }}
        title="Settings">⚙</button>
    </div>
  );
}

/** BrainOrb health ring outline — viewBox 0 0 100 100 */
const BRAIN_HEART_D =
  "M 50 88" +
  " C 30 80 12 62 12 44" +
  " C 12 28 26 16 40 22" +
  " C 46 24 49 30 50 36" +
  " C 51 30 54 24 60 22" +
  " C 74 16 88 28 88 44" +
  " C 88 62 70 80 50 88" +
  " Z";

function BrainOrb({ flash, healthScore, onClick }: { flash: boolean; healthScore: number; onClick: () => void }) {
  const hRaw = Math.min(100, Math.max(0, healthScore));
  const h = Math.round(hRaw);
  /** Same stroke-dash math as `DonutChart` circles: dash = (pct/100)*perimeter, gap = full perimeter. */
  const len = 100;
  const dash = (hRaw / 100) * len;
  /** Heart path starts at the tip; rotate 180° so the stroke origin reads like 12 o’clock (same idea as `rotate(-90)` on circles). */
  const hx = 50;
  const hy = 52;
  const gradId = useId().replace(/:/g, "_");
  const cLo = healthStrokeColor(Math.max(0, h - 38));
  const cHi = healthStrokeColor(h);

  return (
    <button
      onClick={onClick}
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none", zIndex: 35, position: "relative" }}
      aria-label="Z-IQ Command Center"
    >
      <div style={{ position: "relative", width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0,  borderRadius: "50%", border: "1.5px solid rgba(153,0,255,.2)", animation: "ringA 22s linear infinite" }} />
        <div style={{ position: "absolute", inset: 12, borderRadius: "50%", border: "1px solid rgba(255,0,204,.12)",  animation: "ringB 16s linear infinite" }} />
        <div style={{ position: "absolute", inset: 26, borderRadius: "50%", border: "1px solid rgba(180,255,0,.08)", animation: "ringA 34s linear infinite" }} />
        <div style={{
          position: "absolute", width: 120, height: 120, borderRadius: "50%",
          background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,.22) 0%, ${healthGlowRgba(h, 0.22)} 20%, rgba(6,6,10,.96) 58%, rgba(14,10,12,.92) 100%)`,
          boxShadow: `inset 0 -6px 18px rgba(180,255,0,.08), inset 2px 4px 14px rgba(255,255,255,.08), 0 0 36px ${healthGlowRgba(h, 0.35)}`,
          animation: "breathe 4.5s ease-in-out infinite",
        }} />
        <svg width={100} height={100} viewBox="0 0 100 100" style={{ position: "absolute", zIndex: 1, overflow: "visible" }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={cLo} />
              <stop offset="100%" stopColor={cHi} />
            </linearGradient>
          </defs>
          <g transform={`rotate(180 ${hx} ${hy})`}>
            <path
              d={BRAIN_HEART_D}
              fill="none"
              stroke="rgba(255,255,255,.08)"
              strokeWidth={8}
              pathLength={len}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={BRAIN_HEART_D}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={8}
              pathLength={len}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${len}`}
              strokeDashoffset={0}
              style={{ filter: `drop-shadow(0 0 8px ${healthGlowRgba(h, 0.55)})`, transition: "stroke-dasharray 1s ease" }}
            />
          </g>
          <text x={50} y={46} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={17} fontWeight={600} fontFamily={NUMFONT}>{h}%</text>
          <text x={50} y={58} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,.32)" fontSize={8} fontFamily={FONT}>health</text>
        </svg>
        {flash && (
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", zIndex: 3, background: "radial-gradient(circle, rgba(255,255,255,.5) 0%, rgba(180,255,0,.18) 50%, transparent 70%)", animation: "flashIn .35s ease-out forwards", pointerEvents: "none" }} />
        )}
      </div>
    </button>
  );
}

// ── SVG circuit traces — chamfered bends + curved diagonals (PCB-ish) ────────
// Lines run from the orb surface to the connector dot on each box edge.

function StaticCircuitSVG({ w, h, onNavigate }: { w: number; h: number; onNavigate: (href: string) => void }) {
  if (!w || !h) return null;

  const cx = w * 0.5;
  const cy = h * 0.5;
  const ORB_R      = 62;
  const BOX_HALF_W = 145;
  const BOX_HALF_H = 120;

  const traceStroke = {
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}
      width={w} height={h}
    >
      {MODULE_DEFS.map(mod => {
        const tx = w * (mod.leftPct / 100);
        const ty = h * (mod.topPct  / 100);

        const dx = tx - cx, dy = ty - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ex = cx + (dx / dist) * ORB_R;
        const ey = cy + (dy / dist) * ORB_R;

        let ftx = tx, fty = ty;
        switch (mod.dotEdge) {
          case "bottom": fty = ty + BOX_HALF_H; break;
          case "top":    fty = ty - BOX_HALF_H; break;
          case "left":   ftx = tx - BOX_HALF_W; break;
          case "right":  ftx = tx + BOX_HALF_W; break;
        }

        let d: string;
        let bendX = 0, bendY = 0, hasBend = true;

        if (mod.pathStyle === "S") {
          const curved = circuitPathCurved(ex, ey, ftx, fty, mod.id);
          d = curved.d;
          bendX = curved.jx;
          bendY = curved.jy;
          hasBend = true;
        } else if (mod.pathStyle === "H") {
          const p = circuitPathHFirst(ex, ey, ftx, fty);
          d = p.d;
          bendX = p.jx;
          bendY = p.jy;
        } else {
          const p = circuitPathVFirst(ex, ey, ftx, fty);
          d = p.d;
          bendX = p.jx;
          bendY = p.jy;
        }

        const href = MODULE_WIRE_HREFS[mod.id];

        return (
          <g key={mod.id}>
            <path d={d} fill="none" stroke={mod.color} strokeWidth={3} strokeOpacity={0.06} {...traceStroke} />
            <path d={d} fill="none" stroke={mod.color} strokeWidth={1} strokeOpacity={0.42}
              style={{ filter: `drop-shadow(0 0 3px ${mod.color}60)` }}
              {...traceStroke}
            />
            <circle cx={px(ex)} cy={px(ey)} r={2.5} fill={mod.color} fillOpacity={0.7} />
            {hasBend && (
              <rect x={px(bendX - 2)} y={px(bendY - 2)} width={4} height={4} fill={mod.color} fillOpacity={0.45} transform={`rotate(45 ${px(bendX)} ${px(bendY)})`} />
            )}
            <circle cx={px(ftx)} cy={px(fty)} r={3} fill={mod.color} fillOpacity={0.6}
              style={{ filter: `drop-shadow(0 0 4px ${mod.color})` }} />
            {/* Invisible wide hit path for click */}
            {href && (
              <path d={d} fill="none" stroke="transparent" strokeWidth={22}
                pointerEvents="stroke" style={{ cursor: "pointer" }}
                {...traceStroke}
                onClick={() => onNavigate(href)} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Connector dot — sits on box edge facing the orb ───────────────────────────

function connectorStyle(dotEdge: ModDef["dotEdge"], color: string): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute", width: 8, height: 8, borderRadius: "50%", zIndex: 10,
    background: color,
    boxShadow: `0 0 10px ${color}, 0 0 20px ${color}60`,
    border: "1.5px solid rgba(255,255,255,0.3)",
  };
  switch (dotEdge) {
    case "bottom": return { ...base, bottom: -4, left: "50%",  transform: "translateX(-50%)" };
    case "top":    return { ...base, top:    -4, left: "50%",  transform: "translateX(-50%)" };
    case "left":   return { ...base, left:   -4, top:  "50%",  transform: "translateY(-50%)" };
    case "right":  return { ...base, right:  -4, top:  "50%",  transform: "translateY(-50%)" };
  }
}

// ── ModuleBox — center-anchored percentage positioning ────────────────────────
// Float keyframes bake in translate(-50%,-50%) — do NOT remove from keyframes.

function ModuleBox({ mod, data, locId }: {
  mod: ModDef;
  data: AllData | null;
  locId: string | null;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const idx = MODULE_DEFS.indexOf(mod);
  const href = MODULE_WIRE_HREFS[mod.id];

  function renderContent() {
    if (!data) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[60, 40, 40].map((hh, i) => (
          <div key={i} style={{ height: hh, borderRadius: 8, background: "rgba(255,255,255,.04)", animation: "dotBlink 1.8s ease-in-out infinite" }} />
        ))}
      </div>
    );
    switch (mod.id) {
      case "schedule":  return <ScheduleContent   data={data} locId={locId} />;
      case "families":  return <FamiliesContent   data={data} locId={locId} />;
      case "invoices":  return <InvoicesContent   data={data} locId={locId} />;
      case "lifecycle": return <LifeCycleContent  data={data} />;
      case "ai-agents": return <AIAgentsContent   data={data} />;
      case "finance":   return <FinancialsContent data={data} locId={locId} />;
      case "payroll":   return <PayrollContent    data={data} locId={locId} />;
      case "teachers":  return <TeachersContent   data={data} locId={locId} />;
      default: return null;
    }
  }

  return (
    <div
      role={href ? "button" : undefined}
      tabIndex={href ? 0 : undefined}
      aria-label={href ? `Open ${mod.label}` : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => href && router.push(href)}
      onKeyDown={(e) => { if (href && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); router.push(href); } }}
      style={{
        position: "absolute",
        left: `${mod.leftPct}%`,
        top:  `${mod.topPct}%`,
        transform: "translate(-50%, -50%)",
        width: 290,
        animation: `${mod.float} ${3.5 + idx * 0.28}s ease-in-out infinite`,
        zIndex: 30,
        cursor: href ? "pointer" : "default",
      }}
    >
      {/* Edge connector dot */}
      <div style={connectorStyle(mod.dotEdge, mod.color)} />

      <div style={{
        background: "linear-gradient(135deg, rgba(22,22,22,.96) 0%, rgba(6,6,6,.99) 100%)",
        backdropFilter: "blur(14px)",
        border: `1px solid ${hovered ? mod.color + "30" : "rgba(255,255,255,.07)"}`,
        borderRadius: 12,
        boxShadow: hovered
          ? `0 0 50px ${mod.color}22, 0 20px 56px rgba(0,0,0,.85), inset 0 1px 0 rgba(255,255,255,.07)`
          : `0 0 28px ${mod.color}10, 0 12px 36px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.04)`,
        transition: "all 240ms ease",
        overflow: "hidden",
      }}>
        {/* Accent bar */}
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${mod.color}70, ${mod.color2 ?? mod.color}45, transparent)` }} />

        {/* Header */}
        <div style={{ padding: "8px 12px 7px", display: "flex", alignItems: "flex-start", gap: 9 }}>
          <span style={{ fontFamily: NUMFONT, fontSize: 17, fontWeight: 600, color: mod.color, lineHeight: 1, flexShrink: 0, textShadow: `0 0 12px ${mod.color}88`, letterSpacing: "-.01em", fontVariantNumeric: "tabular-nums" }}>{mod.num}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#eeeef8", letterSpacing: ".06em", textTransform: "uppercase", lineHeight: 1.1 }}>{mod.label}</div>
            <div style={{ fontFamily: FONT, fontSize: 7.5, color: "rgba(255,255,255,.3)", letterSpacing: ".03em", marginTop: 3 }}>{mod.sub}</div>
          </div>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: mod.color, boxShadow: `0 0 7px ${mod.color}`, animation: "dotBlink 2.4s ease-in-out infinite", flexShrink: 0, marginTop: 2 }} />
        </div>

        {/* Rule */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${mod.color}18, transparent)` }} />

        {/* Body */}
        <div style={{ padding: "8px 10px" }}>{renderContent()}</div>

        {/* Footer */}
        <div style={{ padding: "5px 10px", borderTop: "1px solid rgba(255,255,255,.04)", display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["◆", "▲", "◉"].map(ic => <span key={ic} style={{ fontFamily: FONT, fontSize: 7, color: "rgba(255,255,255,.12)" }}>{ic}</span>)}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: GREEN, boxShadow: `0 0 5px ${GREEN}`, animation: "dotBlink 3s ease-in-out infinite" }} />
            <span style={{ fontFamily: FONT, fontSize: 7, color: "rgba(255,255,255,.18)", letterSpacing: ".1em" }}>System Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FinancialOverview panel ───────────────────────────────────────────────────

function FinancialOverview({ data }: { data: AllData | null }) {
  const m = data?.metrics;

  const stats: { label: string; value: string; color: string; sub?: string }[] = [
    { label: "Revenue MTD",  value: m ? fmt$(m.collectedCents)       : "—", color: GREEN, sub: "collected this month" },
    { label: "Outstanding",  value: m ? fmt$(m.outstandingCents)      : "—", color: AMBER, sub: "awaiting payment" },
    { label: "Overdue",      value: m ? String(m.overdueCount)        : "—", color: RED,   sub: "past due accounts" },
    { label: "Projected",    value: m ? fmt$(m.projectedMonthlyCents) : "—", color: BLUE,  sub: "end-of-month forecast" },
    { label: "Teacher Comp", value: data ? `${data.teachers.length} staff` : "—", color: TEAL, sub: "active instructors" },
  ];

  return (
    <div style={{
      width: 160, flexShrink: 0,
      display: "flex", flexDirection: "column",
      alignItems: "stretch", justifyContent: "center",
      padding: "16px 10px",
      position: "relative", zIndex: 10,
      background: "transparent",
    }}>
      <div style={{
        background: "linear-gradient(135deg, rgba(24,24,24,.94) 0%, rgba(7,7,7,.99) 100%)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,.05)",
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(0,255,150,.05), inset 0 1px 0 rgba(255,255,255,.05)",
        padding: 24,
        display: "flex", flexDirection: "column", gap: 16,
        overflow: "hidden",
      }}>
        {/* Accent bar */}
        <div style={{ height: 2, margin: "-24px -24px 0", background: `linear-gradient(90deg, transparent, ${GREEN}50, ${BLUE}30, transparent)` }} />

        {/* Title */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontFamily: FONT, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#a0aab5", textTransform: "uppercase", lineHeight: 1.3 }}>
            Financial<br />Overview
          </div>
          <div style={{ width: 24, height: 1, background: `${GREEN}40`, marginTop: 6 }} />
        </div>

        {/* Stats */}
        {stats.map(stat => (
          <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ fontFamily: FONT, fontSize: "0.6rem", fontWeight: 600, letterSpacing: "1px", color: "#a0aab5", textTransform: "uppercase" }}>{stat.label}</div>
            <div style={{ fontFamily: NUMFONT, fontSize: "1.15rem", fontWeight: 600, color: stat.color, lineHeight: 1, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", textShadow: `0 0 18px ${stat.color}60` }}>{stat.value}</div>
            {stat.sub && <div style={{ fontFamily: FONT, fontSize: "0.58rem", color: "rgba(255,255,255,.2)", letterSpacing: ".04em" }}>{stat.sub}</div>}
          </div>
        ))}

        {/* Status footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
          {([["SYNC", GREEN], ["AI OPS", PURPLE], ["API", BLUE]] as [string, string][]).map(([l, c]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}`, animation: "dotBlink 2.4s ease-in-out infinite", flexShrink: 0 }} />
              <span style={{ fontFamily: FONT, fontSize: "0.58rem", color: c + "80", letterSpacing: ".1em", textTransform: "uppercase" }}>{l} Online</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function DashboardClient() {
  const router = useRouter();
  const { selectedLocId, headerFocusLabel } = useZiroWorkspace();

  const [brainFlash, setBrainFlash] = useState(false);
  const [data, setData]             = useState<AllData | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setCanvasSize({ w: width, h: height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    async function load() {
      const locQs = selectedLocId ? `?locationId=${encodeURIComponent(selectedLocId)}` : "";
      const [mRes, tRes, lRes, sRes, fRes] = await Promise.all([
        fetch("/api/dashboard/metrics").then(r => r.ok ? r.json() : null),
        fetch("/api/dashboard/teacher-utilization").then(r => r.ok ? r.json() : null),
        fetch("/api/dashboard/location-revenue").then(r => r.ok ? r.json() : null),
        fetch(`/api/dashboard/schedule-overview${locQs}`).then(r => r.ok ? r.json() : null),
        fetch(`/api/dashboard/families-overview${locQs}`).then(r => r.ok ? r.json() : null),
      ]);
      if (mRes && tRes && lRes) {
        setData({
          metrics: mRes,
          teachers: tRes.teachers ?? [],
          locationRevenue: lRes.locations ?? [],
          schedule: sRes ?? null,
          families: fRes ?? null,
        });
      }
    }
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [selectedLocId]);

  const handleOrbClick = () => {
    setBrainFlash(true);
    setTimeout(() => setBrainFlash(false), 480);
  };

  const healthScore = data ? computeHealthScore(data) : 72;

  return (
    <>
      <style>{CSS}</style>

      {/* Scanlines — inset from left so they do not cover `AppLocationRail` */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          left: WORKSPACE_LOCATION_RAIL_PX,
          pointerEvents: "none",
          zIndex: 9999,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,.08) 3px, rgba(0,0,0,.08) 4px)",
        }}
      />

      {/* Full-screen canvas — inset from left so `AppLocationRail` stays visible */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          left: WORKSPACE_LOCATION_RAIL_PX,
          zIndex: 100,
          ...DASHBOARD_SHELL_BACKDROP,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: FONT,
        }}
      >
        <TopBar focusLabel={headerFocusLabel} scopeLabel={selectedLocId ? headerFocusLabel : "All Locations"} />

        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

          {/* Canvas */}
          <div ref={canvasRef} style={{ flex: 1, position: "relative", overflow: "hidden", minWidth: 0, isolation: "isolate" }}>

            {/* Circuit SVG — z-index 1, pointer-events:none on root */}
            <StaticCircuitSVG w={canvasSize.w} h={canvasSize.h} onNavigate={(href) => router.push(href)} />

            {/* Central orb — z-index 35 */}
            <div style={{
              position: "absolute",
              left: "50%", top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 35,
            }}>
              <BrainOrb flash={brainFlash} healthScore={healthScore} onClick={handleOrbClick} />
            </div>

            {/* 8 orbiting boxes — z-index 30 */}
            {MODULE_DEFS.map(mod => (
              <ModuleBox key={mod.id} mod={mod} data={data} locId={selectedLocId} />
            ))}
          </div>

          {/* Financial Overview panel */}
          <FinancialOverview data={data} />
        </div>
      </div>
    </>
  );
}
