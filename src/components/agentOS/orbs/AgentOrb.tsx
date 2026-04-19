"use client";

import * as React from "react";
import { getAgentMetadata } from "@/lib/agents/agentMetadata";
import { OrbBase, type OrbSize } from "./OrbBase";
import { AgentAvatarImage } from "../AgentAvatarImage";
import { useOptionalAgentOS } from "../AgentOSContext";

type Props = {
  agentId: string;
  size?: OrbSize;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  showRing?: boolean;
};

/**
 * Agent orb — larger, neon-ringed, floats. Clicking opens the AgentBubble for
 * that agent. Falls back to a plain orb if mounted outside AgentOSProvider.
 */
export function AgentOrb({ agentId, size = "xl", onClick, active, className, showRing = true }: Props) {
  const ctx = useOptionalAgentOS();
  const meta = getAgentMetadata(agentId);

  const accent = meta?.accent ?? "var(--z-accent)";
  const glow = meta?.glow ?? "color-mix(in oklab, var(--z-accent), transparent 55%)";

  const handleClick = React.useCallback(() => {
    if (onClick) {
      onClick();
      return;
    }
    if (ctx) {
      ctx.setAgentId(agentId);
      ctx.openBubble();
    }
  }, [onClick, ctx, agentId]);

  return (
    <OrbBase
      size={size}
      accent={accent}
      glow={glow}
      label={meta ? `${meta.displayName} · ${meta.tagline}` : agentId}
      active={active ?? ctx?.agentId === agentId}
      onClick={handleClick}
      showRing={showRing}
      className={`z-orb--agent ${className ?? ""}`}
    >
      <div className="h-full w-full overflow-hidden rounded-full">
        <AgentAvatarImage
          src={meta?.imagePath ?? `/static/agents/${agentId}.png`}
          name={meta?.displayName ?? agentId}
          accent={accent}
          className="h-full w-full"
        />
      </div>
    </OrbBase>
  );
}
