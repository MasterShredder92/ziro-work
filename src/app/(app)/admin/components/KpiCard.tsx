import type { ReactNode } from "react";

export interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: {
    direction: "up" | "down" | "flat";
    value: string;
  };
  icon?: ReactNode;
  accent?: "default" | "success" | "warning" | "danger";
}

const accentColor: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  default: "var(--z-accent)",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
};

const trendColor: Record<"up" | "down" | "flat", string> = {
  up: "#22c55e",
  down: "#ef4444",
  flat: "var(--z-muted)",
};

const trendArrow: Record<"up" | "down" | "flat", string> = {
  up: "▲",
  down: "▼",
  flat: "—",
};

export function KpiCard({
  label,
  value,
  sublabel,
  trend,
  icon,
  accent = "default",
}: KpiCardProps) {
  return (
    <div
      className="relative rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 transition-colors hover:border-[var(--z-border-2)]"
      style={{ borderTopColor: accentColor[accent], borderTopWidth: 2 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            {label}
          </div>
          <div className="mt-2 truncate text-2xl font-bold text-[var(--z-fg)] sm:text-3xl">
            {value}
          </div>
          {sublabel ? (
            <div className="mt-1 text-xs text-[var(--z-muted)]">{sublabel}</div>
          ) : null}
        </div>
        {icon ? (
          <div className="shrink-0 text-[var(--z-muted)]">{icon}</div>
        ) : null}
      </div>
      {trend ? (
        <div
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
          style={{ color: trendColor[trend.direction] }}
        >
          <span>{trendArrow[trend.direction]}</span>
          <span>{trend.value}</span>
        </div>
      ) : null}
    </div>
  );
}
