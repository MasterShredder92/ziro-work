"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils/cn";
export function SettingsGroup({ title, children, className }) {
    return (_jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: cn(className), children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: title }), _jsx("div", { className: "mt-[var(--z-space-4)] space-y-[var(--z-space-4)]", children: children })] }));
}
