"use client";

import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { useAgentOS, type AgentCorner } from "./AgentOSContext";
import { AgentAvatarImage } from "./AgentAvatarImage";
import { useIsMobile } from "./useMediaQuery";

const SIZE_DESKTOP = 56;
const SIZE_MOBILE = 48;
const CORNER_MARGIN = 18;

function cornerPosition(corner: AgentCorner): React.CSSProperties {
  switch (corner) {
    case "tl":
      return { top: CORNER_MARGIN, left: CORNER_MARGIN };
    case "tr":
      return { top: CORNER_MARGIN, right: CORNER_MARGIN };
    case "bl":
      return { bottom: CORNER_MARGIN, left: CORNER_MARGIN };
    case "br":
    default:
      return { bottom: CORNER_MARGIN, right: CORNER_MARGIN };
  }
}

function cornerFromPoint(x: number, y: number, width: number, height: number): AgentCorner {
  const left = x < width / 2;
  const top = y < height / 2;
  if (top && left) return "tl";
  if (top && !left) return "tr";
  if (!top && left) return "bl";
  return "br";
}

export function AgentAvatarButton() {
  const {
    meta,
    state,
    agentId,
    bubbleOpen,
    toggleBubble,
    corner,
    setCorner,
    pointer,
  } = useAgentOS();
  const isMobile = useIsMobile();
  const size = isMobile ? SIZE_MOBILE : SIZE_DESKTOP;

  const [drag, setDrag] = React.useState<{
    active: boolean;
    dx: number;
    dy: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const [tipVisible, setTipVisible] = React.useState(false);

  // Hide the avatar entirely when the bubble is open on mobile (bubble becomes full modal).
  // On desktop, the avatar stays visible and the bubble anchors to it.
  // The pointer mode uses a different mini-head (AgentPointer), so hide the main avatar.
  const hidden = pointer !== null || (bubbleOpen && isMobile);

  const pointerDownRef = React.useRef<{ x: number; y: number; time: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isMobile) return;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    pointerDownRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    setDrag({
      active: true,
      dx: 0,
      dy: 0,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag || !drag.active) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const moved = drag.moved || Math.hypot(dx, dy) > 4;
    setDrag({ ...drag, dx, dy, moved });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const target = e.currentTarget;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    if (drag.moved) {
      // Snap to nearest corner based on drop position.
      const w = window.innerWidth;
      const h = window.innerHeight;
      const nextCorner = cornerFromPoint(e.clientX, e.clientY, w, h);
      setCorner(nextCorner);
    } else {
      // Treat as click.
      toggleBubble();
    }
    setDrag(null);
  };

  const style: React.CSSProperties = {
    position: "fixed",
    ...cornerPosition(corner),
    width: size,
    height: size,
    zIndex: 60,
    "--z-agent-accent": meta.accent,
    "--z-agent-glow": meta.glow,
    transform: drag?.moved ? `translate(${drag.dx}px, ${drag.dy}px)` : undefined,
    transition: drag?.moved ? "none" : undefined,
    touchAction: isMobile ? "manipulation" : "none",
    opacity: hidden ? 0 : 1,
    pointerEvents: hidden ? "none" : "auto",
  } as React.CSSProperties;

  const label = `Talk to ${meta.displayName}`;

  return (
    <div
      className="pointer-events-none"
      data-agent-os-avatar=""
      style={{ position: "fixed", inset: 0, zIndex: 60 }}
      aria-hidden={hidden ? "true" : undefined}
    >
      <button
        type="button"
        aria-label={label}
        data-state={state}
        data-agent-id={agentId}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
        onClick={isMobile ? toggleBubble : undefined}
        onMouseEnter={() => setTipVisible(true)}
        onMouseLeave={() => setTipVisible(false)}
        onFocus={() => setTipVisible(true)}
        onBlur={() => setTipVisible(false)}
        className={cn(
          "z-agent-avatar pointer-events-auto overflow-visible",
          focusRingClassName(),
        )}
        style={style}
      >
        <div
          className="absolute inset-0 overflow-hidden rounded-full border"
          style={{
            borderColor: "color-mix(in oklab, var(--z-agent-accent), transparent 40%)",
          }}
        >
          <AgentAvatarImage
            src={meta.imagePath}
            name={meta.displayName}
            accent={meta.accent}
            className="h-full w-full"
          />
        </div>

        {state === "thinking" ? (
          <div className="z-agent-thinking-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        ) : null}

        {tipVisible && !drag?.moved && !bubbleOpen ? (
          <span
            role="tooltip"
            className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--z-fg)] shadow-lg"
          >
            {label}
          </span>
        ) : null}
      </button>
    </div>
  );
}
