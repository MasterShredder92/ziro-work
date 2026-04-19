"use client";

import type { Teacher } from "@/lib/data/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";

export type TeacherHeaderProps = {
  teacher: Teacher;
  capacity: number;
  payrollImpact: number;
  className?: string;
};

function formatUsd(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function TeacherHeader({ teacher, capacity, payrollImpact, className }: TeacherHeaderProps) {
  return (
    <PageHeader
      className={className}
      title={teacher.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-[var(--z-space-2)]">
          <Badge variant="neutral">{teacher.status}</Badge>
          <Badge variant="success" active>
            Capacity {capacity} seats
          </Badge>
          <Badge variant="warning">Payroll est. {formatUsd(payrollImpact)}</Badge>
        </span>
      }
    />
  );
}
