"use client";

import { Card } from "@/components/ui/Card";
import {
  MOCK_USAGE_DEFAULTS,
  type BillingUsageSnapshot,
} from "@/lib/billing/mockUsage";
import { cn } from "@/components/ui/utils";

export type BillingUsageCardProps = {
  usage?: BillingUsageSnapshot | null;
  className?: string;
};

function UsageMeter({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="space-y-[var(--z-space-2)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">{label}</div>
        <div className="text-xs font-semibold tabular-nums text-[var(--z-fg)]">
          {value}
          {unit ? ` ${unit}` : ""}
        </div>
      </div>
    </div>
  );
}

export function BillingUsageCard({ usage, className }: BillingUsageCardProps) {
  const snap = usage ?? MOCK_USAGE_DEFAULTS;

  return (
    <Card variant="default" padding="lg" radius="lg" className={cn("space-y-[var(--z-space-6)]", className)}>
      <div>
        <div className="text-sm font-extrabold text-[var(--z-fg)]">Workspace usage</div>
        <p className="mt-1 text-xs text-[var(--z-muted)]">Live workspace activity overview.</p>
      </div>
      <UsageMeter label="Active students" value={snap.activeStudents} unit="" />
      <UsageMeter label="Active teachers" value={snap.activeTeachers} unit="" />
      <UsageMeter label="Automations" value={snap.automations} unit="flows" />
      <UsageMeter label="Storage" value={snap.storageMB} unit="MB" />
    </Card>
  );
}
