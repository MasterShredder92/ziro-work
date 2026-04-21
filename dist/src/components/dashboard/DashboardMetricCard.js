"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils";
export function DashboardMetricCard({ label, value, trend, icon, valueClassName }) {
    const positive = trend === "up";
    return (_jsx(Card, { padding: "md", radius: "md", variant: "default", className: cn("min-h-[5.25rem] min-w-[9rem] flex-shrink-0 sm:min-w-0 sm:flex-shrink border-[color-mix(in_oklab,var(--z-border),transparent_25%)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_40%)] transition-[box-shadow,border-color] duration-200", positive &&
            "border-[color-mix(in_oklab,var(--z-accent),transparent_48%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_55%)]"), children: _jsxs("div", { className: "flex items-start justify-between gap-[var(--z-space-3)]", children: [_jsxs("div", { className: "min-w-0 flex-1 space-y-1.5", children: [_jsx("p", { className: "text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--z-muted)]", children: label }), _jsx("p", { className: cn("truncate text-lg font-bold tracking-tight text-[var(--z-fg)] sm:text-xl", valueClassName), children: value })] }), icon ? (_jsx("div", { className: cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_oklab,var(--z-border),transparent_30%)] bg-[color-mix(in_oklab,var(--z-surface),transparent_20%)] text-[var(--z-muted)]", positive &&
                        "border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] text-[var(--z-accent)]"), children: icon })) : null] }) }));
}
