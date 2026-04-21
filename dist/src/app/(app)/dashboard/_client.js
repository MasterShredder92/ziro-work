"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
import { PageTransition } from "@/components/system/PageTransition";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
function AgentGridSkeleton() {
    return (_jsx("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: Array.from({ length: 7 }).map((_, i) => (_jsx("div", { className: "h-52 animate-pulse rounded-2xl border border-[var(--z-border)] bg-[var(--z-surface-2)]" }, i))) }));
}
function BlockSkeleton({ rows }) {
    return (_jsx("div", { className: "space-y-3", children: Array.from({ length: rows }).map((_, i) => (_jsx("div", { className: "h-20 animate-pulse rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)]" }, i))) }));
}
const AgentCards = dynamic(() => import("@/components/agent/AgentCards").then((m) => ({ default: m.AgentCards })), { loading: () => _jsx(AgentGridSkeleton, {}) });
const QuickActions = dynamic(() => import("@/components/dashboard/QuickActions").then((m) => ({ default: m.QuickActions })), { loading: () => _jsx(BlockSkeleton, { rows: 4 }) });
const ActivityFeed = dynamic(() => import("@/components/dashboard/ActivityFeed").then((m) => ({ default: m.ActivityFeed })), { loading: () => _jsx(BlockSkeleton, { rows: 5 }) });
const DashboardMetricsBar = dynamic(() => import("@/components/dashboard/DashboardMetricsBar").then((m) => ({ default: m.DashboardMetricsBar })), {
    loading: () => (_jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6", children: Array.from({ length: 6 }).map((_, i) => (_jsx("div", { className: "h-[5.25rem] animate-pulse rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)]" }, i))) })),
});
const OverdueAlert = dynamic(() => import("@/components/dashboard/OverdueAlert").then((m) => ({ default: m.OverdueAlert })), { loading: () => null });
const AgentPipelineCanvas = dynamic(() => import("@/components/studio-map/AgentPipelineCanvas").then((m) => ({ default: m.AgentPipelineCanvas })), { loading: () => _jsx("div", { className: "h-[500px] w-full animate-pulse bg-white/5 rounded-3xl" }) });
export function DashboardClient() {
    return (_jsx(PageShell, { showBreadcrumb: false, shellClassName: "min-h-full bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,color-mix(in_oklab,var(--z-accent),transparent_94%),transparent_52%)] p-3 pt-2 sm:p-6 sm:pt-5", mainClassName: "mt-0", children: _jsx(PageTransition, { children: _jsxs("div", { className: "mx-auto max-w-[1600px] flex flex-col gap-4 sm:gap-8", "data-dashboard-rev": "5", "data-app": "ziro-work", children: [_jsxs("header", { className: "border-b border-[color-mix(in_oklab,var(--z-border),transparent_35%)] pb-3", children: [_jsx("h1", { className: "bg-gradient-to-br from-[var(--z-fg)] to-[color-mix(in_oklab,var(--z-fg),transparent_25%)] bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-[1.65rem]", children: "Your Crew" }), _jsx("p", { className: "mt-1 hidden max-w-xl text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_38%)] sm:block", children: "7 agents working for you right now. Click any one to see what they're doing and jump straight to their page." })] }), _jsx(DashboardMetricsBar, {}), _jsx(DashboardSection, { id: "living-map", title: "Living Map", description: "Real-time visualization of your Senior Operator pipeline.", withSurface: false, children: _jsx("div", { className: "h-[400px] sm:h-[600px] w-full", "data-tour": "living-map", children: _jsx(AgentPipelineCanvas, {}) }) }), _jsx(OverdueAlert, {}), _jsx(DashboardSection, { id: "team", title: "Your crew", withSurface: false, children: _jsx("div", { "data-tour": "agent-cards", children: _jsx(AgentCards, {}) }) }), _jsx(DashboardSection, { title: "Shortcuts", description: "Jump to the work that usually needs a human.", children: _jsx("div", { "data-tour": "quick-actions", children: _jsx(QuickActions, { showTitle: false }) }) }), _jsx(DashboardSection, { title: "Recent activity", description: "Latest events across your studio. The last 7 days show up first.", children: _jsx("div", { "data-tour": "activity-feed", children: _jsx(ActivityFeed, { showTitle: false }) }) })] }) }) }));
}
