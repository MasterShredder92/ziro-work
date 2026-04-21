import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils/cn";
const accentClass = {
    default: "text-[var(--z-fg)]",
    success: "text-emerald-400",
    warning: "text-amber-400",
    danger: "text-red-400",
};
const trendClass = {
    up: "text-emerald-400",
    down: "text-red-400",
    flat: "text-[var(--z-muted)]",
};
const trendGlyph = {
    up: "▲",
    down: "▼",
    flat: "■",
};
export function KpiCard({ label, value, sublabel, trend, trendLabel, accent = "default", icon, }) {
    return (_jsx(Card, { variant: "elevated", padding: "md", radius: "lg", children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "space-y-1.5 min-w-0", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: cn("text-2xl font-semibold tabular-nums truncate", accentClass[accent]), children: value }), sublabel ? (_jsx("div", { className: "text-xs text-[var(--z-muted)] truncate", children: sublabel })) : null, trend && trendLabel ? (_jsxs("div", { className: cn("text-xs font-medium", trendClass[trend]), children: [_jsx("span", { className: "mr-1", children: trendGlyph[trend] }), trendLabel] })) : null] }), icon ? (_jsx("div", { className: "shrink-0 text-[var(--z-muted)]", children: icon })) : null] }) }));
}
