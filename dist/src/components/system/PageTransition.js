"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/components/ui/utils";
/**
 * Entry motion for routed surfaces: fade + slight upward slide.
 * Uses tokens from src/styles/animations.css (--z-duration-medium, --z-ease-smooth).
 */
export function PageTransition({ children, className }) {
    return _jsx("div", { className: cn("z-page-transition", className), children: children });
}
