"use client";

/**
 * Pixel-identical clone of `src/app/(app)/dashboard/_client.tsx` orbit shell:
 * same rail inset, backdrop, scanlines, CSS keyframes, circuit SVG math,
 * BrainOrb rings replaced by `FamilyNameOrb` (family label, larger diameter);
 * Module labels/subs match the family workspace; tile bodies use the same loading
 * skeleton as dashboard `data === null`. Clicks open the family full-page overlay tab.
 */

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { FamilyWorkspaceTab } from "./_content";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

const GREEN = "#b4ff00";
const PURPLE = "#9900ff";
const PINK = "#ff00cc";
const BLUE = "#22d3ee";
const AMBER = "#f59e0b";
const RED = "#ef4444";
const TEAL = "#00e5cc";
const FONT = "'Inter', system-ui, sans-serif";
const NUMFONT = "'Plus Jakarta Sans', system-ui, sans-serif";

const WORKSPACE_LOCATION_RAIL_PX = 88;

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

interface ModDef {
  id: string;
  tab: FamilyWorkspaceTab;
  label: string;
  num: string;
  sub: string;
  color: string;
  color2?: string;
  float: string;
  leftPct: number;
  topPct: number;
  pathStyle: "H" | "V" | "S";
  dotEdge: "top" | "bottom" | "left" | "right";
}

/** Same geometry + animation keys as dashboard `MODULE_DEFS`; labels/subs only renamed for family. */
const FAMILY_MODULE_DEFS: ModDef[] = [
  { id: "ov", tab: "overview", label: "Overview", num: "01", sub: "Students & account", color: BLUE, color2: "#0ea5e9", float: "float0", leftPct: 50, topPct: 19, pathStyle: "S", dotEdge: "bottom" },
  { id: "th", tab: "teachers", label: "Teachers", num: "02", sub: "Meet the team", color: GREEN, color2: "#22c55e", float: "float1", leftPct: 84, topPct: 18, pathStyle: "H", dotEdge: "left" },
  { id: "bi", tab: "billing", label: "Billing", num: "03", sub: "Plans & ledger", color: AMBER, color2: "#ef4444", float: "float2", leftPct: 85, topPct: 50, pathStyle: "S", dotEdge: "left" },
  { id: "dc", tab: "documents", label: "Documents", num: "04", sub: "Files & uploads", color: PURPLE, color2: PINK, float: "float3", leftPct: 84, topPct: 82, pathStyle: "H", dotEdge: "left" },
  { id: "nt", tab: "notes", label: "Notes", num: "05", sub: "Internal log", color: RED, color2: PINK, float: "float4", leftPct: 50, topPct: 84, pathStyle: "S", dotEdge: "top" },
  { id: "tl", tab: "timeline", label: "Timeline", num: "06", sub: "Activity stream", color: GREEN, color2: "#22c55e", float: "float5", leftPct: 16, topPct: 82, pathStyle: "H", dotEdge: "right" },
  { id: "hb", tab: "overview", label: "Household", num: "07", sub: "Contact & settings", color: PINK, color2: PURPLE, float: "float6", leftPct: 15, topPct: 50, pathStyle: "S", dotEdge: "right" },
  { id: "rs", tab: "overview", label: "Roster", num: "08", sub: "Students at a glance", color: TEAL, color2: BLUE, float: "float7", leftPct: 16, topPct: 18, pathStyle: "H", dotEdge: "right" },
];

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

function px(n: number) {
  return Math.round(n * 10) / 10;
}

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function circuitChamferSize(legA: number, legB: number) {
  const m = Math.min(Math.abs(legA), Math.abs(legB));
  if (m < 2) return 0;
  return Math.min(22, Math.max(9, m * 0.11));
}

function circuitPathHFirst(ex: number, ey: number, ftx: number, fty: number) {
  const legH = ftx - ex;
  const legV = fty - ey;
  let c = circuitChamferSize(legH, legV);
  c = Math.min(c, Math.abs(legH) * 0.48, Math.abs(legV) * 0.48);
  const sx = legH >= 0 ? 1 : -1;
  const sy = legV >= 0 ? 1 : -1;
  if (c < 5) {
    return { d: `M ${px(ex)} ${px(ey)} L ${px(ftx)} ${px(ey)} L ${px(ftx)} ${px(fty)}`, jx: ftx, jy: ey };
  }
  const jx = ftx - sx * c * 0.55;
  const jy = ey + sy * c * 0.55;
  return {
    d: `M ${px(ex)} ${px(ey)} L ${px(ftx - sx * c)} ${px(ey)} L ${px(ftx)} ${px(ey + sy * c)} L ${px(ftx)} ${px(fty)}`,
    jx,
    jy,
  };
}

function circuitPathVFirst(ex: number, ey: number, ftx: number, fty: number) {
  const legV = fty - ey;
  const legH = ftx - ex;
  let c = circuitChamferSize(legH, legV);
  c = Math.min(c, Math.abs(legH) * 0.48, Math.abs(legV) * 0.48);
  const sx = legH >= 0 ? 1 : -1;
  const sy = legV >= 0 ? 1 : -1;
  if (c < 5) {
    return { d: `M ${px(ex)} ${px(ey)} L ${px(ex)} ${px(fty)} L ${px(ftx)} ${px(fty)}`, jx: ex, jy: fty };
  }
  const jx = ex + sx * c * 0.55;
  const jy = fty - sy * c * 0.55;
  return {
    d: `M ${px(ex)} ${px(ey)} L ${px(ex)} ${px(fty - sy * c)} L ${px(ex + sx * c)} ${px(fty)} L ${px(ftx)} ${px(fty)}`,
    jx,
    jy,
  };
}

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
  return { d: `M ${px(ex)} ${px(ey)} C ${px(c1x)} ${px(c1y)} ${px(c2x)} ${px(c2y)} ${px(ftx)} ${px(fty)}`, jx: mx, jy: my };
}

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

function healthGlowRgba(score: number, a: number): string {
  const { r, g, b } = healthStrokeRgb(score);
  return `rgba(${r},${g},${b},${a})`;
}

/** Wire endpoint distance from canvas center (px). Match visual orb radius so traces meet the sphere. */
const FAMILY_ORB_WIRE_ATTACH_R = 90;
const FAMILY_ORB_OUTER = 280;
const FAMILY_ORB_INNER = 176;

function FamilyNameOrb({
  familyName,
  healthScore,
  flash,
  onClick,
}: {
  familyName: string;
  healthScore: number;
  flash: boolean;
  onClick: () => void;
}) {
  const h = Math.min(100, Math.max(0, Math.round(healthScore)));

  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        userSelect: "none",
        zIndex: 35,
        position: "relative",
      }}
      aria-label={`Family hub: ${familyName}`}
    >
      <div
        style={{
          position: "relative",
          width: FAMILY_ORB_OUTER,
          height: FAMILY_ORB_OUTER,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid rgba(153,0,255,.2)", animation: "ringA 22s linear infinite" }} />
        <div style={{ position: "absolute", inset: 16, borderRadius: "50%", border: "1px solid rgba(255,0,204,.12)", animation: "ringB 16s linear infinite" }} />
        <div style={{ position: "absolute", inset: 36, borderRadius: "50%", border: "1px solid rgba(180,255,0,.08)", animation: "ringA 34s linear infinite" }} />
        <div
          style={{
            position: "absolute",
            width: FAMILY_ORB_INNER,
            height: FAMILY_ORB_INNER,
            borderRadius: "50%",
            background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,.22) 0%, ${healthGlowRgba(h, 0.22)} 20%, rgba(6,6,10,.96) 58%, rgba(14,10,12,.92) 100%)`,
            boxShadow: `inset 0 -6px 18px rgba(180,255,0,.08), inset 2px 4px 14px rgba(255,255,255,.08), 0 0 36px ${healthGlowRgba(h, 0.35)}`,
            animation: "breathe 4.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: FAMILY_ORB_INNER - 24,
            padding: "0 14px",
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: "clamp(15px, 1.85vw, 24px)",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            color: "#fff",
            textWrap: "balance" as const,
            textShadow: "0 0 28px rgba(180,255,0,0.25), 0 2px 12px rgba(0,0,0,0.85)",
          }}
        >
          {familyName}
        </div>
        {flash && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              zIndex: 3,
              background: "radial-gradient(circle, rgba(255,255,255,.5) 0%, rgba(180,255,0,.18) 50%, transparent 70%)",
              animation: "flashIn .35s ease-out forwards",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </button>
  );
}

function StaticCircuitSVG({
  w,
  h,
  orbAttachRadius,
  getCanvasRect,
  onWireClick,
}: {
  w: number;
  h: number;
  orbAttachRadius: number;
  getCanvasRect: () => DOMRect | null;
  onWireClick: (mod: ModDef, approxRect: DOMRect) => void;
}) {
  if (!w || !h) return null;

  const cx = w * 0.5;
  const cy = h * 0.5;
  const ORB_R = orbAttachRadius;
  const BOX_HALF_W = 145;
  const BOX_HALF_H = 120;

  const traceStroke = {
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }} width={w} height={h}>
      {FAMILY_MODULE_DEFS.map((mod) => {
        const tx = w * (mod.leftPct / 100);
        const ty = h * (mod.topPct / 100);

        const dx = tx - cx,
          dy = ty - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ex = cx + (dx / dist) * ORB_R;
        const ey = cy + (dy / dist) * ORB_R;

        let ftx = tx,
          fty = ty;
        switch (mod.dotEdge) {
          case "bottom":
            fty = ty + BOX_HALF_H;
            break;
          case "top":
            fty = ty - BOX_HALF_H;
            break;
          case "left":
            ftx = tx - BOX_HALF_W;
            break;
          case "right":
            ftx = tx + BOX_HALF_W;
            break;
        }

        let d: string;
        let bendX = 0,
          bendY = 0,
          hasBend = true;

        if (mod.pathStyle === "S") {
          const curved = circuitPathCurved(ex, ey, ftx, fty, mod.id);
          d = curved.d;
          bendX = curved.jx;
          bendY = curved.jy;
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

        return (
          <g key={mod.id}>
            <path d={d} fill="none" stroke={mod.color} strokeWidth={3} strokeOpacity={0.06} {...traceStroke} />
            <path
              d={d}
              fill="none"
              stroke={mod.color}
              strokeWidth={1}
              strokeOpacity={0.42}
              style={{ filter: `drop-shadow(0 0 3px ${mod.color}60)` }}
              {...traceStroke}
            />
            <circle cx={px(ex)} cy={px(ey)} r={2.5} fill={mod.color} fillOpacity={0.7} />
            {hasBend && (
              <rect
                x={px(bendX - 2)}
                y={px(bendY - 2)}
                width={4}
                height={4}
                fill={mod.color}
                fillOpacity={0.45}
                transform={`rotate(45 ${px(bendX)} ${px(bendY)})`}
              />
            )}
            <circle cx={px(ftx)} cy={px(fty)} r={3} fill={mod.color} fillOpacity={0.6} style={{ filter: `drop-shadow(0 0 4px ${mod.color})` }} />
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={22}
              pointerEvents="stroke"
              style={{ cursor: "pointer" }}
              {...traceStroke}
              onClick={() => {
                const c = getCanvasRect();
                if (!c) {
                  onWireClick(mod, new DOMRect());
                  return;
                }
                const tx = c.left + c.width * (mod.leftPct / 100);
                const ty = c.top + c.height * (mod.topPct / 100);
                onWireClick(mod, new DOMRect(tx - 145, ty - 60, 290, 120));
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}

function connectorStyle(dotEdge: ModDef["dotEdge"], color: string): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: "50%",
    zIndex: 10,
    background: color,
    boxShadow: `0 0 10px ${color}, 0 0 20px ${color}60`,
    border: "1.5px solid rgba(255,255,255,0.3)",
  };
  switch (dotEdge) {
    case "bottom":
      return { ...base, bottom: -4, left: "50%", transform: "translateX(-50%)" };
    case "top":
      return { ...base, top: -4, left: "50%", transform: "translateX(-50%)" };
    case "left":
      return { ...base, left: -4, top: "50%", transform: "translateY(-50%)" };
    case "right":
      return { ...base, right: -4, top: "50%", transform: "translateY(-50%)" };
  }
}

function ModuleSkeletonBody() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[60, 40, 40].map((hh, i) => (
        <div key={i} style={{ height: hh, borderRadius: 8, background: "rgba(255,255,255,.04)", animation: "dotBlink 1.8s ease-in-out infinite" }} />
      ))}
    </div>
  );
}

type FamilyTeacherRow = {
  id: string;
  full_name: string;
  teacher_role?: string;
  instruments?: string[] | null;
  teaches_students?: string[];
};

function formatInstrumentLine(t: FamilyTeacherRow): string {
  const raw = t.instruments?.filter((s): s is string => typeof s === "string" && s.trim().length > 0) ?? [];
  return raw.map((s) => s.trim().toUpperCase()).join(", ");
}

function formatStudentLine(t: FamilyTeacherRow): string {
  const raw = t.teaches_students?.filter((s) => s.trim().length > 0) ?? [];
  return raw.join(", ");
}

function TeachersTileBody({
  loading,
  teachers,
  accent,
}: {
  loading: boolean;
  teachers: FamilyTeacherRow[];
  accent: string;
}) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: 34,
              borderRadius: 8,
              background: "rgba(255,255,255,.04)",
              animation: "dotBlink 1.8s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }
  if (teachers.length === 0) {
    return (
      <div style={{ fontFamily: FONT, fontSize: 12, color: "rgba(255,255,255,.35)", padding: "6px 0", lineHeight: 1.4 }}>
        No teachers assigned yet
      </div>
    );
  }
  const show = teachers.slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {show.map((t) => {
        const inst = formatInstrumentLine(t);
        const studs = formatStudentLine(t);
        return (
          <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: accent,
                boxShadow: `0 0 8px ${accent}`,
                flexShrink: 0,
                marginTop: 5,
              }}
            />
            <div style={{ minWidth: 0, flex: 1, paddingRight: 4 }}>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#ececf4",
                  lineHeight: 1.25,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t.full_name}
              </div>
              {t.teacher_role ? (
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 10,
                    color: "rgba(255,255,255,.38)",
                    marginTop: 3,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t.teacher_role}
                </div>
              ) : null}
            </div>
            <div
              style={{
                flexShrink: 0,
                maxWidth: "46%",
                textAlign: "right",
                display: "flex",
                flexDirection: "column",
                gap: 3,
                alignItems: "flex-end",
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(255,255,255,.82)",
                  lineHeight: 1.25,
                  wordBreak: "break-word",
                }}
                title={inst || undefined}
              >
                {inst || "—"}
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 11,
                  fontWeight: 500,
                  color: "rgba(255,255,255,.52)",
                  lineHeight: 1.25,
                  wordBreak: "break-word",
                }}
                title={studs || undefined}
              >
                {studs || "—"}
              </div>
            </div>
          </div>
        );
      })}
      {teachers.length > 4 ? (
        <div style={{ fontFamily: FONT, fontSize: 10, color: "rgba(255,255,255,.28)", letterSpacing: ".04em" }}>+{teachers.length - 4} more</div>
      ) : null}
    </div>
  );
}

function ModuleBox({
  mod,
  activeTab,
  onActivate,
  teachersTile,
}: {
  mod: ModDef;
  activeTab: FamilyWorkspaceTab | null;
  onActivate: (tab: FamilyWorkspaceTab, rect: DOMRect) => void;
  teachersTile?: { loading: boolean; teachers: FamilyTeacherRow[] };
}) {
  const [hovered, setHovered] = useState(false);
  const idx = FAMILY_MODULE_DEFS.indexOf(mod);
  const isActive = activeTab === mod.tab;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${mod.label}`}
      aria-current={isActive ? "true" : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => onActivate(mod.tab, (e.currentTarget as HTMLElement).getBoundingClientRect())}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate(mod.tab, (e.currentTarget as HTMLElement).getBoundingClientRect());
        }
      }}
      style={{
        position: "absolute",
        left: `${mod.leftPct}%`,
        top: `${mod.topPct}%`,
        transform: "translate(-50%, -50%)",
        width: 290,
        animation: `${mod.float} ${3.5 + idx * 0.28}s ease-in-out infinite`,
        zIndex: 30,
        cursor: "pointer",
      }}
    >
      <div style={connectorStyle(mod.dotEdge, mod.color)} />

      <div
        style={{
          background: "linear-gradient(135deg, rgba(22,22,22,.96) 0%, rgba(6,6,6,.99) 100%)",
          backdropFilter: "blur(14px)",
          border: `1px solid ${hovered || isActive ? mod.color + "30" : "rgba(255,255,255,.07)"}`,
          borderRadius: 12,
          boxShadow:
            hovered || isActive
              ? `0 0 50px ${mod.color}22, 0 20px 56px rgba(0,0,0,.85), inset 0 1px 0 rgba(255,255,255,.07)`
              : `0 0 28px ${mod.color}10, 0 12px 36px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.04)`,
          transition: "all 240ms ease",
          overflow: "hidden",
        }}
      >
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${mod.color}70, ${mod.color2 ?? mod.color}45, transparent)` }} />

        <div style={{ padding: "8px 12px 7px", display: "flex", alignItems: "flex-start", gap: 9 }}>
          <span
            style={{
              fontFamily: NUMFONT,
              fontSize: 17,
              fontWeight: 600,
              color: mod.color,
              lineHeight: 1,
              flexShrink: 0,
              textShadow: `0 0 12px ${mod.color}88`,
              letterSpacing: "-.01em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {mod.num}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#eeeef8", letterSpacing: ".06em", textTransform: "uppercase", lineHeight: 1.1 }}>
              {mod.label}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 7.5, color: "rgba(255,255,255,.3)", letterSpacing: ".03em", marginTop: 3 }}>{mod.sub}</div>
          </div>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: mod.color,
              boxShadow: `0 0 7px ${mod.color}`,
              animation: "dotBlink 2.4s ease-in-out infinite",
              flexShrink: 0,
              marginTop: 2,
            }}
          />
        </div>

        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${mod.color}18, transparent)` }} />

        <div style={{ padding: "8px 10px" }}>
          {mod.tab === "teachers" && teachersTile ? (
            <TeachersTileBody loading={teachersTile.loading} teachers={teachersTile.teachers} accent={mod.color} />
          ) : (
            <ModuleSkeletonBody />
          )}
        </div>

        <div style={{ padding: "5px 10px", borderTop: "1px solid rgba(255,255,255,.04)", display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["◆", "▲", "◉"].map((ic) => (
              <span key={ic} style={{ fontFamily: FONT, fontSize: 7, color: "rgba(255,255,255,.12)" }}>
                {ic}
              </span>
            ))}
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

/** Same copy/layout as dashboard `FinancialOverview` when `data === null`. */
function FamilyFinancialOverviewPanel() {
  const stats: { label: string; value: string; color: string; sub?: string }[] = [
    { label: "Revenue MTD", value: "—", color: GREEN, sub: "collected this month" },
    { label: "Outstanding", value: "—", color: AMBER, sub: "awaiting payment" },
    { label: "Overdue", value: "—", color: RED, sub: "past due accounts" },
    { label: "Projected", value: "—", color: BLUE, sub: "end-of-month forecast" },
    { label: "Teacher Comp", value: "—", color: TEAL, sub: "active instructors" },
  ];

  return (
    <div style={{ width: 160, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "center", padding: "16px 10px", position: "relative", zIndex: 10, background: "transparent" }}>
      <div
        style={{
          background: "linear-gradient(135deg, rgba(24,24,24,.94) 0%, rgba(7,7,7,.99) 100%)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,.05)",
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,255,150,.05), inset 0 1px 0 rgba(255,255,255,.05)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflow: "hidden",
        }}
      >
        <div style={{ height: 2, margin: "-24px -24px 0", background: `linear-gradient(90deg, transparent, ${GREEN}50, ${BLUE}30, transparent)` }} />

        <div style={{ marginTop: 8 }}>
          <div style={{ fontFamily: FONT, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#a0aab5", textTransform: "uppercase", lineHeight: 1.3 }}>
            Financial
            <br />
            Overview
          </div>
          <div style={{ width: 24, height: 1, background: `${GREEN}40`, marginTop: 6 }} />
        </div>

        {stats.map((stat) => (
          <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ fontFamily: FONT, fontSize: "0.6rem", fontWeight: 600, letterSpacing: "1px", color: "#a0aab5", textTransform: "uppercase" }}>{stat.label}</div>
            <div
              style={{
                fontFamily: NUMFONT,
                fontSize: "1.15rem",
                fontWeight: 600,
                color: stat.color,
                lineHeight: 1,
                letterSpacing: "-0.01em",
                fontVariantNumeric: "tabular-nums",
                textShadow: `0 0 18px ${stat.color}60`,
                wordBreak: "break-word",
              }}
            >
              {stat.value}
            </div>
            {stat.sub && <div style={{ fontFamily: FONT, fontSize: "0.58rem", color: "rgba(255,255,255,.2)", letterSpacing: ".04em" }}>{stat.sub}</div>}
          </div>
        ))}

        <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
          {(
            [
              ["SYNC", GREEN],
              ["AI OPS", PURPLE],
              ["API", BLUE],
            ] as [string, string][]
          ).map(([l, c]) => (
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

function FamilyTopBar({ focusLabel }: { focusLabel: string }) {
  return (
    <div
      style={{
        height: 38,
        flexShrink: 0,
        background: "#020203",
        borderBottom: "1px solid rgba(255,255,255,.05)",
        display: "flex",
        alignItems: "center",
        padding: "0 14px 0 10px",
        position: "relative",
      }}
    >
      <span style={{ fontFamily: FONT, fontSize: 12, color: `${GREEN}99`, letterSpacing: ".05em", opacity: 0.6 }}>
        System Scope: Family account
      </span>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
        <span style={{ fontFamily: NUMFONT, fontSize: 19, fontWeight: 700, color: "#fff", letterSpacing: ".06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          {focusLabel}
        </span>
      </div>
      <div style={{ flex: 1 }} />
      <button
        type="button"
        style={{
          background: "none",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 6,
          width: 26,
          height: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "rgba(255,255,255,.3)",
          fontSize: 13,
        }}
        title="Settings"
      >
        ⚙
      </button>
    </div>
  );
}

function familyHealthFromBalance(balance: number): number {
  if (balance <= 0) return 88;
  if (balance < 200) return 72;
  if (balance < 800) return 54;
  return 38;
}

export function FamilyDashboardOrbit({
  familyId,
  focusLabel,
  familyOrbName,
  balance,
  activeTab,
  onOpenTab,
}: {
  familyId: string;
  focusLabel: string;
  /** Readable family name inside the center orb (not forced uppercase). */
  familyOrbName: string;
  balance: number;
  activeTab: FamilyWorkspaceTab | null;
  onOpenTab: (tab: FamilyWorkspaceTab, rect: DOMRect) => void;
}) {
  const [brainFlash, setBrainFlash] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [familyTeachers, setFamilyTeachers] = useState<FamilyTeacherRow[]>([]);
  const [familyTeachersLoading, setFamilyTeachersLoading] = useState(true);

  useEffect(() => {
    if (!familyId) return;
    let cancelled = false;
    async function loadTeachers() {
      setFamilyTeachersLoading(true);
      try {
        const res = await fetch(`/api/crm/families/${familyId}/teachers`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const list: FamilyTeacherRow[] = json.data ?? [];
        if (!cancelled) setFamilyTeachers(list);
      } catch {
        if (!cancelled) setFamilyTeachers([]);
      } finally {
        if (!cancelled) setFamilyTeachersLoading(false);
      }
    }
    loadTeachers();
    return () => {
      cancelled = true;
    };
  }, [familyId]);

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

  const healthScore = familyHealthFromBalance(balance);

  return (
    <>
      <style>{CSS}</style>

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          left: WORKSPACE_LOCATION_RAIL_PX,
          pointerEvents: "none",
          zIndex: 99,
          background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,.08) 3px, rgba(0,0,0,.08) 4px)",
        }}
      />

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
        <FamilyTopBar focusLabel={focusLabel} />

        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
          <div ref={canvasRef} style={{ flex: 1, position: "relative", overflow: "hidden", minWidth: 0, isolation: "isolate" }}>
            <StaticCircuitSVG
              w={canvasSize.w}
              h={canvasSize.h}
              orbAttachRadius={FAMILY_ORB_WIRE_ATTACH_R}
              getCanvasRect={() => canvasRef.current?.getBoundingClientRect() ?? null}
              onWireClick={(mod, r) => onOpenTab(mod.tab, r)}
            />

            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 35 }}>
              <FamilyNameOrb
                familyName={familyOrbName}
                flash={brainFlash}
                healthScore={healthScore}
                onClick={() => {
                  setBrainFlash(true);
                  setTimeout(() => setBrainFlash(false), 480);
                }}
              />
            </div>

            {FAMILY_MODULE_DEFS.map((mod) => (
              <ModuleBox
                key={mod.id}
                mod={mod}
                activeTab={activeTab}
                onActivate={onOpenTab}
                teachersTile={
                  mod.tab === "teachers" ? { loading: familyTeachersLoading, teachers: familyTeachers } : undefined
                }
              />
            ))}
          </div>

          <FamilyFinancialOverviewPanel />
        </div>
      </div>
    </>
  );
}
