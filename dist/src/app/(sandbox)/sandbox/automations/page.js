"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import * as React from "react";
import { AutomationCard } from "@/components/automation/AutomationCard";
export default function SandboxAutomationsPage() {
    const [a, setA] = React.useState(true);
    const [b, setB] = React.useState(false);
    return (_jsxs("div", { className: "space-y-[var(--z-space-8)]", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "Automations sandbox" }), _jsx(Link, { className: "text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox", children: "Back" })] }), _jsxs("div", { className: "grid max-w-xl grid-cols-1 gap-[var(--z-space-4)]", children: [_jsx(AutomationCard, { title: "Sample nurture", description: "Preview card + switch styling in isolation.", enabled: a, onEnabledChange: setA }), _jsx(AutomationCard, { title: "Sample win-back", description: "Second row to validate spacing and hover states.", enabled: b, onEnabledChange: setB })] })] }));
}
