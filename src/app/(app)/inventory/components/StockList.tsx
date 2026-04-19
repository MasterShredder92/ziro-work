import type { InventoryStock } from "@/lib/inventory/types";

export type StockListProps = {
  stock: InventoryStock[];
  emptyMessage?: string;
};

function formatDate(date: string | null): string {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return date;
  }
}

export function StockList({
  stock,
  emptyMessage = "No stock locations on file.",
}: StockListProps) {
  if (stock.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--z-border)] text-left text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
          <tr>
            <th className="px-4 py-2 font-semibold">Location</th>
            <th className="px-4 py-2 font-semibold">Room</th>
            <th className="px-4 py-2 font-semibold">Shelf</th>
            <th className="px-4 py-2 font-semibold text-right">On hand</th>
            <th className="px-4 py-2 font-semibold text-right">Reserved</th>
            <th className="px-4 py-2 font-semibold">Last count</th>
          </tr>
        </thead>
        <tbody>
          {stock.map((s) => (
            <tr
              key={s.id}
              className="border-b border-[var(--z-border)] last:border-b-0"
            >
              <td className="px-4 py-2 text-[var(--z-fg)]">
                {s.location_id ?? "—"}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted)]">
                {s.room_id ?? "—"}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted)]">
                {s.shelf_label ?? "—"}
              </td>
              <td className="px-4 py-2 text-right font-semibold text-[var(--z-fg)]">
                {s.quantity_on_hand}
              </td>
              <td className="px-4 py-2 text-right text-[var(--z-muted)]">
                {s.quantity_reserved}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted)]">
                {formatDate(s.last_counted_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
