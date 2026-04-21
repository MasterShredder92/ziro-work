"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import * as React from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationsProvider } from "@/components/notifications/NotificationsProvider";
import { TenantSwitcher } from "@/components/tenant/TenantSwitcher";
import { TenantUiProvider } from "@/components/tenant/TenantUiContext";
import { GlobalLoader } from "@/components/system/GlobalLoader";
import { ErrorBoundary, SegmentErrorView } from "@/components/system/ErrorBoundary";
import { Button } from "@/components/ui/Button";
const DEMO_TENANT = "00000000-0000-0000-0000-000000000001";
export const dynamic = "force-dynamic";
function ThrowOnce() {
    const [boom, setBoom] = React.useState(false);
    if (boom)
        throw new Error("Sandbox-triggered render failure");
    return (_jsx(Button, { type: "button", variant: "secondary", size: "sm", onClick: () => setBoom(true), children: "Trigger error" }));
}
export default function SystemSandboxPage() {
    const [loader, setLoader] = React.useState(false);
    const [demoError] = React.useState(() => new Error("Example route error payload"));
    return (_jsxs("div", { className: "space-y-[var(--z-space-8)]", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "System layer" }), _jsx(Link, { className: "text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox", children: "Back" })] }), _jsxs("section", { className: "space-y-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]", children: [_jsx("h2", { className: "text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "TenantSwitcher" }), _jsx(TenantUiProvider, { defaultTenantId: DEMO_TENANT, children: _jsx(TenantSwitcher, {}) })] }), _jsxs("section", { className: "space-y-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]", children: [_jsx("h2", { className: "text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "NotificationBell" }), _jsx(TenantUiProvider, { defaultTenantId: DEMO_TENANT, children: _jsx(NotificationsProvider, { tenantId: DEMO_TENANT, children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(NotificationBell, {}), _jsx("span", { className: "text-xs text-[var(--z-muted)]", children: "Opens drawer; uses live events when configured." })] }) }) })] }), _jsxs("section", { className: "space-y-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]", children: [_jsx("h2", { className: "text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "GlobalLoader" }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx(Button, { type: "button", size: "sm", variant: "secondary", onClick: () => setLoader(true), children: "Show overlay" }), _jsx(Button, { type: "button", size: "sm", variant: "ghost", onClick: () => setLoader(false), children: "Hide" })] }), _jsx(GlobalLoader, { visible: loader })] }), _jsxs("section", { className: "space-y-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]", children: [_jsx("h2", { className: "text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "ErrorBoundary" }), _jsx(ErrorBoundary, { children: _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx(ThrowOnce, {}), _jsx("span", { className: "text-xs text-[var(--z-muted)]", children: "Class boundary catches child render throws." })] }) })] }), _jsxs("section", { className: "space-y-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-5)]", children: [_jsx("h2", { className: "text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "SegmentErrorView" }), _jsx(SegmentErrorView, { error: demoError, reset: () => undefined, title: "Example segment error" })] })] }));
}
