"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { cn, focusRingClassName } from "@/components/ui/utils";
const SIZE_PX = {
    xs: 28,
    sm: 36,
    md: 48,
    lg: 56,
    xl: 72,
};
export function OrbBase({ size = "md", accent, glow, label, active, onClick, onDragStart, onDragOver, onDrop, draggable, children, className, showRing, style, as, }) {
    const pixels = SIZE_PX[size];
    const Tag = as !== null && as !== void 0 ? as : (onClick ? "button" : "div");
    const agentStyle = Object.assign(Object.assign(Object.assign({ width: pixels, height: pixels }, (accent ? { "--z-agent-accent": accent } : {})), (glow ? { "--z-agent-glow": glow } : {})), style);
    const content = (_jsxs(_Fragment, { children: [showRing ? _jsx("span", { "aria-hidden": "true", className: "z-orb-ring" }) : null, children] }));
    if (Tag === "button") {
        return (_jsx("button", { type: "button", "aria-label": label, "data-active": active ? "true" : undefined, onClick: onClick, className: cn("z-orb", focusRingClassName(), className), style: agentStyle, children: content }));
    }
    return (_jsx("div", { "aria-label": label, role: onClick ? "button" : undefined, tabIndex: onClick ? 0 : undefined, onClick: onClick, onKeyDown: (e) => {
            if (!onClick)
                return;
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
            }
        }, "data-active": active ? "true" : undefined, draggable: draggable, onDragStart: onDragStart, onDragOver: onDragOver, onDrop: onDrop, className: cn("z-orb", onClick ? focusRingClassName() : undefined, className), style: agentStyle, children: content }));
}
