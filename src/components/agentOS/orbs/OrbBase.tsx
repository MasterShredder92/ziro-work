"use client";

import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";

export type OrbSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<OrbSize, number> = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 56,
  xl: 72,
};

export type OrbBaseProps = {
  size?: OrbSize;
  accent?: string;
  glow?: string;
  label?: string;
  active?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  draggable?: boolean;
  children?: React.ReactNode;
  className?: string;
  showRing?: boolean;
  style?: React.CSSProperties;
  as?: "button" | "div";
};

export function OrbBase({
  size = "md",
  accent,
  glow,
  label,
  active,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  draggable,
  children,
  className,
  showRing,
  style,
  as,
}: OrbBaseProps) {
  const pixels = SIZE_PX[size];
  const Tag = as ?? (onClick ? "button" : "div");

  const agentStyle: React.CSSProperties = {
    width: pixels,
    height: pixels,
    ...(accent ? ({ "--z-agent-accent": accent } as React.CSSProperties) : {}),
    ...(glow ? ({ "--z-agent-glow": glow } as React.CSSProperties) : {}),
    ...style,
  };

  const content = (
    <>
      {showRing ? <span aria-hidden="true" className="z-orb-ring" /> : null}
      {children}
    </>
  );

  if (Tag === "button") {
    return (
      <button
        type="button"
        aria-label={label}
        data-active={active ? "true" : undefined}
        onClick={onClick}
        className={cn("z-orb", focusRingClassName(), className)}
        style={agentStyle}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      aria-label={label}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      data-active={active ? "true" : undefined}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn("z-orb", onClick ? focusRingClassName() : undefined, className)}
      style={agentStyle}
    >
      {content}
    </div>
  );
}
