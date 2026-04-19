import type { InventoryItemSurface } from "@/lib/inventory/types";

export type InventoryDetailProps = {
  surface: InventoryItemSurface;
};

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className="text-sm text-[var(--z-fg)] text-right max-w-[60%] break-words">
        {value ?? "—"}
      </div>
    </div>
  );
}

export function InventoryDetail({ surface }: InventoryDetailProps) {
  const item = surface.item;
  const dep = surface.depreciation;

  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <header className="flex flex-col gap-2 border-b border-[var(--z-border)] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            {item.category}
          </div>
          <h1 className="mt-1 text-xl font-semibold text-[var(--z-fg)]">
            {item.name}
          </h1>
          {item.description ? (
            <p className="mt-1 text-sm text-[var(--z-muted)]">
              {item.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            {item.status}
          </span>
          <span className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            {item.condition}
          </span>
        </div>
      </header>

      <div className="grid gap-6 px-5 py-4 md:grid-cols-2">
        <section className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Asset details
          </h2>
          <DetailRow label="Brand" value={item.brand} />
          <DetailRow label="Model" value={item.model} />
          <DetailRow label="Serial" value={item.serial_number} />
          <DetailRow label="SKU" value={item.sku} />
          <DetailRow label="Quantity" value={item.quantity} />
          <DetailRow label="Location" value={item.location_id ?? "—"} />
          {item.tags.length > 0 ? (
            <DetailRow
              label="Tags"
              value={
                <span className="flex flex-wrap justify-end gap-1">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--z-muted)]"
                    >
                      {t}
                    </span>
                  ))}
                </span>
              }
            />
          ) : null}
        </section>

        <section className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Value & depreciation
          </h2>
          <DetailRow
            label="Purchase price"
            value={formatCurrency(item.purchase_price)}
          />
          <DetailRow
            label="Salvage value"
            value={formatCurrency(item.salvage_value)}
          />
          <DetailRow
            label="Current value"
            value={formatCurrency(dep.currentValue)}
          />
          <DetailRow
            label="Accumulated"
            value={formatCurrency(dep.accumulated)}
          />
          <DetailRow
            label="% Remaining"
            value={`${dep.percentRemaining}%`}
          />
          <DetailRow label="Method" value={dep.method} />
          <DetailRow
            label="Useful life"
            value={`${dep.usefulLifeMonths} mo`}
          />
        </section>
      </div>

      {item.notes ? (
        <footer className="border-t border-[var(--z-border)] px-5 py-3 text-sm text-[var(--z-muted)]">
          {item.notes}
        </footer>
      ) : null}
    </div>
  );
}
