"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { List } from "@/components/ui/List";
export default function SandboxDrawerPage() {
    const [open, setOpen] = React.useState(false);
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "Drawer" }), _jsx(Link, { className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox", children: "Back" })] }), _jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]", children: _jsx(Button, { variant: "primary", onClick: () => setOpen(true), children: "Open Drawer" }) }), _jsx(Drawer, { open: open, onClose: () => setOpen(false), title: "Premium Drawer", children: _jsxs("div", { className: "space-y-[var(--z-space-5)]", children: [_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Slide-in shell from the right. Tokens control width + spacing." }), _jsx(List, { items: [
                                { id: "a", title: "Quick action", description: "Example content inside drawer." },
                                { id: "b", title: "Secondary action", description: "No routing/data logic." },
                            ] }), _jsxs("div", { className: "flex gap-[var(--z-space-3)]", children: [_jsx(Button, { variant: "secondary", onClick: () => setOpen(false), children: "Close" }), _jsx(Button, { variant: "primary", onClick: () => setOpen(false), children: "Done" })] })] }) })] }));
}
