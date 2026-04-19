import Link from "next/link";
import type { SavedReport } from "@/lib/reports/types";

export type SavedReportListProps = {
  reports: SavedReport[];
};

export function SavedReportList({ reports }: SavedReportListProps) {
  if (reports.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center text-sm text-[var(--z-muted)]">
        No saved reports yet. Head to the{" "}
        <Link href="/reports/builder" className="text-[#00ff88] underline">
          report builder
        </Link>{" "}
        to create one.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {reports.map((r) => (
        <Link
          key={r.id}
          href={`/reports/custom/${r.id}`}
          className="group rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 hover:border-[#00ff88]/40 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold text-[var(--z-fg)] group-hover:text-[#00ff88]">
              {r.name}
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] border border-[var(--z-border)] rounded-full px-2 py-0.5">
              {r.status}
            </span>
          </div>
          {r.description ? (
            <p className="mt-2 text-xs text-[var(--z-muted)] line-clamp-3">{r.description}</p>
          ) : null}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--z-muted)]">
            <span>{r.source}</span>
            {r.tags.length > 0 ? (
              <>
                <span aria-hidden>·</span>
                <span>{r.tags.slice(0, 3).join(", ")}</span>
              </>
            ) : null}
            <span className="ml-auto text-[#00ff88]/80 group-hover:text-[#00ff88]">
              Open →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
