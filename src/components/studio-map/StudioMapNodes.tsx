"use client";

import * as React from "react";
import Link from "next/link";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { Loader2 } from "lucide-react";

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

function orbBase(className?: string) {
  return cn(
    "relative flex flex-col items-center justify-center rounded-full border text-center shadow-sm transition-[transform,box-shadow,border-color] duration-[var(--z-duration-medium)] [transition-timing-function:var(--z-ease-spring)]",
    className,
  );
}

export function CompanyOrbNode({ data }: NodeProps) {
  const d = data as CompanyNodeData;
  return (
    <>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-[var(--z-accent-color)]" />
      <div
        className={orbBase(
          "h-[7.5rem] w-[7.5rem] border-[color-mix(in_oklab,var(--z-accent-color),transparent_40%)] bg-[color-mix(in_oklab,var(--z-surface),var(--z-accent-color)_10%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent-color),transparent_72%),0_0_48px_color-mix(in_oklab,var(--z-accent-color),transparent_88%)]",
        )}
      >
        <span className="max-w-[6.5rem] px-1 text-center text-[0.7rem] font-extrabold uppercase leading-tight tracking-[0.14em] text-[var(--z-accent-color)] sm:text-xs">
          {d.label}
        </span>
        {d.subtitle ? (
          <span className="mt-1 max-w-[7rem] px-1 text-[0.6rem] font-medium leading-tight text-[var(--z-muted)]">
            {d.subtitle}
          </span>
        ) : null}
      </div>
    </>
  );
}

export function LocationOrbNode({ data }: NodeProps) {
  const d = data as LocationNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-[var(--z-muted)]" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-[var(--z-accent-color)]" />
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            d.onToggle();
          }}
          className={cn(
            orbBase(
              "h-24 w-24 border-[var(--z-border)] bg-[var(--z-surface-2)] hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)] hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent-color),transparent_65%),0_0_28px_color-mix(in_oklab,var(--z-accent-color),transparent_85%)]",
            ),
            focusRingClassName(),
          )}
        >
          {d.loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-[var(--z-accent-color)]" aria-hidden />
          ) : (
            <span className="max-w-[5.5rem] px-1 text-[0.65rem] font-bold leading-tight text-[var(--z-fg)]">
              {d.label}
            </span>
          )}
        </button>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[0.6rem] text-[var(--z-muted)]">
          <span>{d.expanded ? "Expanded" : "Tap to expand"}</span>
          {typeof d.teacherCount === "number" && d.expanded ? (
            <span className="text-[var(--z-fg)]">{d.teacherCount} teachers</span>
          ) : null}
        </div>
        <Link
          href={d.href}
          onClick={(e) => e.stopPropagation()}
          className="text-[0.6rem] font-medium text-[var(--z-accent-color)] underline-offset-2 hover:underline"
        >
          Open schedule
        </Link>
      </div>
    </>
  );
}

export function TeacherFlowOrbNode({ data }: NodeProps) {
  const d = data as TeacherFlowNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-[var(--z-muted)]" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-[var(--z-accent-color)]" />
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            d.onToggle();
          }}
          className={cn(
            "group flex max-w-[10rem] flex-col items-center gap-1 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-center hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)]",
            focusRingClassName(),
          )}
        >
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border text-xs font-bold tracking-tight",
              "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-accent-color)]",
              "transition-[transform,box-shadow] duration-[var(--z-duration-medium)] [transition-timing-function:var(--z-ease-spring)]",
              "group-hover:scale-[1.06] group-hover:shadow-[0_0_22px_color-mix(in_oklab,var(--z-accent-color),transparent_82%)]",
            )}
            aria-hidden
          >
            {d.loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              d.initials || "?"
            )}
          </span>
          <span className="line-clamp-2 text-[0.65rem] font-semibold leading-tight text-[var(--z-fg)]">
            {d.label}
          </span>
          <span className="text-[0.6rem] font-medium uppercase tracking-[0.1em] text-[var(--z-muted)]">
            {d.studentCount} students · {d.openSlotCount} open slots
          </span>
        </button>
        <Link
          href={d.href}
          onClick={(e) => e.stopPropagation()}
          className="text-[0.6rem] font-medium text-[var(--z-accent-color)] underline-offset-2 hover:underline"
        >
          Teacher profile
        </Link>
      </div>
    </>
  );
}

export function StudentMiniNode({ data }: NodeProps) {
  const d = data as StudentFlowNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-0 !bg-[var(--z-muted)]" />
      <Link
        href={d.href}
        className={cn(
          "flex min-w-[4.5rem] max-w-[6.5rem] flex-col items-center gap-1 rounded-[var(--z-radius-md)] border px-2 py-1.5 text-center",
          "transition-[transform,opacity,box-shadow] duration-[var(--z-duration-medium)] [transition-timing-function:var(--z-ease-smooth)]",
          focusRingClassName(),
          d.active
            ? "border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)] bg-[color-mix(in_oklab,var(--z-surface),var(--z-accent-color)_6%)] shadow-[0_0_18px_color-mix(in_oklab,var(--z-accent-color),transparent_88%)]"
            : "border-[var(--z-border)] bg-[var(--z-surface-2)] opacity-75 hover:opacity-100",
          "hover:-translate-y-0.5",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border text-[0.6rem] font-bold",
            d.active
              ? "border-[color-mix(in_oklab,var(--z-accent-color),transparent_35%)] text-[var(--z-accent-color)]"
              : "border-[var(--z-border)] text-[var(--z-muted)]",
          )}
        >
          {d.initials}
        </span>
        <span className="line-clamp-2 text-[0.58rem] font-semibold leading-tight text-[var(--z-fg)]">
          {d.label}
        </span>
      </Link>
    </>
  );
}

export function AgentsSatelliteNode({ data }: NodeProps) {
  const d = data as AgentsNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-[var(--z-muted)]" />
      <Link
        href={d.href}
        className={cn(
          orbBase(
            "h-16 w-16 border-dashed border-[color-mix(in_oklab,var(--z-accent-color),transparent_55%)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_20%)] hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_25%)]",
          ),
          focusRingClassName(),
        )}
      >
        <span className="text-[0.55rem] font-extrabold uppercase tracking-[0.12em] text-[var(--z-accent-color)]">
          Agents
        </span>
        <span className="mt-0.5 text-[0.55rem] text-[var(--z-muted)]">Automations</span>
      </Link>
    </>
  );
}
