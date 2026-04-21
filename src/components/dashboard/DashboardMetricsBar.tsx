"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  CalendarClock,
  ChevronUp,
  Sparkles,
  Tag,
} from "lucide-react";
import { DashboardMetricCard } from "./DashboardMetricCard";
import { formatUsdFromCents } from "./dashboardFormat";

type BillingSummaryMetrics = {
  collected: number;
  totalInvoiced: number;
  outstanding: number;
  nextMonthProjected: number;
  scheduled: number;
};

export function DashboardMetricsBar() {
  const [metrics, setMetrics] = useState<BillingSummaryMetrics | null>(null);

  useEffect(() => {
    fetch("/api/invoices/billing-summary", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const all = json?.data?.allSchools;
        if (!all) return;
        setMetrics({
          collected: all.collected ?? 0,
          totalInvoiced: all.totalInvoiced ?? 0,
          outstanding: all.outstanding ?? 0,
          nextMonthProjected: all.nextMonthProjected ?? 0,
          scheduled: all.scheduled ?? 0,
        });
      })
      .catch(() => null);
  }, []);

  return (
    <section className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible xl:grid-cols-5 2xl:grid-cols-5">
      <DashboardMetricCard
        label="Collected This Month"
        value={metrics ? formatUsdFromCents(metrics.collected) : "—"}
        trend={metrics && metrics.collected > 0 ? "up" : "flat"}
        icon={<Sparkles className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Total Invoiced"
        value={metrics ? formatUsdFromCents(metrics.totalInvoiced) : "—"}
        trend={metrics && metrics.totalInvoiced > 0 ? "up" : "flat"}
        icon={<Banknote className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Outstanding"
        value={metrics ? formatUsdFromCents(metrics.outstanding) : "—"}
        trend={metrics && metrics.outstanding > 0 ? "down" : "flat"}
        valueClassName="text-red-500"
        icon={<Tag className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Next Month Projected"
        value={metrics ? formatUsdFromCents(metrics.nextMonthProjected) : "—"}
        trend="up"
        icon={<ChevronUp className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Scheduled Payments"
        value={metrics ? formatUsdFromCents(metrics.scheduled) : "—"}
        trend="flat"
        icon={<CalendarClock className="h-4 w-4" aria-hidden />}
      />
    </section>
  );
}
