"use client";
import * as React from "react";
import Link from "next/link";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { Loader2 } from "lucide-react";

// ── Location color palette (matches roster/invoices) ─────────────────────────
export const LOCATION_COLORS: Record<string, { color: string; glow: string; label: string }> = {
  "f7b52dd5-12ee-437f-9c60-f8adf454ac31": { color: "#7C3AED", glow: "rgba(124,58,237,0.45)", label: "Bellevue" },
  "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": { color: "#16A34A", glow: "rgba(22,163,74,0.45)",  label: "Gretna"   },
  "cebd97d4-c241-4de2-8ade-49e5cc0070d5": { color: "#0EA5E9", glow: "rgba(14,165,233,0.45)", label: "Elkhorn"  },
  "d48229c1-b70a-4d29-893e-5079887dab76": { color: "#DC2626", glow: "rgba(220,38,38,0.45)",  label: "Omaha"    },
};
const DEFAULT_LOC = { color: "#6366f1", glow: "rgba(99,102,241,0.45)", label: "Location" };

function getLocColor(id: string) {
  return LOCATION_COLORS[id] ?? DEFAULT_LOC;
}

// ── Shared orb shell ──────────────────────────────────────────────────────────
function Orb({
  size,
  color,
  glow,
  children,
  className,
  style,
}: {
  size: number;
  color: string;
  glow: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const glowSize = Math.round(size * 0.6);
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-full border-2 text-center select-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderColor: `${color}66`,
        background: `radial-gradient(circle at 38% 32%, ${color}22 0%, #0d0d1a 70%)`,
        boxShadow: `0 0 0 1px ${color}33, 0 0 ${glowSize}px ${glow}, inset 0 1px 0 ${color}22`,
        ...style,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[3px] rounded-full"
        style={{ background: `radial-gradient(circle at 30% 25%, ${color}18 0%, transparent 60%)` }}
      />
      {children}
    </div>
  );
}

// ── Node type definitions ─────────────────────────────────────────────────────
export type CompanyNodeData = {
  label: string;
  subtitle?: string;
};
export type LocationNodeData = {
  label: string;
  locationId: string;
  expanded: boolean;
  loading: boolean;
  teacherCount?: number;
  href: string;
  onToggle: () => void;
};
export type TeacherFlowNodeData = {
  label: string;
  initials: string;
  teacherId: string;
  locationId: string;
  expanded: boolean;
  loading: boolean;
  studentCount: number;
  openSlotCount: number;
  href: string;
  onToggle: () => void;
};
export type StudentFlowNodeData = {
  studentId: string;
  label: string;
  initials: string;
  active: boolean;
  href: string;
};
export type AgentsNodeData = {
  href: string;
};

// ── Company orb (center / owner) ──────────────────────────────────────────────
export function CompanyOrbNode({ data }: NodeProps) {
  const d = data as CompanyNodeData;
  const color = "#f59e0b";
  const glow  = "rgba(245,158,11,0.5)";
  return (
    <>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Orb size={130} color={color} glow={glow}>
        <span
          className="px-2 text-center text-[0.65rem] font-black uppercase leading-tight tracking-[0.16em]"
          style={{ color }}
        >
          {d.label}
        </span>
        {d.subtitle ? (
          <span className="mt-1 px-2 text-[0.55rem] font-medium leading-tight text-white/50">
            {d.subtitle}
          </span>
        ) : null}
      </Orb>
    </>
  );
}

// ── Location orb ──────────────────────────────────────────────────────────────
export function LocationOrbNode({ data }: NodeProps) {
  const d = data as LocationNodeData;
  const { color, glow } = getLocColor(d.locationId);
  const activeGlow = d.expanded ? glow : glow.replace("0.45", "0.25");
  const activeStyle: React.CSSProperties | undefined = d.expanded
    ? { boxShadow: `0 0 0 3px ${color}44, 0 0 60px ${glow}, inset 0 1px 0 ${color}22` }
    : undefined;

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); d.onToggle(); }}
          className={cn(
            "group transition-transform duration-200 hover:scale-105 active:scale-95",
            focusRingClassName(),
          )}
          style={{ borderRadius: "50%" }}
        >
          <Orb size={100} color={color} glow={activeGlow} style={activeStyle}>
            {d.loading ? (
              <Loader2 className="h-5 w-5 animate-spin" style={{ color }} />
            ) : (
              <>
                <span className="px-2 text-[0.62rem] font-bold leading-tight text-white/90">
                  {d.label}
                </span>
                {typeof d.teacherCount === "number" && d.expanded ? (
                  <span className="mt-0.5 text-[0.52rem] font-semibold" style={{ color }}>
                    {d.teacherCount} teachers
                  </span>
                ) : (
                  <span className="mt-0.5 text-[0.5rem] font-medium text-white/40">
                    {d.expanded ? "expanded" : "tap to expand"}
                  </span>
                )}
              </>
            )}
          </Orb>
        </button>
        <Link
          href={d.href}
          onClick={(e) => e.stopPropagation()}
          className="text-[0.58rem] font-semibold underline-offset-2 hover:underline"
          style={{ color }}
        >
          Schedule
        </Link>
      </div>
    </>
  );
}

// ── Teacher orb ───────────────────────────────────────────────────────────────
export function TeacherFlowOrbNode({ data }: NodeProps) {
  const d = data as TeacherFlowNodeData;
  const { color, glow } = getLocColor(d.locationId);
  const teacherGlow = glow.replace("0.45", "0.30");

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); d.onToggle(); }}
          className={cn(
            "group transition-transform duration-200 hover:scale-105 active:scale-95",
            focusRingClassName(),
          )}
          style={{ borderRadius: "50%" }}
        >
          <Orb size={76} color={color} glow={teacherGlow}>
            {d.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" style={{ color }} />
            ) : (
              <>
                <span className="text-sm font-black leading-none" style={{ color }}>
                  {d.initials || "?"}
                </span>
                <span className="mt-0.5 px-1 text-[0.5rem] font-medium leading-tight text-white/60 line-clamp-1 max-w-[4rem]">
                  {d.label.split(" ")[0]}
                </span>
              </>
            )}
          </Orb>
        </button>
        <div className="text-center">
          <p className="text-[0.55rem] font-semibold text-white/70 max-w-[5rem] line-clamp-1">
            {d.label}
          </p>
          <p className="text-[0.5rem] text-white/40">
            {d.studentCount} students
            {d.openSlotCount > 0 ? ` · ${d.openSlotCount} open` : ""}
          </p>
        </div>
      </div>
    </>
  );
}

// ── Student mini orb ──────────────────────────────────────────────────────────
export function StudentMiniNode({ data }: NodeProps) {
  const d = data as StudentFlowNodeData;
  const color = d.active ? "#34d399" : "#6b7280";
  const glow  = d.active ? "rgba(52,211,153,0.35)" : "rgba(107,114,128,0.2)";

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Link
        href={d.href}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "group flex flex-col items-center gap-1 transition-transform duration-150 hover:scale-110",
          focusRingClassName(),
        )}
        style={{ borderRadius: "50%" }}
      >
        <Orb
          size={52}
          color={color}
          glow={glow}
          className={cn(!d.active && "opacity-50 hover:opacity-80")}
        >
          <span className="text-[0.55rem] font-black leading-none" style={{ color }}>
            {d.initials}
          </span>
        </Orb>
        <span className="max-w-[4.5rem] text-center text-[0.5rem] font-medium leading-tight text-white/60 line-clamp-2">
          {d.label}
        </span>
      </Link>
    </>
  );
}

// ── Agents satellite orb ──────────────────────────────────────────────────────
export function AgentsSatelliteNode({ data }: NodeProps) {
  const d = data as AgentsNodeData;
  const color = "#a78bfa";
  const glow  = "rgba(167,139,250,0.4)";

  return (
    <>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Link
        href={d.href}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "group transition-transform duration-200 hover:scale-110",
          focusRingClassName(),
        )}
        style={{ borderRadius: "50%" }}
      >
        <Orb size={64} color={color} glow={glow}>
          <span className="text-[0.52rem] font-black uppercase tracking-[0.1em]" style={{ color }}>
            Agents
          </span>
          <span className="mt-0.5 text-[0.48rem] text-white/40">7 active</span>
        </Orb>
      </Link>
    </>
  );
}
