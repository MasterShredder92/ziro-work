"use client";

import type { Teacher } from "@/lib/data/models";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils/cn";

export type TeacherStatsProps = {
  teacher: Teacher;
  capacity: number;
  payrollImpact: number;
  rosterCount: number;
  className?: string;
};

function formatUsd(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function TeacherStats({ teacher, capacity, payrollImpact, rosterCount, className }: TeacherStatsProps) {
  const minutes = teacher.weekly_capacity_minutes ?? "—";

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      <Card variant="elevated" padding="md" radius="md" shadow="sm">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">Roster</div>
        <div className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--z-fg)]">{rosterCount}</div>
        <div className="mt-1 text-xs text-[var(--z-muted)]">Active assignments</div>
      </Card>
      <Card variant="elevated" padding="md" radius="md" shadow="sm">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">Capacity</div>
        <div className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--z-accent)]">{capacity}</div>
        <div className="mt-1 text-xs text-[var(--z-muted)]">Seat ceiling</div>
      </Card>
      <Card variant="elevated" padding="md" radius="md" shadow="sm">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">Weekly minutes</div>
        <div className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--z-fg)]">{minutes}</div>
        <div className="mt-1 text-xs text-[var(--z-muted)]">Teaching bandwidth</div>
      </Card>
      <Card variant="elevated" padding="md" radius="md" shadow="sm">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">Payroll impact</div>
        <div className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--z-warning)]">
          {formatUsd(payrollImpact)}
        </div>
        <div className="mt-1 text-xs text-[var(--z-muted)]">Heuristic load</div>
      </Card>
    </div>
  );
}
