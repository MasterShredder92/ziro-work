"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { useAgentOS } from "./AgentOSContext";
import { AgentAvatarImage } from "./AgentAvatarImage";
import { useIsMobile } from "./useMediaQuery";
const SIZE_DESKTOP = 56;
const SIZE_MOBILE = 48;
const CORNER_MARGIN = 18;
function cornerPosition(corner) {
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
function cornerFromPoint(x, y, width, height) {
    const left = x < width / 2;
    const top = y < height / 2;
    if (top && left)
        return "tl";
    if (top && !left)
        return "tr";
    if (!top && left)
        return "bl";
    return "br";
}
export function AgentAvatarButton() {
    const { meta, state, agentId, bubbleOpen, toggleBubble, corner, setCorner, pointer, } = useAgentOS();
    const isMobile = useIsMobile();
    const size = isMobile ? SIZE_MOBILE : SIZE_DESKTOP;
    const [drag, setDrag] = React.useState(null);
    const [tipVisible, setTipVisible] = React.useState(false);
    // Hide the avatar entirely when the bubble is open on mobile (bubble becomes full modal).
    // On desktop, the avatar stays visible and the bubble anchors to it.
    // The pointer mode uses a different mini-head (AgentPointer), so hide the main avatar.
    const hidden = pointer !== null || (bubbleOpen && isMobile);
    const pointerDownRef = React.useRef(null);
    const onPointerDown = (e) => {
        if (isMobile)
            return;
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
    const onPointerMove = (e) => {
        if (!drag || !drag.active)
            return;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        const moved = drag.moved || Math.hypot(dx, dy) > 4;
        setDrag(Object.assign(Object.assign({}, drag), { dx, dy, moved }));
    };
    const onPointerUp = (e) => {
        if (!drag)
            return;
        const target = e.currentTarget;
        try {
            target.releasePointerCapture(e.pointerId);
        }
        catch (_a) {
            /* ignore */
        }
        if (drag.moved) {
            // Snap to nearest corner based on drop position.
            const w = window.innerWidth;
            const h = window.innerHeight;
            const nextCorner = cornerFromPoint(e.clientX, e.clientY, w, h);
            setCorner(nextCorner);
        }
        else {
            // Treat as click.
            toggleBubble();
        }
        setDrag(null);
    };
    const style = Object.assign(Object.assign({ position: "fixed" }, cornerPosition(corner)), { width: size, height: size, zIndex: 60, "--z-agent-accent": meta.accent, "--z-agent-glow": meta.glow, transform: (drag === null || drag === void 0 ? void 0 : drag.moved) ? `translate(${drag.dx}px, ${drag.dy}px)` : undefined, transition: (drag === null || drag === void 0 ? void 0 : drag.moved) ? "none" : undefined, touchAction: isMobile ? "manipulation" : "none", opacity: hidden ? 0 : 1, pointerEvents: hidden ? "none" : "auto" });
    const label = `Talk to ${meta.displayName}`;
    return (_jsx("div", { className: "pointer-events-none", "data-agent-os-avatar": "", style: { position: "fixed", inset: 0, zIndex: 60 }, "aria-hidden": hidden ? "true" : undefined, children: _jsxs("button", { type: "button", "aria-label": label, "data-state": state, "data-agent-id": agentId, onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onPointerCancel: () => setDrag(null), onClick: isMobile ? toggleBubble : undefined, onMouseEnter: () => setTipVisible(true), onMouseLeave: () => setTipVisible(false), onFocus: () => setTipVisible(true), onBlur: () => setTipVisible(false), className: cn("z-agent-avatar pointer-events-auto overflow-visible", focusRingClassName()), style: style, children: [_jsx("div", { className: "absolute inset-0 overflow-hidden rounded-full border", style: {
                        borderColor: "color-mix(in oklab, var(--z-agent-accent), transparent 40%)",
                    }, children: _jsx(AgentAvatarImage, { src: meta.imagePath, name: meta.displayName, accent: meta.accent, className: "h-full w-full" }) }), state === "thinking" ? (_jsxs("div", { className: "z-agent-thinking-dots", "aria-hidden": "true", children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {})] })) : null, tipVisible && !(drag === null || drag === void 0 ? void 0 : drag.moved) && !bubbleOpen ? (_jsx("span", { role: "tooltip", className: "pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--z-fg)] shadow-lg", children: label })) : null] }) }));
}
