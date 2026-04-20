"use client";

import { useMemo } from "react";
import {
  Banknote,
  CalendarClock,
  ChevronUp,
  Sparkles,
  Tag,
} from "lucide-react";
import { useInvoices } from "@/hooks/data";
import { DASHBOARD_TENANT_ID } from "./constants";
import { computeDashboardMetrics } from "./computeDashboardMetrics";
import { DashboardMetricCard } from "./DashboardMetricCard";
import { formatUsdFromCents } from "./dashboardFormat";

export function DashboardMetricsBar() {
  const tenantId = DASHBOARD_TENANT_ID;

  const invoiceParams = useMemo(
    () => ({
      tenantId,
      page: { mode: "offset" as const, page: 1, pageSize: 200 },
    }),
    [tenantId],
  );

  const { data: invData } = useInvoices(invoiceParams);

  const metrics = useMemo(() => {
    const invoices = invData?.items ?? [];
    return computeDashboardMetrics(invoices, []);
  }, [invData]);

  return (
    <section className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible xl:grid-cols-5">
      <DashboardMetricCard
        label="Collected This Month"
        value={formatUsdFromCents(metrics.paidThisMonth)}
        trend={metrics.paidThisMonth > 0 ? "up" : "flat"}
        icon={<Sparkles className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Total Invoiced"
        value={formatUsdFromCents(metrics.totalInvoicedThisMonth)}
        trend={metrics.totalInvoicedThisMonth > 0 ? "up" : "flat"}
        icon={<Banknote className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Discounted"
        value={formatUsdFromCents(metrics.discountedThisMonth)}
        trend={metrics.discountedThisMonth > 0 ? "down" : "flat"}
        icon={<Tag className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Next Month Projected"
        value={formatUsdFromCents(metrics.nextMonthProjected)}
        trend="up"
        icon={<ChevronUp className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Scheduled Payments"
        value={formatUsdFromCents(metrics.outstanding)}
        trend="flat"
        icon={<CalendarClock className="h-4 w-4" aria-hidden />}
      />
    </section>
  );
}
