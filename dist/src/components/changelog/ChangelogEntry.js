"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils/cn";
export function ChangelogEntry({ version, date, items, className }) {
    return (_jsxs(Card, { variant: "elevated", padding: "lg", radius: "lg", shadow: "sm", className: cn("border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_78%),0_0_28px_color-mix(in_oklab,var(--z-accent),transparent_88%)]", className), children: [_jsx("div", { className: "flex flex-wrap items-center justify-between gap-[var(--z-space-3)]", children: _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(Badge, { variant: "success", active: true, children: version }), _jsx("span", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: date })] }) }), _jsx("ul", { className: "mt-[var(--z-space-5)] space-y-[var(--z-space-3)] text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]", children: items.map((item, idx) => (_jsxs("li", { className: "flex gap-[var(--z-space-3)]", children: [_jsx("span", { className: "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--z-accent)] shadow-[0_0_10px_color-mix(in_oklab,var(--z-accent),transparent_55%)]", "aria-hidden": true }), _jsx("span", { children: item })] }, `${idx}-${item}`))) })] }));
}
