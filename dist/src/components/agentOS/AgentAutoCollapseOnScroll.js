"use client";
import * as React from "react";
import { useAgentOS } from "./AgentOSContext";
import { useIsMobile } from "./useMediaQuery";
/**
 * Mobile rule: auto-collapse the bubble on scroll so it never blocks content.
 * Desktop is unaffected.
 */
export function AgentAutoCollapseOnScroll() {
    const { bubbleOpen, closeBubble } = useAgentOS();
    const isMobile = useIsMobile();
    React.useEffect(() => {
        if (!isMobile || !bubbleOpen)
            return;
        let last = window.scrollY;
        const onScroll = () => {
            if (Math.abs(window.scrollY - last) > 32) {
                closeBubble();
            }
            last = window.scrollY;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [bubbleOpen, isMobile, closeBubble]);
    return null;
}
