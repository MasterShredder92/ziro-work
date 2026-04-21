"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ProductTour } from "@/components/tour/ProductTour";
export default function SandboxTourPage() {
    const [open, setOpen] = React.useState(false);
    return (_jsxs(PageShell, { children: [_jsxs("div", { className: "mx-auto max-w-2xl space-y-[var(--z-space-6)]", children: [_jsx(PageHeader, { title: "Sandbox \u00B7 Product tour", subtitle: "Opens the same tour overlay used in the app shell." }), _jsx(Button, { type: "button", variant: "primary", onClick: () => setOpen(true), children: "Preview tour" }), _jsx("div", { "data-tour": "dashboard-metrics", className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "Dummy target for step 1 when launched from this page." })] }), _jsx(ProductTour, { open: open, onClose: () => setOpen(false) })] }));
}
