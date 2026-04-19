"use client";

import * as React from "react";
import { useAgentOS } from "./AgentOSContext";
import { AgentAvatarImage } from "./AgentAvatarImage";
import { getAgentMetadata } from "@/lib/agents/agentMetadata";

type Rect = { x: number; y: number; w: number; h: number };

const MINI_SIZE = 44;
const GAP = 12;

function rectFromSelector(selector: string): Rect | null {
  if (typeof document === "undefined") return null;
  try {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = (el as HTMLElement).getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  } catch {
    return null;
  }
}

/** Place the mini-agent head near the target without overflowing the viewport. */
function placementFor(rect: Rect): { x: number; y: number; anchor: "left" | "right" | "top" | "bottom" } {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;

  // Prefer placing to the right of the target.
  if (rect.x + rect.w + GAP + MINI_SIZE < vw) {
    return {
      x: rect.x + rect.w + GAP,
      y: Math.max(8, Math.min(vh - MINI_SIZE - 8, rect.y + rect.h / 2 - MINI_SIZE / 2)),
      anchor: "left",
    };
  }
  if (rect.x - GAP - MINI_SIZE > 0) {
    return {
      x: rect.x - GAP - MINI_SIZE,
      y: Math.max(8, Math.min(vh - MINI_SIZE - 8, rect.y + rect.h / 2 - MINI_SIZE / 2)),
      anchor: "right",
    };
  }
  if (rect.y - GAP - MINI_SIZE > 0) {
    return {
      x: Math.max(8, Math.min(vw - MINI_SIZE - 8, rect.x + rect.w / 2 - MINI_SIZE / 2)),
      y: rect.y - GAP - MINI_SIZE,
      anchor: "bottom",
    };
  }
  return {
    x: Math.max(8, Math.min(vw - MINI_SIZE - 8, rect.x + rect.w / 2 - MINI_SIZE / 2)),
    y: rect.y + rect.h + GAP,
    anchor: "top",
  };
}

export function AgentPointer() {
  const { pointer, hidePointer, agentId } = useAgentOS();
  const [rect, setRect] = React.useState<Rect | null>(null);

  const targetId = pointer?.agentId ?? agentId;
  const meta = getAgentMetadata(targetId);

  // Resolve target rect + reflow on resize/scroll.
  React.useEffect(() => {
    if (!pointer) {
      setRect(null);
      return;
    }

    const compute = () => {
      let next: Rect | null = null;
      if (pointer.rect) next = pointer.rect;
      else if (pointer.selector) next = rectFromSelector(pointer.selector);
      setRect(next);
    };

    compute();

    const onResize = () => compute();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    const interval = window.setInterval(compute, 500);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.clearInterval(interval);
    };
  }, [pointer]);

  // Click-outside to dismiss.
  React.useEffect(() => {
    if (!pointer) return;
    const handler = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.closest("[data-agent-os-pointer]")) return;
      if (pointer.selector && el.closest(pointer.selector)) {
        // Completing the action dismisses the pointer.
        hidePointer();
        return;
      }
      hidePointer();
    };
    // Defer to next tick so the triggering click doesn't immediately dismiss.
    const t = window.setTimeout(() => {
      window.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("mousedown", handler);
    };
  }, [pointer, hidePointer]);

  if (!pointer || !rect || !meta) return null;

  const place = placementFor(rect);

  // Line endpoints (from pointer head center to target rect edge nearest to head).
  const headCenter = { x: place.x + MINI_SIZE / 2, y: place.y + MINI_SIZE / 2 };
  const targetCenter = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };

  // Constrain target endpoint to the rect edge closest to the head.
  const tx = clamp(headCenter.x, rect.x, rect.x + rect.w);
  const ty = clamp(headCenter.y, rect.y, rect.y + rect.h);

  return (
    <div
      data-agent-os-pointer=""
      className="pointer-events-none fixed inset-0 z-[70]"
      aria-live="polite"
    >
      {/* Dim overlay with a cutout (radial) over the target */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${targetCenter.x}px ${targetCenter.y}px, transparent ${Math.max(rect.w, rect.h) / 2 + 20}px, rgba(0,0,0,0.45) ${Math.max(rect.w, rect.h) / 2 + 120}px)`,
        }}
      />

      {/* Highlight border around the target */}
      <div
        className="absolute rounded-[var(--z-radius-md)] border"
        style={{
          left: rect.x - 4,
          top: rect.y - 4,
          width: rect.w + 8,
          height: rect.h + 8,
          borderColor: "color-mix(in oklab, var(--z-agent-accent, var(--z-accent)), transparent 25%)",
          boxShadow:
            "0 0 0 2px color-mix(in oklab, var(--z-agent-accent, var(--z-accent)), transparent 55%), 0 0 32px color-mix(in oklab, var(--z-agent-accent, var(--z-accent)), transparent 55%)",
          // @ts-expect-error CSS custom prop
          "--z-agent-accent": meta.accent,
        }}
      />

      {/* SVG line agent → target */}
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ overflow: "visible" }}
        aria-hidden="true"
      >
        <line
          className="z-agent-pointer__line"
          x1={headCenter.x}
          y1={headCenter.y}
          x2={tx}
          y2={ty}
          stroke={meta.accent}
          strokeLinecap="round"
          strokeDasharray="4 5"
        />
      </svg>

      {/* Mini agent head */}
      <div
        className="z-agent-pointer pointer-events-auto absolute"
        style={{
          left: place.x,
          top: place.y,
          width: MINI_SIZE,
          height: MINI_SIZE,
          // @ts-expect-error custom prop
          "--z-agent-accent": meta.accent,
          "--z-agent-glow": meta.glow,
        }}
      >
        <div className="z-agent-pointer__head h-full w-full">
          <div
            className="h-full w-full overflow-hidden rounded-full border shadow-[0_0_0_1px_var(--z-agent-accent),0_0_22px_var(--z-agent-glow)]"
            style={{ borderColor: "color-mix(in oklab, var(--z-agent-accent), transparent 28%)" }}
          >
            <AgentAvatarImage src={meta.imagePath} name={meta.displayName} accent={meta.accent} className="h-full w-full" />
          </div>
        </div>
      </div>

      {/* Tooltip label — placed near the target, always visible */}
      <div
        className="pointer-events-auto absolute max-w-[240px] rounded-[var(--z-radius-md)] border px-3 py-1.5 text-xs font-semibold shadow-lg"
        style={{
          left: clamp(rect.x + rect.w / 2 - 110, 8, (typeof window !== "undefined" ? window.innerWidth : 1000) - 228),
          top: rect.y + rect.h + 10,
          background: "var(--z-surface)",
          borderColor: "color-mix(in oklab, " + meta.accent + ", transparent 45%)",
          color: "var(--z-fg)",
        }}
      >
        <span style={{ color: meta.accent }} className="mr-1 font-extrabold uppercase tracking-[0.12em]">
          {meta.displayName}:
        </span>
        {pointer.label}
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
