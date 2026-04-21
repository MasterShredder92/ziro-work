"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";
export function EmptyState({ title, description, actionLabel, onAction, className, }) {
    return (_jsxs(Card, { variant: "outline", padding: "md", radius: "md", className: cn("border-dashed text-center", className), role: "status", "aria-live": "polite", children: [_jsx("p", { className: "text-sm font-semibold text-[var(--z-fg)]", children: title }), description ? (_jsx("p", { className: "mt-[var(--z-space-2)] text-xs text-[var(--z-muted)]", children: description })) : null, actionLabel && onAction ? (_jsx("div", { className: "mt-[var(--z-space-4)]", children: _jsx(Button, { variant: "secondary", size: "sm", onClick: onAction, children: actionLabel }) })) : null] }));
}
const toneClass = {
    default: "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-fg)]",
    danger: "border-[color-mix(in_oklab,var(--z-danger),transparent_60%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_90%)] text-[color-mix(in_oklab,var(--z-danger),white_8%)]",
    warning: "border-[color-mix(in_oklab,var(--z-warning),transparent_65%)] bg-[color-mix(in_oklab,var(--z-warning),transparent_92%)] text-[color-mix(in_oklab,var(--z-warning),white_8%)]",
    success: "border-[color-mix(in_oklab,var(--z-accent),transparent_65%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] text-[var(--z-accent)]",
};
export function InlineNotice({ tone = "default", title, children, className }) {
    return (_jsxs("div", { className: cn("rounded-[var(--z-radius-sm)] border px-[var(--z-space-3)] py-[var(--z-space-2)] text-xs", toneClass[tone], className), role: tone === "danger" ? "alert" : "status", "aria-live": tone === "danger" ? "assertive" : "polite", children: [title ? _jsx("p", { className: "font-semibold", children: title }) : null, _jsx("p", { className: title ? "mt-1" : "", children: children })] }));
}
export function SurfaceSkeleton({ lines = 3, className }) {
    return (_jsxs("div", { className: cn("rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-4)]", className), "aria-hidden": true, children: [_jsx("div", { className: "h-4 w-32 animate-pulse rounded bg-[var(--z-surface-2)]" }), _jsx("div", { className: "mt-[var(--z-space-3)] space-y-[var(--z-space-2)]", children: Array.from({ length: lines }).map((_, idx) => (_jsx("div", { className: "h-3 animate-pulse rounded bg-[var(--z-surface-2)]", style: { width: `${88 - idx * 12}%` } }, idx))) })] }));
}
