"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StripePortalButton } from "@/components/billing/StripePortalButton";
import { cn } from "@/components/ui/utils";

export type BillingSummaryCardProps = {
  planName: string;
  renewalDate: string;
  status: "active" | "trialing" | "past_due" | "canceled";
  className?: string;
};

function statusVariant(status: BillingSummaryCardProps["status"]): "success" | "warning" | "danger" | "neutral" {
  if (status === "active") return "success";
  if (status === "trialing") return "neutral";
  if (status === "past_due") return "danger";
  return "neutral";
}

export function BillingSummaryCard({ planName, renewalDate, status, className }: BillingSummaryCardProps) {
  return (
    <Card
      variant="elevated"
      padding="lg"
      radius="lg"
      shadow="sm"
      className={cn(
        "border-[color-mix(in_oklab,var(--z-accent-color),transparent_78%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent-color),transparent_88%),0_0_32px_color-mix(in_oklab,var(--z-accent-color),transparent_92%)]",
        className,
      )}
    >
      <div className="flex flex-col gap-[var(--z-space-4)] sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-[var(--z-space-2)]">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">Current plan</div>
          <div className="text-xl font-extrabold tracking-tight text-[var(--z-fg)]">{planName}</div>
          <div className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_25%)]">
            Renews <span className="font-semibold text-[var(--z-accent-color)]">{renewalDate}</span>
          </div>
          <Badge variant={statusVariant(status)} active={status === "active" || status === "trialing"}>
            {status.replace("_", " ")}
          </Badge>
        </div>
        <div className="flex shrink-0 flex-col gap-[var(--z-space-3)] sm:items-end">
          <StripePortalButton label="Manage billing" />
        </div>
      </div>
    </Card>
  );
}
