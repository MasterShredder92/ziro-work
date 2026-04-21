"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/components/ui/utils";
export function GlobalLoader({ visible, label = "Loading workspace" }) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        queueMicrotask(() => setMounted(true));
    }, []);
    if (!mounted || !visible)
        return null;
    return createPortal(_jsx("div", { className: cn("pointer-events-none fixed inset-0 z-[60] flex items-center justify-center", "bg-[color-mix(in_oklab,var(--z-bg),transparent_35%)] backdrop-blur-[2px]"), role: "status", "aria-live": "polite", children: _jsxs("div", { className: "flex flex-col items-center gap-[var(--z-space-3)]", children: [_jsx("div", { className: "h-11 w-11 animate-spin rounded-full border-2 border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] border-t-[var(--z-accent)] shadow-[0_0_24px_color-mix(in_oklab,var(--z-accent),transparent_45%)]" }), _jsx("span", { className: "text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: label })] }) }), document.body);
}
