import type { InventoryCheckout } from "@/lib/inventory/types";

export type CheckoutListProps = {
  checkouts: InventoryCheckout[];
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

function isOverdue(c: InventoryCheckout): boolean {
  if (c.returned_at) return false;
  if (!c.due_date) return false;
  try {
    return new Date(c.due_date).getTime() < Date.now();
  } catch {
    return false;
  }
}

export function CheckoutList({
  checkouts,
  emptyMessage = "No checkouts recorded yet.",
  maxRows,
  showItem,
}: CheckoutListProps) {
  if (checkouts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]">
        {emptyMessage}
      </div>
    );
  }

  const rows =
    typeof maxRows === "number" ? checkouts.slice(0, maxRows) : checkouts;

  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--z-border)] text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
          <tr>
            {showItem ? (
              <th className="px-4 py-2 font-semibold">Item</th>
            ) : null}
            <th className="px-4 py-2 font-semibold">Profile</th>
            <th className="px-4 py-2 font-semibold">Checked out</th>
            <th className="px-4 py-2 font-semibold">Due</th>
            <th className="px-4 py-2 font-semibold">Returned</th>
            <th className="px-4 py-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const overdue = isOverdue(c);
            return (
              <tr
                key={c.id}
                className="border-b border-[var(--z-border)] last:border-b-0"
              >
                {showItem ? (
                  <td className="px-4 py-2 text-[var(--z-fg)]">{c.item_id}</td>
                ) : null}
                <td className="px-4 py-2 text-[var(--z-muted)]">
                  {c.profile_id}
                </td>
                <td className="px-4 py-2 text-[var(--z-muted)]">
                  {formatDate(c.checked_out_at)}
                </td>
                <td
                  className={`px-4 py-2 ${
                    overdue ? "text-rose-300" : "text-[var(--z-muted)]"
                  }`}
                >
                  {formatDate(c.due_date)}
                </td>
                <td className="px-4 py-2 text-[var(--z-muted)]">
                  {formatDate(c.returned_at)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      overdue
                        ? "text-rose-300 bg-rose-400/10 border-rose-400/30"
                        : c.returned_at
                          ? "text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/30"
                          : "text-sky-300 bg-sky-400/10 border-sky-400/30"
                    }`}
                  >
                    {overdue ? "overdue" : c.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
