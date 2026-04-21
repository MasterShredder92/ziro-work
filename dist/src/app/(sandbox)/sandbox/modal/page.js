"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
export default function SandboxModalPage() {
    const [open, setOpen] = React.useState(false);
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "Modal" }), _jsx(Link, { className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox", children: "Back" })] }), _jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]", children: _jsx(Button, { variant: "primary", onClick: () => setOpen(true), children: "Open Modal" }) }), _jsx(Modal, { open: open, onClose: () => setOpen(false), title: "Premium Modal", children: _jsxs("div", { className: "space-y-[var(--z-space-4)]", children: [_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Backdrop blur + neon accent border. Composable content." }), _jsxs("div", { className: "flex items-center gap-[var(--z-space-2)]", children: [_jsx(Badge, { variant: "success", active: true, children: "Ready" }), _jsx(Badge, { variant: "neutral", children: "Shell" })] }), _jsxs("div", { className: "flex gap-[var(--z-space-3)]", children: [_jsx(Button, { variant: "secondary", onClick: () => setOpen(false), children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: () => setOpen(false), children: "Confirm" })] })] }) })] }));
}
