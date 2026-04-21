"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { getAgentMetadata } from "@/lib/agents/agentMetadata";
import { OrbBase } from "./OrbBase";
import { AgentAvatarImage } from "../AgentAvatarImage";
import { useOptionalAgentOS } from "../AgentOSContext";
/**
 * Agent orb — larger, neon-ringed, floats. Clicking opens the AgentBubble for
 * that agent. Falls back to a plain orb if mounted outside AgentOSProvider.
 */
export function AgentOrb({ agentId, size = "xl", onClick, active, className, showRing = true }) {
    var _a, _b, _c, _d;
    const ctx = useOptionalAgentOS();
    const meta = getAgentMetadata(agentId);
    const accent = (_a = meta === null || meta === void 0 ? void 0 : meta.accent) !== null && _a !== void 0 ? _a : "var(--z-accent)";
    const glow = (_b = meta === null || meta === void 0 ? void 0 : meta.glow) !== null && _b !== void 0 ? _b : "color-mix(in oklab, var(--z-accent), transparent 55%)";
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
    return (_jsx(OrbBase, { size: size, accent: accent, glow: glow, label: meta ? `${meta.displayName} · ${meta.tagline}` : agentId, active: active !== null && active !== void 0 ? active : (ctx === null || ctx === void 0 ? void 0 : ctx.agentId) === agentId, onClick: handleClick, showRing: showRing, className: `z-orb--agent ${className !== null && className !== void 0 ? className : ""}`, children: _jsx("div", { className: "h-full w-full overflow-hidden rounded-full", children: _jsx(AgentAvatarImage, { src: (_c = meta === null || meta === void 0 ? void 0 : meta.imagePath) !== null && _c !== void 0 ? _c : `/static/agents/${agentId}.png`, name: (_d = meta === null || meta === void 0 ? void 0 : meta.displayName) !== null && _d !== void 0 ? _d : agentId, accent: accent, className: "h-full w-full" }) }) }));
}
