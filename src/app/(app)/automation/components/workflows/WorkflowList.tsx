import Link from "next/link";
import type { AutomationWorkflow } from "@/lib/automation/workflows/types";

export type WorkflowListProps = {
  workflows: AutomationWorkflow[];
  canWrite?: boolean;
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

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const className =
    s === "active"
      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
      : s === "paused"
        ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
        : s === "archived"
          ? "border-[var(--z-border)] bg-white/5 text-[var(--z-muted)]"
          : "border-[var(--z-border)] bg-white/5 text-[var(--z-muted)]";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`}
    >
      {status}
    </span>
  );
}

export function WorkflowList({
  workflows,
  emptyMessage = "No workflows yet. Create one to get started.",
}: WorkflowListProps) {
  if (!workflows.length) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          No workflows
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
      <table className="w-full text-sm">
        <thead className="bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)] text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
          <tr>
            <th className="text-left font-semibold px-4 py-2">Name</th>
            <th className="text-left font-semibold px-4 py-2">Trigger</th>
            <th className="text-left font-semibold px-4 py-2">Actions</th>
            <th className="text-left font-semibold px-4 py-2">Status</th>
            <th className="text-left font-semibold px-4 py-2">Last run</th>
            <th className="text-right font-semibold px-4 py-2">Updated</th>
          </tr>
        </thead>
        <tbody>
          {workflows.map((wf) => (
            <tr
              key={wf.id}
              className="border-t border-[var(--z-border)] hover:bg-white/5"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/automation/workflows/${wf.id}`}
                  className="font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]"
                >
                  {wf.name}
                </Link>
                {wf.description ? (
                  <div className="text-xs text-[var(--z-muted)] mt-0.5 line-clamp-1">
                    {wf.description}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3 text-[var(--z-muted)] font-mono text-xs">
                {wf.trigger?.type ?? "—"}
              </td>
              <td className="px-4 py-3 text-[var(--z-muted)] text-xs">
                {wf.actions.length}
              </td>
              <td className="px-4 py-3">
                <StatusPill status={wf.status} />
              </td>
              <td className="px-4 py-3 text-[var(--z-muted)] text-xs">
                {wf.last_run_status ? (
                  <div>
                    <span className="font-mono">{wf.last_run_status}</span>
                    <div className="text-[10px] opacity-70">
                      {formatRelative(wf.last_run_at)}
                    </div>
                  </div>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-right text-[var(--z-muted)] text-xs">
                {formatRelative(wf.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
