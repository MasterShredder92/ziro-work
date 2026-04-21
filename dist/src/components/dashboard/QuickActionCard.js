"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";
export function QuickActionCard({ title, description, actionLabel, onClick }) {
    return (_jsx(Card, { padding: "md", radius: "md", variant: "default", className: cn("neon-ramp group transition-[border-color,box-shadow] duration-[var(--z-duration-fast)] [transition-timing-function:var(--z-ease-smooth)]", "hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_55%)]"), children: _jsxs("div", { className: "flex flex-col gap-[var(--z-space-4)] sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { className: "min-w-0 space-y-[var(--z-space-2)]", children: [_jsx("h3", { className: "text-sm font-extrabold tracking-tight text-[var(--z-fg)]", children: title }), _jsx("p", { className: "text-xs leading-relaxed text-[var(--z-muted)]", children: description })] }), _jsx(Button, { type: "button", variant: "secondary", size: "sm", className: "shrink-0 border-[var(--z-border)] group-hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] group-hover:text-[var(--z-accent)]", onClick: onClick, children: actionLabel })] }) }));
}
