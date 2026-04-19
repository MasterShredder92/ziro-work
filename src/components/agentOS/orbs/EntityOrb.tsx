"use client";

import * as React from "react";
import { OrbBase, type OrbSize } from "./OrbBase";

export type EntityKind = "student" | "family" | "teacher";

type Props = {
  kind: EntityKind;
  id: string;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  /** Dragging to another orb fires onDropOn in that orb. */
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  active?: boolean;
  className?: string;
};

const KIND_SIZE: Record<EntityKind, OrbSize> = {
  family: "sm",
  student: "md",
  teacher: "lg",
};

const KIND_ACCENT: Record<EntityKind, string> = {
  family: "#facc15",
  student: "#00ff88",
  teacher: "#a78bfa",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (a + b).toUpperCase();
}

/**
 * Entity orb — a round affordance for a teacher/student/family. Drag + drop
 * support allows "reassign" gestures (e.g. student → teacher). The consumer
 * wires onDrop semantics.
 */
export function EntityOrb({
  kind,
  id,
  label,
  sublabel,
  onClick,
  draggable = true,
  onDragStart,
  onDragOver,
  onDrop,
  active,
  className,
}: Props) {
  const accent = KIND_ACCENT[kind];
  const glow = `color-mix(in oklab, ${accent}, transparent 60%)`;
  const size = KIND_SIZE[kind];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("application/x-ziro-orb", JSON.stringify({ kind, id }));
    e.dataTransfer.effectAllowed = "move";
    onDragStart?.(e);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes("application/x-ziro-orb")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
    onDragOver?.(e);
  };

  return (
    <OrbBase
      as="div"
      size={size}
      accent={accent}
      glow={glow}
      label={sublabel ? `${label} — ${sublabel}` : label}
      active={active}
      onClick={onClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={onDrop}
      className={className}
    >
      <span
        className="select-none text-[11px] font-extrabold uppercase tracking-[0.08em]"
        style={{ color: accent }}
      >
        {initials(label)}
      </span>
    </OrbBase>
  );
}
