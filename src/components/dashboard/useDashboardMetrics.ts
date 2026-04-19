"use client";

import { useMemo } from "react";
import { useEvents, useInvoices } from "@/hooks/data";
import { DASHBOARD_TENANT_ID } from "./constants";
import { computeDashboardMetrics, type DashboardMetrics } from "./computeDashboardMetrics";

export function useDashboardMetrics(): {
  metrics: DashboardMetrics;
  loading: boolean;
  error: Error | null;
} {
  const tenantId = DASHBOARD_TENANT_ID;

  const invoiceParams = useMemo(
    () => ({
      tenantId,
      page: { mode: "offset" as const, page: 1, pageSize: 200 },
    }),
    [tenantId],
  );

  const eventParams = useMemo(
    () => ({
      tenantId,
      page: { mode: "offset" as const, page: 1, pageSize: 180 },
    }),
    [tenantId],
  );

  const { data: invData, error: invErr, isLoading: invLoading } = useInvoices(invoiceParams);
  const { data: evData, error: evErr, isLoading: evLoading } = useEvents(eventParams);

  const metrics = useMemo(() => {
    const invoices = invData?.items ?? [];
    const events = evData?.items ?? [];
    return computeDashboardMetrics(invoices, events);
  }, [invData, evData]);

  const error = invErr ?? evErr ?? null;

  return {
    metrics,
    loading: invLoading || evLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
  };
}
