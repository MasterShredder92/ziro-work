import Link from "next/link";
import type { InventoryItemSummary } from "@/lib/inventory/types";

export type InventoryListProps = {
  items: InventoryItemSummary[];
  emptyMessage?: string;
  maxRows?: number;
};

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatusPill({ status }: { status: string }) {
  const color =
    status === "available"
      ? "text-[#c4f036] bg-[#c4f036]/10 border-[#c4f036]/30"
      : status === "in_use"
        ? "text-sky-300 bg-sky-400/10 border-sky-400/30"
        : status === "maintenance"
          ? "text-amber-300 bg-amber-400/10 border-amber-400/30"
          : status === "lost"
            ? "text-rose-300 bg-rose-400/10 border-rose-400/30"
            : "text-[var(--z-muted)] bg-white/5 border-[var(--z-border)]";
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${color}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function InventoryList({
  items,
  emptyMessage = "No inventory items yet.",
  maxRows,
}: InventoryListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]">
        {emptyMessage}
      </div>
    );
  }

  const rows = typeof maxRows === "number" ? items.slice(0, maxRows) : items;

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {rows.map((s) => {
        const item = s.item;
        return (
          <Link
            key={item.id}
            href={`/inventory/${item.id}`}
            className="block rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 hover:border-[#c4f036]/40 hover:bg-[color-mix(in_oklab,var(--z-surface),var(--z-accent)_4%)] transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
                  {item.name}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
                  {item.category} · {item.condition}
                </div>
              </div>
              <StatusPill status={item.status} />
            </div>
            {item.brand || item.model ? (
              <p className="mt-2 line-clamp-1 text-xs text-[var(--z-muted)]">
                {[item.brand, item.model].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            <div className="mt-3 grid grid-cols-4 gap-2 text-[11px] text-[var(--z-muted)]">
              <div>
                <div className="text-[10px] uppercase">Qty</div>
                <div className="font-semibold text-[var(--z-fg)]">
                  {s.totalOnHand}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase">Checkouts</div>
                <div className="font-semibold text-[var(--z-fg)]">
                  {s.activeCheckouts}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase">Overdue</div>
                <div
                  className={`font-semibold ${
                    s.overdueCheckouts > 0
                      ? "text-rose-300"
                      : "text-[var(--z-fg)]"
                  }`}
                >
                  {s.overdueCheckouts}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase">Maint.</div>
                <div
                  className={`font-semibold ${
                    s.openMaintenance > 0
                      ? "text-amber-300"
                      : "text-[var(--z-fg)]"
                  }`}
                >
                  {s.openMaintenance}
                </div>
              </div>
            </div>
            {item.purchase_price != null ? (
              <div className="mt-3 flex items-center justify-between text-xs text-[var(--z-muted)]">
                <span>
                  Purchase{" "}
                  <span className="font-semibold text-[var(--z-fg)]">
                    {formatCurrency(item.purchase_price)}
                  </span>
                </span>
                <span>
                  Current{" "}
                  <span className="font-semibold text-[var(--z-fg)]">
                    {formatCurrency(item.current_value)}
                  </span>
                </span>
              </div>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
