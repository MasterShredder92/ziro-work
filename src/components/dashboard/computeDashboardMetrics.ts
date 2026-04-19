import type { EventLog } from "@/lib/data/models/events";
import type { Invoice } from "@/lib/data/models/invoices";
import { daysAgoIso, startOfUtcMonth } from "./dashboardFormat";

export type DashboardMetrics = {
  recognizedRevenue: number;
  paidThisMonth: number;
  outstanding: number;
  overdueCount: number;
  overdueAmount: number;
  leadsThisWeek: number;
  enrollmentsThisWeek: number;
  churnThisWeek: number;
};

export function latestKpiSnapshot(events: EventLog[]): Record<string, unknown> | null {
  for (const e of events) {
    if (e.event_type === "kpi_snapshot" && e.payload && typeof e.payload === "object") {
      return e.payload as Record<string, unknown>;
    }
  }
  return null;
}

export function sumCents(invoices: Invoice[], pred: (i: Invoice) => boolean): number {
  return invoices.reduce((acc, i) => (pred(i) ? acc + (i.amount_cents ?? 0) : acc), 0);
}

export function computeDashboardMetrics(invoices: Invoice[], events: EventLog[]): DashboardMetrics {
  const now = new Date();
  const monthStart = startOfUtcMonth(now);
  const weekAgo = daysAgoIso(7);

  const paidThisMonth = sumCents(
    invoices,
    (i) =>
      i.status === "paid" && !!i.paid_at && new Date(i.paid_at).getTime() >= monthStart.getTime(),
  );

  const recognizedRevenue = sumCents(invoices, (i) => i.status === "paid");

  const outstanding = sumCents(invoices, (i) => i.status === "sent" || i.status === "overdue");

  const kpi = latestKpiSnapshot(events);
  const leadsThisWeek =
    typeof kpi?.leadsThisWeek === "number"
      ? kpi.leadsThisWeek
      : events.filter(
          (e) =>
            new Date(e.created_at).toISOString() >= weekAgo &&
            /lead|intake|trial_scheduled/i.test(e.event_type),
        ).length;

  const enrollmentsThisWeek = events.filter(
    (e) => e.event_type === "student_enrolled" && new Date(e.created_at).toISOString() >= weekAgo,
  ).length;

  const churnThisWeek = events.filter((e) => {
    if (new Date(e.created_at).toISOString() < weekAgo) return false;
    const t = e.event_type.toLowerCase();
    return (
      t.includes("churn") ||
      t.includes("lost") ||
      t.includes("cancel") ||
      t.includes("inactive") ||
      t.includes("drop")
    );
  }).length;

  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const overdueAmount = sumCents(invoices, (i) => i.status === "overdue");

  return {
    recognizedRevenue,
    paidThisMonth,
    outstanding,
    overdueCount,
    overdueAmount,
    leadsThisWeek,
    enrollmentsThisWeek,
    churnThisWeek,
  };
}
