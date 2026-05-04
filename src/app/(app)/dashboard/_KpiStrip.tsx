"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Banknote,
  AlertTriangle,
  TrendingUp,
  CalendarCheck,
  Receipt,
} from "lucide-react";

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

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type KpiTileProps = {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  fillPct?: number;
  danger?: boolean;
  href?: string;
};

function KpiTile({ label, value, sub, icon, accent, fillPct, danger, href }: KpiTileProps) {
  const color = danger ? "#ef4444" : accent;
  const inner = (
    <div
      className="relative flex min-h-[6.5rem] min-w-[9.5rem] flex-col justify-between overflow-hidden rounded-2xl p-4 sm:min-w-0 transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer"
      style={{
        background: `radial-gradient(ellipse 90% 55% at 50% 0%, ${color}18, transparent 68%), #111113`,
        border: `1px solid ${color}38`,
        boxShadow: `0 0 0 1px ${color}22, 0 6px 28px ${color}14, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* label + icon */}
      <div className="flex items-start justify-between gap-2">
        <p
          className="text-[0.58rem] font-bold uppercase tracking-[0.2em]"
          style={{ color: "var(--z-muted)" }}
        >
          {label}
        </p>
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
      </div>

      {/* value */}
      <div className="mt-2">
        <p
          className="truncate text-xl font-extrabold tracking-tight sm:text-2xl"
          style={{ color: danger ? "#ef4444" : "var(--z-fg)" }}
        >
          {value}
        </p>
        {sub ? (
          <p className="mt-0.5 text-[10px]" style={{ color: "var(--z-muted)" }}>
            {sub}
          </p>
        ) : null}
      </div>

      {/* bottom fill bar */}
      {fillPct !== undefined ? (
        <div
          className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <div
            className="h-full rounded-b-2xl transition-all duration-700"
            style={{
              width: `${Math.min(100, Math.max(0, fillPct))}%`,
              background: `linear-gradient(90deg, ${color}66, ${color})`,
              boxShadow: `0 0 10px ${color}88`,
            }}
          />
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

export function KpiStrip() {
  const [m, setM] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/metrics", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.activeStudents !== undefined) setM(json as DashboardMetrics);
      })
      .catch(() => null);
  }, []);

  const month = new Date().toLocaleString("default", { month: "long" });

  const collectionPct =
    m && m.totalInvoicedCents > 0
      ? Math.round((m.collectedCents / m.totalInvoicedCents) * 100)
      : 0;

  const outstandingDanger = !!(m && m.outstandingCents > 0);

  if (!m) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[6.5rem] animate-pulse rounded-2xl"
            style={{
              background:
                "linear-gradient(90deg, #111113 25%, rgba(255,255,255,0.04) 50%, #111113 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.6s infinite",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <KpiTile
        label="Active Students"
        value={String(m.activeStudents)}
        sub={`${m.activeFamilies} families`}
        icon={<Users className="h-3.5 w-3.5" />}
        accent="#00ff88"
        fillPct={Math.min(100, (m.activeStudents / 200) * 100)}
        href="/crm/families"
      />
      <KpiTile
        label={`Collected · ${month}`}
        value={usd(m.collectedCents)}
        sub={`${collectionPct}% of invoiced`}
        icon={<Banknote className="h-3.5 w-3.5" />}
        accent="#00ff88"
        fillPct={collectionPct}
        href="/invoices?status=PAID"
      />
      <KpiTile
        label={`Invoiced · ${month}`}
        value={usd(m.totalInvoicedCents)}
        icon={<Receipt className="h-3.5 w-3.5" />}
        accent="#2563eb"
        fillPct={m.totalInvoicedCents > 0 ? 100 : 0}
        href="/invoices"
      />
      <KpiTile
        label="Outstanding"
        value={usd(m.outstandingCents)}
        sub={m.overdueCount > 0 ? `${m.overdueCount} overdue` : undefined}
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        accent="#ef4444"
        danger={outstandingDanger}
        fillPct={
          m.totalInvoicedCents > 0
            ? Math.round((m.outstandingCents / m.totalInvoicedCents) * 100)
            : 0
        }
        href="/invoices?status=UNPAID"
      />
      <KpiTile
        label="Scheduled"
        value={usd(m.scheduledCents)}
        sub="pending this month"
        icon={<CalendarCheck className="h-3.5 w-3.5" />}
        accent="#d97706"
        fillPct={
          m.totalInvoicedCents > 0
            ? Math.round((m.scheduledCents / m.totalInvoicedCents) * 100)
            : 0
        }
        href="/invoices?status=SCHEDULED"
      />
      <KpiTile
        label="Next Month"
        value={usd(m.projectedMonthlyCents)}
        sub="projected revenue"
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        accent="#7c3aed"
        fillPct={
          m.collectedCents > 0
            ? Math.min(100, Math.round((m.projectedMonthlyCents / m.collectedCents) * 100))
            : 50
        }
      />
    </div>
  );
}
