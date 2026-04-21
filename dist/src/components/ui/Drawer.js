"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { Button } from "@/components/ui/Button";
const widthClass = "w-[min(92vw,var(--z-drawer-width,420px))]";
export function Drawer({ open, onClose, title, children }) {
    const [mounted, setMounted] = React.useState(false);
    const [visible, setVisible] = React.useState(false);
    const [leaving, setLeaving] = React.useState(false);
    React.useEffect(() => setMounted(true), []);
    React.useEffect(() => {
        if (open) {
            setLeaving(false);
            setVisible(true);
            return;
        }
        if (visible) {
            setLeaving(true);
            const t = window.setTimeout(() => {
                setVisible(false);
                setLeaving(false);
            }, 240);
            return () => window.clearTimeout(t);
        }
    }, [open, visible]);
    React.useEffect(() => {
        if (!visible)
            return;
        function onKeyDown(e) {
            if (e.key === "Escape")
                onClose();
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [visible, onClose]);
    if (!mounted || !visible)
        return null;
    return createPortal(_jsxs("div", { className: "fixed inset-0 z-50", children: [_jsx("div", { className: cn("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity", leaving ? "opacity-0" : "opacity-100"), style: { transitionDuration: "var(--z-duration-fast)", transitionTimingFunction: "var(--z-ease-smooth)" }, onClick: onClose, "aria-hidden": true }), _jsx("div", { className: "absolute inset-0 flex justify-end", children: _jsxs("div", { role: "dialog", "aria-modal": "true", className: cn("h-full border-l bg-[var(--z-surface)]", "border-[color-mix(in_oklab,var(--z-accent),transparent_80%)]", "shadow-[-18px_0_50px_rgba(0,0,0,0.55)]", widthClass, leaving ? "z-drawer-panel--out" : "z-drawer-panel--in"), children: [_jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-[var(--z-border)] px-[var(--z-space-5)] py-[var(--z-space-4)]", children: [_jsx("div", { className: "min-w-0 truncate text-sm font-extrabold text-[var(--z-fg)]", children: title !== null && title !== void 0 ? title : "Drawer" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, className: cn("h-8 px-2", focusRingClassName()), children: "Close" })] }), _jsx("div", { className: "h-[calc(100%-56px)] overflow-y-auto px-[var(--z-space-5)] py-[var(--z-space-5)]", children: children })] }) })] }), document.body);
}
