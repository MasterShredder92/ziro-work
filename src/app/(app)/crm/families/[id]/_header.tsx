"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/* ─── Types ──────────────────────────────────────────────── */
type FamilyHeader = {
  id: string;
  name: string;
  status: string | null;
  balance: number;
  billing_status: string;
};

/* ─── Helpers ────────────────────────────────────────────── */
function formatBalance(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
  return amount < 0 ? `-${formatted}` : formatted;
}

function familyDisplayName(name: string): string {
  const trimmed = name.trim();
  // If it already ends with "Family", show as-is; otherwise append it
  if (/family$/i.test(trimmed)) return trimmed;
  return `The ${trimmed} Family`;
}

/* ─── Status badge ───────────────────────────────────────── */
function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();
  let cls =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ";
  if (s === "active") {
    cls += "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300";
  } else if (s === "inactive" || s === "archived") {
    cls += "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  } else if (s === "paused") {
    cls += "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300";
  } else {
    cls += "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  }
  return <span className={cls}>{status ?? "Unknown"}</span>;
}

/* ─── Balance badge ──────────────────────────────────────── */
function BalanceBadge({ balance }: { balance: number }) {
  const isOverdue = balance > 0;
  const isCredit = balance < 0;

  let cls =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ";
  if (isOverdue) {
    cls += "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400";
  } else if (isCredit) {
    cls += "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400";
  } else {
    cls += "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  }

  const label = isOverdue ? "Owes" : isCredit ? "Credit" : "Paid";

  return (
    <span className={cls}>
      {label} {formatBalance(balance)}
    </span>
  );
}

/* ─── Skeleton ───────────────────────────────────────────── */
function HeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-2 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="h-9 w-64 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-6 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export function FamilyAccountHeader() {
  const params = useParams<{ id: string }>();
  const familyId = params?.id ?? "";

  const [family, setFamily] = useState<FamilyHeader | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/crm/families/${familyId}`, {
          headers: { "x-tenant-id": DEFAULT_TENANT_ID },
        });
        if (!res.ok) throw new Error(`Family not found (${res.status})`);
        const json = await res.json();
        const f = json.data ?? json;
        setFamily({
          id: f.id,
          name: f.name,
          status: f.status ?? null,
          balance: f.balance ?? 0,
          billing_status: f.billing_status ?? "unknown",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load family");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [familyId]);

  if (loading) return <HeaderSkeleton />;

  if (error || !family) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error ?? "Family not found."}
      </div>
    );
  }

  return (
    <div>
      {/* ── Breadcrumbs ─────────────────────────────────────── */}
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"
      >
        <Link
          href="/crm/families"
          className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Families
        </Link>
        <span aria-hidden className="select-none text-zinc-300 dark:text-zinc-600">
          /
        </span>
        <span
          className="font-medium text-zinc-900 dark:text-zinc-100"
          aria-current="page"
        >
          {family.name}
        </span>
      </nav>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Family name */}
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          {familyDisplayName(family.name)}
        </h1>

        {/* Right: status + balance */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 pt-0.5">
          <StatusBadge status={family.status} />
          <BalanceBadge balance={family.balance} />
        </div>
      </div>
    </div>
  );
}
