import type { KpiValue } from "@/lib/reports/types";
import { KPIBlock } from "./charts/KPIBlock";

export type KpiSnapshotGridProps = {
  values: KpiValue[];
};

export function KpiSnapshotGrid({ values }: KpiSnapshotGridProps) {
  if (!values || values.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center text-sm text-[var(--z-muted)]">
        No KPI snapshot available yet.
      </div>
    );
  }
  const byCategory = new Map<string, KpiValue[]>();
  for (const v of values) {
    const list = byCategory.get(v.category) ?? [];
    list.push(v);
    byCategory.set(v.category, list);
  }

  return (
    <div className="space-y-6">
      {Array.from(byCategory.entries()).map(([category, list]) => (
        <section key={category} className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            {category}
            <span className="text-[var(--z-muted)]/60">·</span>
            <span className="text-[var(--z-muted)]/60">{list.length} metrics</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {list.map((v) => (
              <KPIBlock key={v.key} kpi={v} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
