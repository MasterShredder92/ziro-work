"use client";
import { useEffect, useState } from "react";
import { Users, Banknote, AlertTriangle, TrendingUp, CalendarCheck, Receipt } from "lucide-react";
import { DashboardMetricCard } from "./DashboardMetricCard";
import { formatUsdFromCents } from "./dashboardFormat";

type DashboardMetrics = {
  activeStudents: number;
  activeFamilies: number;
  collectedCents: number;
  totalInvoicedCents: number;
  outstandingCents: number;
  overdueCount: number;
  scheduledCents: number;
  projectedMonthlyCents: number;
};

export function DashboardMetricsBar() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/metrics", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.activeStudents !== undefined) {
          setMetrics(json as DashboardMetrics);
        }
      })
      .catch(() => null);
  }, []);

  const monthLabel = new Date().toLocaleString("default", { month: "long" });

  return (
    <section className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible xl:grid-cols-6">
      <DashboardMetricCard
        label="Active Students"
        value={metrics ? String(metrics.activeStudents) : "—"}
        trend="flat"
        icon={<Users className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label={`Collected · ${monthLabel}`}
        value={metrics ? formatUsdFromCents(metrics.collectedCents) : "—"}
        trend={metrics && metrics.collectedCents > 0 ? "up" : "flat"}
        icon={<Banknote className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label={`Invoiced · ${monthLabel}`}
        value={metrics ? formatUsdFromCents(metrics.totalInvoicedCents) : "—"}
        trend={metrics && metrics.totalInvoicedCents > 0 ? "up" : "flat"}
        icon={<Receipt className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Outstanding"
        value={metrics ? formatUsdFromCents(metrics.outstandingCents) : "—"}
        trend={metrics && metrics.outstandingCents > 0 ? "down" : "flat"}
        valueClassName={metrics && metrics.outstandingCents > 0 ? "text-red-400" : undefined}
        icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Next Month"
        value={metrics ? formatUsdFromCents(metrics.projectedMonthlyCents) : "—"}
        trend="up"
        icon={<TrendingUp className="h-4 w-4" aria-hidden />}
      />
      <DashboardMetricCard
        label="Scheduled"
        value={metrics ? formatUsdFromCents(metrics.scheduledCents) : "—"}
        trend="flat"
        icon={<CalendarCheck className="h-4 w-4" aria-hidden />}
      />
    </section>
  );
}
