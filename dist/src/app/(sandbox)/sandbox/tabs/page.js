"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
export default function SandboxTabsPage() {
    const [active, setActive] = React.useState("overview");
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "Tabs" }), _jsx(Link, { className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox", children: "Back" })] }), _jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]", children: [_jsx(Tabs, { tabs: [
                            { id: "overview", label: "Overview" },
                            { id: "activity", label: _jsxs("span", { className: "inline-flex items-center gap-2", children: ["Activity ", _jsx(Badge, { variant: "neutral", children: "12" })] }) },
                            { id: "settings", label: "Settings" },
                        ], activeTab: active, onChange: setActive }), _jsxs("div", { className: "mt-[var(--z-space-5)] text-sm text-[var(--z-muted)]", children: ["Active tab: ", _jsx("span", { className: "text-[var(--z-fg)] font-semibold", children: active })] })] })] }));
}
