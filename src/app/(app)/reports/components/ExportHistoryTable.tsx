import type { ExportJob } from "@/lib/reports/types";

export type ExportHistoryTableProps = {
  jobs: ExportJob[];
  tenantId: string;
};

export function ExportHistoryTable({ jobs, tenantId }: ExportHistoryTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center text-sm text-[var(--z-muted)]">
        No export jobs yet.
      </div>
    );
  }
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
      <table className="w-full text-left text-xs">
        <thead className="text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
          <tr>
            <th className="border-b border-[var(--z-border)] px-3 py-2">Filename</th>
            <th className="border-b border-[var(--z-border)] px-3 py-2">Format</th>
            <th className="border-b border-[var(--z-border)] px-3 py-2">Status</th>
            <th className="border-b border-[var(--z-border)] px-3 py-2">Size</th>
            <th className="border-b border-[var(--z-border)] px-3 py-2">Created</th>
            <th className="border-b border-[var(--z-border)] px-3 py-2">Report</th>
            <th className="border-b border-[var(--z-border)] px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr
              key={j.id}
              className="border-b border-[var(--z-border)] last:border-b-0"
            >
              <td className="px-3 py-2 font-mono text-[11px] text-[var(--z-fg)]">
                {j.filename}
              </td>
              <td className="px-3 py-2 uppercase text-[var(--z-muted)]">{j.format}</td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] ${
                    j.status === "completed"
                      ? "border-emerald-400/40 text-emerald-300"
                      : j.status === "failed"
                        ? "border-rose-400/40 text-rose-300"
                        : "border-[var(--z-border)] text-[var(--z-muted)]"
                  }`}
                >
                  {j.status}
                </span>
              </td>
              <td className="px-3 py-2 text-[var(--z-muted)]">
                {formatSize(j.sizeBytes)}
              </td>
              <td className="px-3 py-2 text-[var(--z-muted)]">
                {new Date(j.createdAt).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-[var(--z-muted)]">{j.reportId ?? "—"}</td>
              <td className="px-3 py-2">
                {j.status === "completed" ? (
                  <a
                    href={`/reports/api/exports/${j.id}?tenantId=${tenantId}&download=1`}
                    className="rounded-md border border-[var(--z-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--z-fg)] hover:bg-white/5"
                  >
                    Download
                  </a>
                ) : j.error ? (
                  <span className="text-[11px] text-rose-300">{j.error}</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
