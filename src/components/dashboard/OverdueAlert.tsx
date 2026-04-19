"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useInvoices } from "@/hooks/data";
import { DASHBOARD_TENANT_ID } from "./constants";
import { formatUsdFromCents } from "./dashboardFormat";

export function OverdueAlert() {
  const tenantId = DASHBOARD_TENANT_ID;

  const invoiceParams = useMemo(
    () => ({
      tenantId,
      page: { mode: "offset" as const, page: 1, pageSize: 200 },
    }),
    [tenantId],
  );

  const { data: invData } = useInvoices(invoiceParams);

  const { overdueCount, overdueAmount } = useMemo(() => {
    const invoices = invData?.items ?? [];
    const overdueCount = invoices.filter((i) => i.status === "overdue").length;
    const overdueAmount = invoices
      .filter((i) => i.status === "overdue")
      .reduce((acc, i) => acc + (i.amount_cents ?? 0), 0);
    return { overdueCount, overdueAmount };
  }, [invData]);

  if (overdueCount === 0) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-xl border px-4 py-3"
      style={{
        borderColor: "rgba(239,68,68,0.4)",
        background: "rgba(239,68,68,0.07)",
      }}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-red-300">
          {overdueCount} overdue invoice{overdueCount !== 1 ? "s" : ""}
        </p>
        <p className="mt-0.5 text-xs text-[var(--z-muted)]">
          {formatUsdFromCents(overdueAmount)} outstanding past due date.{" "}
          <Link
            href="/invoices?status=overdue"
            className="font-semibold text-red-300 underline underline-offset-2 hover:text-red-200"
          >
            Review now →
          </Link>
        </p>
      </div>
    </div>
  );
}
