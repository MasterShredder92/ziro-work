"use client";

import { useEffect, useState } from "react";

type DashboardMetrics = {
  collectedCents: number;
  totalInvoicedCents: number;
  outstandingCents: number;
  scheduledCents: number;
  projectedMonthlyCents: number;
  overdueCount: number;
};

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** SVG donut segment helper */
function DonutSegment({
  pct,
  offset,
  color,
  r = 62,
  animated,
}: {
  pct: number;
  offset: number;
  color: string;
  r?: number;
  animated: boolean;
}) {
  const circumference = 2 * Math.PI * r;
  const dash = animated ? (pct / 100) * circumference : 0;
  const gap = circumference - dash;
  const rotation = -90 + (offset / 100) * 360;
  return (
    <circle
      cx="76"
      cy="76"
      r={r}
      fill="none"
      stroke={color}
      strokeWidth="11"
      strokeDasharray={`${dash} ${gap}`}
      strokeLinecap="round"
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "76px 76px",
        transition: "stroke-dasharray 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
        filter: `drop-shadow(0 0 8px ${color}aa)`,
      }}
    />
  );
}

export function RevenueChart() {
  const [m, setM] = useState<DashboardMetrics | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/metrics", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.collectedCents !== undefined) {
          setM(json as DashboardMetrics);
          setTimeout(() => setAnimated(true), 150);
        }
      })
      .catch(() => null);
  }, []);

  const month = new Date().toLocaleString("default", { month: "long" });

  if (!m) {
    return (
      <div
        className="h-full min-h-[220px] rounded-2xl"
        style={{
          background: "var(--z-surface)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.6s infinite",
          border: "1px solid var(--z-border)",
        }}
      />
    );
  }

  const total = m.totalInvoicedCents || 1;
  const collectedPct = Math.round((m.collectedCents / total) * 100);
  const outstandingPct = Math.round((m.outstandingCents / total) * 100);
  const scheduledPct = Math.max(0, 100 - collectedPct - outstandingPct);

  const segments = [
    { pct: collectedPct, color: "#c4f036", label: "Collected", value: usd(m.collectedCents) },
    { pct: outstandingPct, color: "#ef4444", label: "Outstanding", value: usd(m.outstandingCents) },
    { pct: scheduledPct, color: "#d97706", label: "Scheduled", value: usd(m.scheduledCents) },
  ];

  let cumulative = 0;
  const segmentsWithOffset = segments.map((s) => {
    const seg = { ...s, offset: cumulative };
    cumulative += s.pct;
    return seg;
  });

  return (
    <div className="flex h-full flex-col gap-5">
      {/* Header */}
      <div>
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--z-muted)" }}>
          Revenue Breakdown · {month}
        </p>
        <p className="mt-1 text-lg font-extrabold" style={{ color: "var(--z-fg)" }}>
          {usd(m.totalInvoicedCents)}
          <span className="ml-2 text-xs font-normal" style={{ color: "var(--z-muted)" }}>
            total invoiced
          </span>
        </p>
      </div>

      {/* Donut + legend */}
      <div className="flex items-center gap-6">
        {/* SVG donut — 152px */}
        <div className="relative shrink-0">
          <svg width="152" height="152" viewBox="0 0 152 152">
            {/* Outer glow ring */}
            <circle
              cx="76"
              cy="76"
              r="70"
              fill="none"
              stroke="var(--z-accent-bg)"
              strokeWidth="1"
            />
            {/* Track */}
            <circle
              cx="76"
              cy="76"
              r="62"
              fill="none"
              stroke="var(--z-border)"
              strokeWidth="11"
            />
            {segmentsWithOffset.map((s) =>
              s.pct > 0 ? (
                <DonutSegment
                  key={s.label}
                  pct={s.pct}
                  offset={s.offset}
                  color={s.color}
                  animated={animated}
                />
              ) : null,
            )}
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p
              className="text-2xl font-extrabold leading-none"
              style={{ color: "var(--z-accent-readable)", textShadow: "0 0 20px var(--z-accent-glow)" }}
            >
              {collectedPct}%
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "var(--z-muted)" }}>
              collected
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {segments.map((s) => (
            <div key={s.label}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }}
                  />
                  <span className="truncate text-xs font-medium" style={{ color: "var(--z-muted)" }}>
                    {s.label}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-bold" style={{ color: "var(--z-fg)" }}>
                  {s.value}
                </span>
              </div>
              {/* Mini fill bar per segment */}
              <div className="h-1 rounded-full overflow-hidden ml-4" style={{ background: "var(--z-border)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: animated ? `${s.pct}%` : "0%",
                    background: s.color,
                    boxShadow: `0 0 8px ${s.color}66`,
                    transition: "width 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
            </div>
          ))}

          {/* Projected next month */}
          <div
            className="mt-1 rounded-xl px-3 py-2"
            style={{
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.28)",
            }}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--z-fg-secondary)" }}>
              Next Month Projected
            </p>
            <p className="text-sm font-extrabold mt-0.5" style={{ color: "var(--z-fg)" }}>
              {usd(m.projectedMonthlyCents)}
            </p>
          </div>
        </div>
      </div>

      {/* Collection progress bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--z-muted)" }}>
            Collection Rate
          </span>
          <span className="text-[10px] font-bold" style={{ color: "var(--z-accent)" }}>
            {collectedPct}%
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ background: "var(--z-border)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: animated ? `${collectedPct}%` : "0%",
              background: "linear-gradient(90deg, var(--z-accent-dim, #00cc6a), var(--z-accent))",
              boxShadow: "0 0 14px var(--z-accent)",
              transition: "width 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
