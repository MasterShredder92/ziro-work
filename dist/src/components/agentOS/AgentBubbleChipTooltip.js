"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/components/ui/utils";
/**
 * Hover/focus tooltip for bubble chips. Renders below the trigger to stay inside
 * the bubble’s overflow without clipping, and does not affect flex wrap (absolute layer).
 */
export function AgentBubbleChipTooltip({ explanation, children, className, }) {
    return (_jsxs("span", { className: cn("group/chip relative inline-flex max-w-full align-top", className), children: [children, _jsxs("span", { role: "tooltip", className: cn("pointer-events-none absolute left-1/2 top-full z-[70] mt-1.5 w-max max-w-[min(260px,calc(100vw-40px))] -translate-x-1/2", "whitespace-normal rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1.5 text-left text-[10px] leading-snug text-[var(--z-fg)] shadow-md", "opacity-0 transition-opacity duration-150", "group-hover/chip:opacity-100 group-focus-within/chip:opacity-100"), children: [_jsx("span", { className: "block font-semibold text-[var(--z-muted)]", children: "Why this skill?" }), _jsx("span", { className: "block text-[var(--z-fg)]", children: explanation })] })] }));
}
