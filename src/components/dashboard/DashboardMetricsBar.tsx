"use client";

import { useMemo } from "react";
import {
  Banknote,
  CalendarClock,
  ClipboardList,
  Sparkles,
  TrendingDown,
  UserPlus,
} from "lucide-react";
import { useEvents, useInvoices } from "@/hooks/data";
import { DASHBOARD_TENANT_ID } from "./constants";
import { computeDashboardMetrics } from "./computeDashboardMetrics";
import { DashboardMetricCard } from "./DashboardMetricCard";
import { formatShortNumber, formatUsdFromCents } from "./dashboardFormat";

export function DashboardMetricsBar() {
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

  const { data: invData } = useInvoices(invoiceParams);
  const { data: evData } = useEvents(eventParams);

  const metrics = useMemo(() => {
    const invoices = invData?.items ?? [];
    const events = evData?.items ?? [];
    return computeDashboardMetrics(invoices, events);
  }, [invData, evData]);

  return (
    <section className="grid grid-cols-1 gap-[var(--z-space-3)] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <DashboardMetricCard
        label="Recorded revenue"
        value={formatUsdFromCents(metrics.recognizedRevenue)}
        trend="up"
        icon={<Banknote className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Collected (MTD)"
        value={formatUsdFromCents(metrics.paidThisMonth)}
        trend={metrics.paidThisMonth > 0 ? "up" : "flat"}
        icon={<Sparkles className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Outstanding"
        value={formatUsdFromCents(metrics.outstanding)}
        trend="flat"
        icon={<ClipboardList className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="New leads (7d)"
        value={formatShortNumber(metrics.leadsThisWeek)}
        trend={metrics.leadsThisWeek > 0 ? "up" : "flat"}
        icon={<UserPlus className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Enrollments (7d)"
        value={formatShortNumber(metrics.enrollmentsThisWeek)}
        trend={metrics.enrollmentsThisWeek > 0 ? "up" : "flat"}
        icon={<CalendarClock className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Churn signals (7d)"
        value={formatShortNumber(metrics.churnThisWeek)}
        trend={metrics.churnThisWeek > 0 ? "down" : "flat"}
        icon={<TrendingDown className="h-4 w-4" aria-hidden />}
      />
    </section>
  );
}
