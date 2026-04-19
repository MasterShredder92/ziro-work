import { runQuery } from "@/lib/reports/queryEngine";
import { computeKpi } from "@/lib/reports/kpis";
import type { ReportWidget } from "@/lib/reports/types";
import { BarChart } from "./charts/BarChart";
import { LineChart } from "./charts/LineChart";
import { PieChart, DonutChart } from "./charts/PieChart";
import { FunnelChart } from "./charts/FunnelChart";
import { KPIBlock } from "./charts/KPIBlock";
import { PivotTable } from "./charts/PivotTable";
import type { Series } from "./charts/shared";

export type WidgetRendererProps = {
  widget: ReportWidget;
  tenantId: string;
};

export async function WidgetRenderer({ widget, tenantId }: WidgetRendererProps) {
  if (widget.widgetType === "kpi") {
    const kpi = widget.kpiKey
      ? await computeKpi(widget.kpiKey, tenantId).catch(() => null)
      : null;
    if (!kpi) {
      return <WidgetFrame widget={widget}>No KPI bound to this widget.</WidgetFrame>;
    }
    return (
      <WidgetFrame widget={widget}>
        <KPIBlock kpi={kpi} />
      </WidgetFrame>
    );
  }

  if (!widget.query) {
    return (
      <WidgetFrame widget={widget}>No query configured for this widget.</WidgetFrame>
    );
  }

  const result = await runQuery(widget.query, tenantId).catch(() => null);
  if (!result) {
    return <WidgetFrame widget={widget}>Failed to load widget data.</WidgetFrame>;
  }

  switch (widget.widgetType) {
    case "table":
    case "pivot":
      return (
        <WidgetFrame widget={widget}>
          <PivotTable columns={result.columns} rows={result.rows} />
        </WidgetFrame>
      );
    case "line_chart":
      return (
        <WidgetFrame widget={widget}>
          <LineChart series={toSeries(result.columns, result.rows)} />
        </WidgetFrame>
      );
    case "bar_chart":
      return (
        <WidgetFrame widget={widget}>
          <BarChart series={toSeries(result.columns, result.rows)} />
        </WidgetFrame>
      );
    case "pie_chart": {
      const series = toSeries(result.columns, result.rows)[0];
      return (
        <WidgetFrame widget={widget}>
          {series ? (
            <PieChart series={series} />
          ) : (
            <EmptyText>No categorical series.</EmptyText>
          )}
        </WidgetFrame>
      );
    }
    case "donut_chart": {
      const series = toSeries(result.columns, result.rows)[0];
      return (
        <WidgetFrame widget={widget}>
          {series ? (
            <DonutChart series={series} />
          ) : (
            <EmptyText>No categorical series.</EmptyText>
          )}
        </WidgetFrame>
      );
    }
    case "funnel_chart": {
      const stages = toSeries(result.columns, result.rows)[0]?.data.map(
        (p) => ({ label: String(p.x), value: p.y }),
      ) ?? [];
      return (
        <WidgetFrame widget={widget}>
          <FunnelChart stages={stages} />
        </WidgetFrame>
      );
    }
    default:
      return (
        <WidgetFrame widget={widget}>
          Unsupported widget type: {widget.widgetType}
        </WidgetFrame>
      );
  }
}

function toSeries(
  columns: ReportWidget extends unknown ? import("@/lib/reports/types").ReportColumn[] : never,
  rows: Array<Record<string, unknown>>,
): Series[] {
  if (!columns.length) return [];
  const [xCol, ...rest] = columns;
  if (rest.length === 0) return [];
  return rest.map((col) => ({
    id: col.key,
    label: col.label ?? col.key,
    data: rows.map((r) => ({
      x: String(r[xCol.key] ?? ""),
      y: typeof r[col.key] === "number" ? (r[col.key] as number) : 0,
    })),
  }));
}

function WidgetFrame({
  widget,
  children,
}: {
  widget: ReportWidget;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      {widget.title ? (
        <div className="mb-3 text-xs font-semibold text-[var(--z-fg)]">
          {widget.title}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-[var(--z-muted)]">{children}</div>;
}
