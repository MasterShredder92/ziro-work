import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils";
export function ColorSwatch({ name, value, className }) {
    return (_jsxs(Card, { variant: "outline", padding: "none", radius: "md", className: cn("overflow-hidden border-[color-mix(in_oklab,var(--z-accent),transparent_42%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_90%)]", className), children: [_jsx("div", { className: "h-20 w-full", style: { background: value }, "aria-hidden": true }), _jsxs("div", { className: "space-y-1 border-t border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2", children: [_jsx("div", { className: "text-xs font-semibold text-[var(--z-fg)]", children: name }), _jsx("div", { className: "font-mono text-[11px] text-[var(--z-muted)]", children: value })] })] }));
}
