"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

type Metrics = {
  overdueCount: number;
  outstandingCents: number;
};

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function OverdueBanner() {
  const [m, setM] = useState<Metrics | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/metrics", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.overdueCount !== undefined) setM({ overdueCount: json.overdueCount, outstandingCents: json.outstandingCents });
      })
      .catch(() => null);
  }, []);

  if (!m || m.overdueCount === 0) return null;

  return (
    <Link
      href="/invoices?status=overdue"
      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-150 hover:-translate-y-px"
      style={{
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.35)",
        boxShadow: "0 0 24px rgba(239,68,68,0.12), inset 0 1px 0 var(--z-kpi-inset)",
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: "rgba(239,68,68,0.18)", color: "var(--z-danger)" }}
      >
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: "var(--z-danger)" }}>
          {m.overdueCount} overdue invoice{m.overdueCount !== 1 ? "s" : ""}
        </p>
        <p className="text-xs" style={{ color: "var(--z-fg-secondary)" }}>
          {usd(m.outstandingCents)} outstanding — action required
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "var(--z-danger)" }} />
    </Link>
  );
}
