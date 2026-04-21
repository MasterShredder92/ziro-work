"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils/cn";
function band(score) {
    if (score < 35)
        return { label: "Low", variant: "success" };
    if (score < 65)
        return { label: "Elevated", variant: "warning" };
    return { label: "Critical", variant: "danger" };
}
export function StudentRiskCard({ riskScore, className }) {
    const { label, variant } = band(riskScore);
    return (_jsx(Card, { variant: "elevated", padding: "lg", radius: "lg", shadow: "sm", className: cn(className), children: _jsx(Section, { title: "Retention risk", accent: true, spacing: "tight", children: _jsxs("div", { className: "flex flex-wrap items-end justify-between gap-[var(--z-space-4)]", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Composite score" }), _jsx("div", { className: "mt-2 text-4xl font-black tracking-tight text-[var(--z-fg)]", children: riskScore }), _jsx("div", { className: "mt-1 text-xs text-[var(--z-muted)]", children: "0 \u00B7 100 scale" })] }), _jsx(Badge, { variant: variant, active: true, className: "text-sm", children: label })] }) }) }));
}
