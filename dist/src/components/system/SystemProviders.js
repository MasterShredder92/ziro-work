"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense } from "react";
import { TenantUiProvider, useTenantUi } from "@/components/tenant/TenantUiContext";
import { NotificationsProvider } from "@/components/notifications/NotificationsProvider";
import { NavigationProgress } from "@/components/system/NavigationProgress";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { DemoBanner } from "@/components/demo/DemoBanner";
function NotificationsBridge({ children }) {
    const { tenantId } = useTenantUi();
    return _jsx(NotificationsProvider, { tenantId: tenantId, children: children });
}
export function SystemProviders({ children, defaultTenantId }) {
    return (_jsx(TenantUiProvider, { defaultTenantId: defaultTenantId, children: _jsx(NotificationsBridge, { children: _jsxs(AnalyticsProvider, { children: [_jsx(Suspense, { fallback: null, children: _jsx(NavigationProgress, {}) }), _jsx(DemoBanner, {}), children] }) }) }));
}
