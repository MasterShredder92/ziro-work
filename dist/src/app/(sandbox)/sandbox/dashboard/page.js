"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DashboardMetricsBar } from "@/components/dashboard/DashboardMetricsBar";
import { QuickActions } from "@/components/dashboard/QuickActions";
export default function SandboxDashboardPage() {
    return (_jsxs("div", { className: "space-y-[var(--z-space-8)]", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx(PageHeader, { title: "Dashboard (sandbox)", subtitle: "Static layout preview with live data hooks." }), _jsx(Link, { className: "text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox", children: "Back" })] }), _jsx(DashboardMetricsBar, {}), _jsx(QuickActions, {}), _jsx(ActivityFeed, {})] }));
}
