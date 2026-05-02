"use client";
import { useState } from "react";
import type { BillingMetrics } from "@/app/(app)/invoices/page";

function fmt(cents: number) {
  if (!cents) return "$0";
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function MetricRow({ label, value, color, tooltip }: { label: string; value: string; color?: string; tooltip?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5" title={tooltip}>
      <span className="text-xs text-[#909098]">{label}</span>
      <span className="text-sm font-semibold" style={{ color: color ?? "white" }}>
        {value}
      </span>
    </div>
  );
}

function MetricsCard({ m }: { m: BillingMetrics }) {
  return (
    <div
      className="w-full sm:w-auto rounded-xl border bg-[#0a0a0c] p-4 sm:min-w-[220px]"
      style={{ borderColor: `${m.color}33` }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
        <span className="text-sm font-bold text-white">{m.locationName}</span>
      </div>
      <div className="divide-y divide-[#1c1c1e]">
        <MetricRow label="Collected This Month"    value={fmt(m.collectedThisMonth)}     color="#22C55E" />
        <MetricRow label="Total Invoiced This Month" value={fmt(m.totalInvoicedThisMonth)} />
        <MetricRow
          label="Discounted This Month"
          value={m.discountedThisMonth < 0 ? "—" : fmt(m.discountedThisMonth)}
          color={m.discountedThisMonth < 0 ? "#5a5a62" : "#F59E0B"}
          tooltip={m.discountedThisMonth < 0 ? "Pending recurring series sync" : undefined}
        />
        <MetricRow label="Next Month (Projected)"  value={fmt(m.nextMonthProjected)}     color="#0EA5E9" />
        <MetricRow label="Scheduled Payments"      value={fmt(m.scheduledPayments)}      color="#A78BFA" />
      </div>
    </div>
  );
}

interface Props {
  metrics: BillingMetrics[];
}

export function BillingSummaryBar({ metrics }: Props) {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const allSchools = metrics.find((m) => m.locationId === null);
  const locations = metrics.filter((m) => m.locationId !== null);

  const tabs = [
    { id: null, label: "All Locations", color: "#00ff88" },
    ...locations.map((l) => ({ id: l.locationId, label: l.locationName, color: l.color })),
  ];

  const visible = activeTab === null
    ? [allSchools, ...locations].filter(Boolean) as BillingMetrics[]
    : locations.filter((l) => l.locationId === activeTab);

  return (
    <div className="space-y-4">
      {/* Location filter pills */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id ?? "all"}
            onClick={() => setActiveTab(t.id)}
            className="rounded-full border px-3 py-1 text-xs font-semibold transition-all"
            style={{
              borderColor: activeTab === t.id ? t.color : "#2a2a2e",
              background: activeTab === t.id ? `${t.color}22` : "#0a0a0c",
              color: activeTab === t.id ? t.color : "#909098",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards — horizontal scroll on mobile, wrap on desktop */}
      <div className="flex flex-wrap gap-4">
        {visible.map((m) => (
          <MetricsCard key={m.locationId ?? "all"} m={m} />
        ))}
      </div>
    </div>
  );
}
