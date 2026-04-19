"use client";

import * as React from "react";
import { Suspense } from "react";
import { TenantUiProvider, useTenantUi } from "@/components/tenant/TenantUiContext";
import { NotificationsProvider } from "@/components/notifications/NotificationsProvider";
import { NavigationProgress } from "@/components/system/NavigationProgress";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { DemoBanner } from "@/components/demo/DemoBanner";

type SystemProvidersProps = {
  children: React.ReactNode;
  defaultTenantId: string;
};

function NotificationsBridge({ children }: { children: React.ReactNode }) {
  const { tenantId } = useTenantUi();
  return <NotificationsProvider tenantId={tenantId}>{children}</NotificationsProvider>;
}

export function SystemProviders({ children, defaultTenantId }: SystemProvidersProps) {
  return (
    <TenantUiProvider defaultTenantId={defaultTenantId}>
      <NotificationsBridge>
        <AnalyticsProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <DemoBanner />
          {children}
        </AnalyticsProvider>
      </NotificationsBridge>
    </TenantUiProvider>
  );
}
