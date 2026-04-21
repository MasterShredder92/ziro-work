"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";
export function TourStep({ title, description, nextLabel, onNext, onSkip, style, placement = "bottom", className, }) {
    return (_jsxs("div", { role: "dialog", "aria-modal": "true", className: cn("pointer-events-auto fixed z-[80] w-[min(92vw,360px)] rounded-[var(--z-radius-lg)] border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[var(--z-surface)] p-[var(--z-space-5)] shadow-[0_20px_60px_rgba(0,0,0,0.65)]", placement === "top" ? "origin-bottom" : "origin-top", className), style: style, children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: title }), _jsx("p", { className: "mt-2 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_35%)]", children: description }), _jsxs("div", { className: "mt-[var(--z-space-4)] flex flex-wrap items-center justify-end gap-2", children: [onSkip ? (_jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: onSkip, children: "Skip" })) : null, _jsx(Button, { type: "button", variant: "primary", size: "sm", onClick: onNext, children: nextLabel })] })] }));
}
