"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";
export function PlanSelector({ plans, selectedPlanId, onSelect, className }) {
    return (_jsx("div", { className: cn("grid grid-cols-1 gap-[var(--z-space-4)] md:grid-cols-2 xl:grid-cols-3", className), children: plans.map((p) => {
            const selected = p.id === selectedPlanId;
            return (_jsxs(Card, { variant: "elevated", padding: "lg", radius: "lg", shadow: "sm", className: cn("group z-card-interact flex h-full flex-col border-[var(--z-border)]", "hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)]", "hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent-color),transparent_72%),0_0_28px_color-mix(in_oklab,var(--z-accent-color),transparent_85%)]", p.highlighted && "border-[color-mix(in_oklab,var(--z-accent-color),transparent_40%)]", selected && "ring-1 ring-[color-mix(in_oklab,var(--z-accent-color),transparent_55%)]"), children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("div", { className: "text-lg font-extrabold tracking-tight text-[var(--z-fg)] group-hover:text-[var(--z-accent-color)]", children: p.name }), p.highlighted ? (_jsx(Badge, { variant: "success", active: true, children: "Popular" })) : null] }), _jsx("div", { className: "mt-2 text-2xl font-extrabold text-[var(--z-accent-color)]", children: p.price }), _jsx("ul", { className: "mt-[var(--z-space-4)] flex-1 space-y-2 text-xs text-[color-mix(in_oklab,var(--z-fg),transparent_18%)]", children: p.features.map((f) => (_jsxs("li", { className: "flex gap-2", children: [_jsx("span", { className: "mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--z-accent-color)] shadow-[0_0_8px_color-mix(in_oklab,var(--z-accent-color),transparent_55%)]" }), _jsx("span", { children: f })] }, f))) }), _jsx(Button, { type: "button", variant: selected ? "secondary" : "primary", className: "mt-[var(--z-space-6)] w-full", disabled: !onSelect, onClick: () => onSelect === null || onSelect === void 0 ? void 0 : onSelect(p.id), children: selected ? "Current plan" : "Select plan (UI)" })] }, p.id));
        }) }));
}
