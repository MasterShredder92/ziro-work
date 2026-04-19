import type { KpiValue } from "@/lib/reports/types";
import { formatNumber } from "./shared";

export type KPIBlockProps = {
  kpi: KpiValue;
};

export function KPIBlock({ kpi }: KPIBlockProps) {
  const value = formatValue(kpi.value, kpi.format);
  const trend = kpi.deltaPct;
  const isPositive =
    kpi.direction === "higher_is_better"
      ? (trend ?? 0) > 0
      : kpi.direction === "lower_is_better"
        ? (trend ?? 0) < 0
        : true;

  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {kpi.label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className="text-2xl font-semibold text-[var(--z-fg)]">{value}</div>
        {trend !== null && trend !== undefined ? (
          <div
            className={`text-xs font-medium ${
              isPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </div>
        ) : null}
      </div>
      {kpi.sublabel ? (
        <div className="mt-1 text-[11px] text-[var(--z-muted)]">{kpi.sublabel}</div>
      ) : null}
    </div>
  );
}

function formatValue(value: number, format: KpiValue["format"]): string {
  switch (format) {
    case "currency":
      return `$${formatNumber(value / 100)}`;
    case "percent":
      return `${value}%`;
    case "text":
      return String(value);
    case "number":
    default:
      return formatNumber(value);
  }
}
