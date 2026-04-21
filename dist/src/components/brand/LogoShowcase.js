import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/components/ui/utils";
const frame = {
    light: "bg-[color-mix(in_oklab,white_94%,var(--z-bg)_6%)]",
    dark: "bg-[var(--z-surface-2)]",
    mono: "bg-[var(--z-bg)]",
};
const ziroFill = {
    light: "var(--z-bg)",
    dark: "var(--z-fg)",
    mono: "var(--z-fg)",
};
const workFill = {
    light: "color-mix(in oklab, var(--z-accent), black 18%)",
    dark: "var(--z-accent)",
    mono: "color-mix(in oklab, var(--z-fg), transparent 40%)",
};
/**
 * SVG-forward logo tile for press and brand surfaces (placeholder mark, neon signal).
 */
export function LogoShowcase({ variant, className }) {
    return (_jsxs("div", { className: cn("relative flex aspect-[5/3] w-full items-center justify-center overflow-hidden rounded-[var(--z-radius-lg)] border border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_88%)]", frame[variant], className), children: [_jsx("div", { "aria-hidden": "true", className: "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,color-mix(in_oklab,var(--z-accent),transparent_78%),transparent_55%)] opacity-70" }), _jsxs("svg", { viewBox: "0 0 200 80", className: "relative z-[1] h-[42%] w-[72%]", role: "img", "aria-label": "ZiroWork wordmark placeholder", children: [_jsx("rect", { x: "8", y: "18", width: "44", height: "44", rx: "10", className: "fill-none stroke-[var(--z-accent)]", strokeWidth: "3" }), _jsx("path", { d: "M22 52 L38 28", className: "stroke-[var(--z-accent)]", strokeWidth: "3", strokeLinecap: "round" }), _jsxs("text", { x: "64", y: "52", fontSize: "11", fontWeight: "800", letterSpacing: "0.18em", children: [_jsx("tspan", { fill: ziroFill[variant], children: "ZIRO" }), _jsx("tspan", { fill: workFill[variant], children: "WORK" })] })] })] }));
}
