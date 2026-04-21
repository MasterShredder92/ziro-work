"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
export function OnboardingStep({ title, description, actionLabel, onAction }) {
    return (_jsx(Card, { variant: "elevated", padding: "md", radius: "lg", className: "border-[color-mix(in_oklab,var(--z-accent),transparent_78%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_88%)]", children: _jsxs("div", { className: "space-y-[var(--z-space-3)]", children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: title }), _jsx("p", { className: "text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_38%)]", children: description }), _jsx(Button, { type: "button", variant: "primary", size: "md", onClick: onAction, children: actionLabel })] }) }));
}
