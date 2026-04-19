import Link from "next/link";
import type { ReportDefinitionSummary } from "@/lib/reports/types";

export type ReportListProps = {
  reports: ReportDefinitionSummary[];
};

export function ReportList({ reports }: ReportListProps) {
  if (reports.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          No reports registered
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          Add report definitions to <code>src/lib/reports/definitions.ts</code>.
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {reports.map((r) => (
        <Link
          key={r.id}
          href={`/reports/${r.id}`}
          className="group rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 hover:border-[#00ff88]/40 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold text-[var(--z-fg)] group-hover:text-[#00ff88]">
              {r.name}
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] border border-[var(--z-border)] rounded-full px-2 py-0.5">
              {r.id}
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--z-muted)] line-clamp-3">
            {r.description}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--z-muted)]">
            <span>{r.parameters.length} parameter{r.parameters.length === 1 ? "" : "s"}</span>
            <span aria-hidden>·</span>
            <span className="text-[#00ff88]/80 group-hover:text-[#00ff88]">
              Run report →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
