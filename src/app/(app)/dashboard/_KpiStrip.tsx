"use client";

import { useEffect, useRef, useState } from "react";
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

/** Animates a number from 0 to target over ~600ms */
function useCountUp(target: number, enabled: boolean): number {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || target === 0) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const duration = 600;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, enabled]);

  return display;
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
  animate?: boolean;
};

function KpiTile({ label, value, sub, icon, accent, fillPct, danger, href, animate }: KpiTileProps) {
  const color = danger ? "var(--z-danger)" : accent;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const inner = (
    <div
      className="relative flex min-h-[6.5rem] min-w-[9.5rem] flex-col justify-between overflow-hidden rounded-2xl p-4 sm:min-w-0 cursor-pointer group kpi-tile"
      style={{
        background: `radial-gradient(ellipse 90% 55% at 50% 0%, ${color}1a, transparent 68%), var(--z-kpi-bg, var(--z-surface))`,
        border: `1px solid ${color}30`,
        boxShadow: `0 0 0 1px ${color}18, 0 8px 32px ${color}10, inset 0 1px 0 var(--z-kpi-inset, rgba(255,255,255,0.05))`,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 0 0 1px ${color}40, 0 16px 40px ${color}20, inset 0 1px 0 var(--z-kpi-inset, rgba(255,255,255,0.07))`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 0 0 1px ${color}18, 0 8px 32px ${color}10, inset 0 1px 0 var(--z-kpi-inset, rgba(255,255,255,0.05))`;
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
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150"
          style={{
            background: `${color}1e`,
            color,
            boxShadow: `0 0 10px ${color}30`,
          }}
        >
          {icon}
        </div>
      </div>

      {/* value */}
      <div className="mt-2">
        <p
          className="truncate text-xl font-extrabold tracking-tight sm:text-2xl"
          style={{
            color: danger ? "var(--z-danger)" : "var(--z-fg)",
            textShadow: danger ? "0 0 20px rgba(239,68,68,0.15)" : undefined,
          }}
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
          style={{ background: "var(--z-kpi-track, rgba(255,255,255,0.04))" }}
        >
          <div
            className="h-full rounded-b-2xl"
            style={{
              width: mounted ? `${Math.min(100, Math.max(0, fillPct))}%` : "0%",
              background: `linear-gradient(90deg, ${color}55, ${color})`,
              boxShadow: `0 0 12px ${color}99`,
              transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </div>
      ) : null}

      {/* Top-right corner glow */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-30"
        style={{ background: `radial-gradient(circle, ${color}40, transparent 70%)` }}
      />
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

export function KpiStrip() {
  const [m, setM] = useState<DashboardMetrics | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/metrics", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.activeStudents !== undefined) {
          setM(json as DashboardMetrics);
          setTimeout(() => setReady(true), 100);
        }
      })
      .catch(() => null);
  }, []);

  const month = new Date().toLocaleString("default", { month: "long" });

  const animatedStudents = useCountUp(m?.activeStudents ?? 0, ready);

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
            className="h-[6.5rem] rounded-2xl kpi-shimmer"
            style={{
              background: "var(--z-kpi-shimmer-bg, linear-gradient(90deg, var(--z-surface) 25%, var(--z-surface-hover) 50%, var(--z-surface) 75%))",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.6s infinite",
              border: "1px solid var(--z-border)",
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
        value={String(animatedStudents)}
        sub={`${m.activeFamilies} families`}
        icon={<Users className="h-3.5 w-3.5" />}
        accent="#00ff88"
        fillPct={Math.min(100, (m.activeStudents / 200) * 100)}
        href="/crm/families"
        animate={ready}
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
