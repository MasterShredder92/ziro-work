import Link from "next/link";
import type { AutomationRun } from "@/lib/automation/workflows/types";

export type RunListProps = {
  runs: AutomationRun[];
  showWorkflow?: boolean;
  emptyMessage?: string;
};

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(ms: number | null | undefined): string {
  if (typeof ms !== "number" || ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 1000)}s`;
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  let cn =
    "border-[var(--z-border)] bg-white/5 text-[var(--z-muted)]";
  if (s === "succeeded") cn = "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
  else if (s === "running") cn = "border-sky-500/30 bg-sky-500/15 text-sky-300";
  else if (s === "queued") cn = "border-[var(--z-border)] bg-white/5 text-[var(--z-muted)]";
  else if (s === "failed") cn = "border-rose-500/30 bg-rose-500/15 text-rose-300";
  else if (s === "dead_letter") cn = "border-red-500/40 bg-red-500/20 text-red-300";
  else if (s === "cancelled") cn = "border-amber-500/30 bg-amber-500/15 text-amber-300";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cn}`}>
      {status}
    </span>
  );
}

export function RunList({
  runs,
  showWorkflow = false,
  emptyMessage = "No runs yet.",
}: RunListProps) {
  if (!runs.length) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center">
        <div className="text-sm text-[var(--z-muted)]">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
      <table className="w-full text-sm">
        <thead className="bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)] text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
          <tr>
            <th className="text-left font-semibold px-4 py-2">Run</th>
            {showWorkflow ? (
              <th className="text-left font-semibold px-4 py-2">Workflow</th>
            ) : null}
            <th className="text-left font-semibold px-4 py-2">Trigger</th>
            <th className="text-left font-semibold px-4 py-2">Status</th>
            <th className="text-left font-semibold px-4 py-2">Attempt</th>
            <th className="text-left font-semibold px-4 py-2">Duration</th>
            <th className="text-right font-semibold px-4 py-2">Started</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr
              key={run.id}
              className="border-t border-[var(--z-border)] hover:bg-white/5"
            >
              <td className="px-4 py-3 font-mono text-xs">
                <Link
                  href={`/automation/runs/${run.id}`}
                  className="text-[var(--z-fg)] hover:text-[var(--z-accent)]"
                >
                  {run.id.slice(0, 10)}
                </Link>
              </td>
              {showWorkflow ? (
                <td className="px-4 py-3 font-mono text-xs text-[var(--z-muted)]">
                  {run.workflow_id.slice(0, 10)}
                </td>
              ) : null}
              <td className="px-4 py-3 text-[var(--z-muted)] font-mono text-xs">
                {run.trigger_type}
              </td>
              <td className="px-4 py-3">
                <StatusPill status={run.status} />
              </td>
              <td className="px-4 py-3 text-[var(--z-muted)] text-xs">
                {run.attempt}/{run.max_attempts}
              </td>
              <td className="px-4 py-3 text-[var(--z-muted)] text-xs">
                {formatDuration(run.duration_ms)}
              </td>
              <td className="px-4 py-3 text-right text-[var(--z-muted)] text-xs">
                {formatRelative(run.started_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
