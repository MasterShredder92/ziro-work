"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils";
export function FeatureCard({ icon, title, description, className }) {
    return (_jsx(Card, { variant: "elevated", padding: "lg", radius: "lg", className: cn("border-[color-mix(in_oklab,var(--z-accent),transparent_78%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_88%)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]", className), children: _jsxs("div", { className: "flex items-start gap-[var(--z-space-4)]", children: [_jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--z-radius-md)] border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] text-black", children: icon }), _jsxs("div", { className: "min-w-0", children: [_jsx("h3", { className: "text-base font-extrabold text-[var(--z-fg)]", children: title }), _jsx("p", { className: "mt-2 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_38%)]", children: description })] })] }) }));
}
