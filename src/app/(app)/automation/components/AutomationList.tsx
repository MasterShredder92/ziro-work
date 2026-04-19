import Link from "next/link";
import type { AutomationRule } from "@/lib/automation/types";

export type AutomationListProps = {
  rules: AutomationRule[];
  emptyMessage?: string;
};

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AutomationList({
  rules,
  emptyMessage = "No automations yet. Create one to get started.",
}: AutomationListProps) {
  if (!rules.length) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          No automations
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
            <th className="text-right font-semibold px-4 py-2">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr
              key={rule.id}
              className="border-t border-[var(--z-border)] hover:bg-white/5"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/automation/${rule.id}`}
                  className="font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]"
                >
                  {rule.name}
                </Link>
                {rule.description ? (
                  <div className="text-xs text-[var(--z-muted)] mt-0.5 line-clamp-1">
                    {rule.description}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3 text-[var(--z-muted)] font-mono text-xs">
                {rule.trigger?.event ?? "—"}
              </td>
              <td className="px-4 py-3 text-[var(--z-muted)] text-xs">
                {rule.actions.length} action{rule.actions.length === 1 ? "" : "s"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    rule.enabled
                      ? "inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300"
                      : "inline-flex items-center rounded-full border border-[var(--z-border)] bg-white/5 px-2 py-0.5 text-[11px] font-medium text-[var(--z-muted)]"
                  }
                >
                  {rule.enabled ? "Enabled" : "Disabled"}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-[var(--z-muted)] text-xs">
                {formatRelative(rule.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
