import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils/cn";

export type KpiCardProps = {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  accent?: "default" | "success" | "warning" | "danger";
  icon?: ReactNode;
};

const accentClass: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  default: "text-[var(--z-fg)]",
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-red-400",
};

const trendClass: Record<NonNullable<KpiCardProps["trend"]>, string> = {
  up: "text-emerald-400",
  down: "text-red-400",
  flat: "text-[var(--z-muted)]",
};

const trendGlyph: Record<NonNullable<KpiCardProps["trend"]>, string> = {
  up: "▲",
  down: "▼",
  flat: "■",
};

export function KpiCard({
  label,
  value,
  sublabel,
  trend,
  trendLabel,
  accent = "default",
  icon,
}: KpiCardProps) {
  return (
    <Card variant="elevated" padding="md" radius="lg">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            {label}
          </div>
          <div
            className={cn(
              "text-2xl font-semibold tabular-nums truncate",
              accentClass[accent],
            )}
          >
            {value}
          </div>
          {sublabel ? (
            <div className="text-xs text-[var(--z-muted)] truncate">
              {sublabel}
            </div>
          ) : null}
          {trend && trendLabel ? (
            <div className={cn("text-xs font-medium", trendClass[trend])}>
              <span className="mr-1">{trendGlyph[trend]}</span>
              {trendLabel}
            </div>
          ) : null}
        </div>
        {icon ? (
          <div className="shrink-0 text-[var(--z-muted)]">{icon}</div>
        ) : null}
      </div>
    </Card>
  );
}
