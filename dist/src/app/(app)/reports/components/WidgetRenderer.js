import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { runQuery } from "@/lib/reports/queryEngine";
import { computeKpi } from "@/lib/reports/kpis";
import { BarChart } from "./charts/BarChart";
import { LineChart } from "./charts/LineChart";
import { PieChart, DonutChart } from "./charts/PieChart";
import { FunnelChart } from "./charts/FunnelChart";
import { KPIBlock } from "./charts/KPIBlock";
import { PivotTable } from "./charts/PivotTable";
export async function WidgetRenderer({ widget, tenantId }) {
    var _a, _b;
    if (widget.widgetType === "kpi") {
        const kpi = widget.kpiKey
            ? await computeKpi(widget.kpiKey, tenantId).catch(() => null)
            : null;
        if (!kpi) {
            return _jsx(WidgetFrame, { widget: widget, children: "No KPI bound to this widget." });
        }
        return (_jsx(WidgetFrame, { widget: widget, children: _jsx(KPIBlock, { kpi: kpi }) }));
    }
    if (!widget.query) {
        return (_jsx(WidgetFrame, { widget: widget, children: "No query configured for this widget." }));
    }
    const result = await runQuery(widget.query, tenantId).catch(() => null);
    if (!result) {
        return _jsx(WidgetFrame, { widget: widget, children: "Failed to load widget data." });
    }
    switch (widget.widgetType) {
        case "table":
        case "pivot":
            return (_jsx(WidgetFrame, { widget: widget, children: _jsx(PivotTable, { columns: result.columns, rows: result.rows }) }));
        case "line_chart":
            return (_jsx(WidgetFrame, { widget: widget, children: _jsx(LineChart, { series: toSeries(result.columns, result.rows) }) }));
        case "bar_chart":
            return (_jsx(WidgetFrame, { widget: widget, children: _jsx(BarChart, { series: toSeries(result.columns, result.rows) }) }));
        case "pie_chart": {
            const series = toSeries(result.columns, result.rows)[0];
            return (_jsx(WidgetFrame, { widget: widget, children: series ? (_jsx(PieChart, { series: series })) : (_jsx(EmptyText, { children: "No categorical series." })) }));
        }
        case "donut_chart": {
            const series = toSeries(result.columns, result.rows)[0];
            return (_jsx(WidgetFrame, { widget: widget, children: series ? (_jsx(DonutChart, { series: series })) : (_jsx(EmptyText, { children: "No categorical series." })) }));
        }
        case "funnel_chart": {
            const stages = (_b = (_a = toSeries(result.columns, result.rows)[0]) === null || _a === void 0 ? void 0 : _a.data.map((p) => ({ label: String(p.x), value: p.y }))) !== null && _b !== void 0 ? _b : [];
            return (_jsx(WidgetFrame, { widget: widget, children: _jsx(FunnelChart, { stages: stages }) }));
        }
        default:
            return (_jsxs(WidgetFrame, { widget: widget, children: ["Unsupported widget type: ", widget.widgetType] }));
    }
}
function toSeries(columns, rows) {
    if (!columns.length)
        return [];
    const [xCol, ...rest] = columns;
    if (rest.length === 0)
        return [];
    return rest.map((col) => {
        var _a;
        return ({
            id: col.key,
            label: (_a = col.label) !== null && _a !== void 0 ? _a : col.key,
            data: rows.map((r) => {
                var _a;
                return ({
                    x: String((_a = r[xCol.key]) !== null && _a !== void 0 ? _a : ""),
                    y: typeof r[col.key] === "number" ? r[col.key] : 0,
                });
            }),
        });
    });
}
function WidgetFrame({ widget, children, }) {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [widget.title ? (_jsx("div", { className: "mb-3 text-xs font-semibold text-[var(--z-fg)]", children: widget.title })) : null, children] }));
}
function EmptyText({ children }) {
    return _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: children });
}
