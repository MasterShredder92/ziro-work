import type { InventoryMaintenance } from "@/lib/inventory/types";

export type MaintenanceListProps = {
  maintenance: InventoryMaintenance[];
  emptyMessage?: string;
  maxRows?: number;
  showItem?: boolean;
};

function formatDate(date: string | null): string {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return date;
  }
}

function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function MaintenanceList({
  maintenance,
  emptyMessage = "No maintenance records yet.",
  maxRows,
  showItem,
}: MaintenanceListProps) {
  if (maintenance.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]">
        {emptyMessage}
      </div>
    );
  }

  const rows =
    typeof maxRows === "number" ? maintenance.slice(0, maxRows) : maintenance;

  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--z-border)] text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
          <tr>
            {showItem ? (
              <th className="px-4 py-2 font-semibold">Item</th>
            ) : null}
            <th className="px-4 py-2 font-semibold">Summary</th>
            <th className="px-4 py-2 font-semibold">Kind</th>
            <th className="px-4 py-2 font-semibold">Status</th>
            <th className="px-4 py-2 font-semibold">Scheduled</th>
            <th className="px-4 py-2 font-semibold">Completed</th>
            <th className="px-4 py-2 font-semibold text-right">Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr
              key={m.id}
              className="border-b border-[var(--z-border)] last:border-b-0"
            >
              {showItem ? (
                <td className="px-4 py-2 text-[var(--z-fg)]">{m.item_id}</td>
              ) : null}
              <td className="px-4 py-2 text-[var(--z-fg)]">{m.summary}</td>
              <td className="px-4 py-2 text-[var(--z-muted)]">
                {m.kind.replace(/_/g, " ")}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    m.status === "completed"
                      ? "text-[#c4f036] bg-[#c4f036]/10 border-[#c4f036]/30"
                      : m.status === "in_progress"
                        ? "text-sky-300 bg-sky-400/10 border-sky-400/30"
                        : m.status === "cancelled"
                          ? "text-[var(--z-muted)] bg-white/5 border-[var(--z-border)]"
                          : "text-amber-300 bg-amber-400/10 border-amber-400/30"
                  }`}
                >
                  {m.status.replace(/_/g, " ")}
                </span>
              </td>
              <td className="px-4 py-2 text-[var(--z-muted)]">
                {formatDate(m.scheduled_for)}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted)]">
                {formatDate(m.completed_at)}
              </td>
              <td className="px-4 py-2 text-right text-[var(--z-muted)]">
                {formatCurrency(m.cost)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
