import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { listKpiDefinitions } from "@/lib/reports/kpis";
import type { WidgetType } from "@/lib/reports/types";
import { BarChart } from "../components/charts/BarChart";
import { LineChart } from "../components/charts/LineChart";
import { PieChart, DonutChart } from "../components/charts/PieChart";
import { FunnelChart } from "../components/charts/FunnelChart";

export const dynamic = "force-dynamic";

const DEMO_SERIES = [
  { id: "a", label: "Series A", data: [
    { x: "Jan", y: 12 }, { x: "Feb", y: 18 }, { x: "Mar", y: 9 },
    { x: "Apr", y: 22 }, { x: "May", y: 30 }, { x: "Jun", y: 25 },
  ]},
  { id: "b", label: "Series B", data: [
    { x: "Jan", y: 8 }, { x: "Feb", y: 14 }, { x: "Mar", y: 16 },
    { x: "Apr", y: 11 }, { x: "May", y: 19 }, { x: "Jun", y: 28 },
  ]},
];

const DEMO_CATEGORIES = {
  id: "c",
  label: "Distribution",
  data: [
    { x: "Piano", y: 42 },
    { x: "Guitar", y: 28 },
    { x: "Voice", y: 18 },
    { x: "Violin", y: 12 },
  ],
};

const DEMO_FUNNEL = [
  { label: "Leads", value: 1200 },
  { label: "Scheduled", value: 800 },
  { label: "Trial booked", value: 520 },
  { label: "Enrolled", value: 280 },
];

const WIDGET_META: Array<{ type: WidgetType; name: string; description: string }> = [
  { type: "kpi", name: "KPI block", description: "Single metric with trend." },
  { type: "line_chart", name: "Line chart", description: "Trend over a date bucket." },
  { type: "bar_chart", name: "Bar chart", description: "Group comparison or stacked totals." },
  { type: "pie_chart", name: "Pie chart", description: "Part-to-whole split." },
  { type: "donut_chart", name: "Donut chart", description: "Pie with a center total." },
  { type: "funnel_chart", name: "Funnel", description: "Stage-by-stage conversion." },
  { type: "table", name: "Table", description: "Raw rows with formatted cells." },
  { type: "pivot", name: "Pivot table", description: "Cross-tab with aggregates." },
];

export default async function WidgetLibraryPage() {
  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await requirePermission("reports.read")();
  } catch {
    session = null;
  }
  const tenantId = session?.tenantId ?? DEFAULT_TENANT_ID;
  if (session) {
    try {
      await assertTenantAccess(tenantId);
    } catch {
      session = null;
    }
  }

  const kpis = listKpiDefinitions();

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Reporting OS
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          Widget library
        </h1>
        <p className="text-sm text-[var(--z-muted)] max-w-[720px]">
          Reusable visualization blocks. Each widget can be bound to a KPI or
          query inside a saved report.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--z-fg)]">
          Available widget types
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {WIDGET_META.map((w) => (
            <div
              key={w.type}
              className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4"
            >
              <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                {w.type}
              </div>
              <div className="mt-1 text-sm font-semibold text-[var(--z-fg)]">
                {w.name}
              </div>
              <div className="mt-1 text-[11px] text-[var(--z-muted)]">
                {w.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">Visualization previews</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <LineChart series={DEMO_SERIES} title="Line chart" />
          </div>
          <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <BarChart series={DEMO_SERIES} title="Bar chart" />
          </div>
          <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <PieChart series={DEMO_CATEGORIES} title="Pie chart" />
          </div>
          <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <DonutChart series={DEMO_CATEGORIES} title="Donut chart" />
          </div>
          <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 md:col-span-2">
            <FunnelChart stages={DEMO_FUNNEL} title="Conversion funnel" />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">Available KPIs</h2>
        <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
              <tr>
                <th className="border-b border-[var(--z-border)] px-3 py-2">Key</th>
                <th className="border-b border-[var(--z-border)] px-3 py-2">Category</th>
                <th className="border-b border-[var(--z-border)] px-3 py-2">Format</th>
                <th className="border-b border-[var(--z-border)] px-3 py-2">Direction</th>
                <th className="border-b border-[var(--z-border)] px-3 py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((k) => (
                <tr key={k.key} className="border-b border-[var(--z-border)] last:border-b-0">
                  <td className="px-3 py-2 font-mono text-[11px] text-[var(--z-fg)]">
                    {k.key}
                  </td>
                  <td className="px-3 py-2 text-[var(--z-muted)]">{k.category}</td>
                  <td className="px-3 py-2 text-[var(--z-muted)]">{k.format}</td>
                  <td className="px-3 py-2 text-[var(--z-muted)]">{k.direction}</td>
                  <td className="px-3 py-2 text-[var(--z-muted)]">{k.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
