import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils/cn";

export type DataTableColumn<TRow> = {
  id: string;
  header: ReactNode;
  align?: "left" | "center" | "right";
  width?: string | number;
  cell: (row: TRow, rowIndex: number) => ReactNode;
};

export type DataTableProps<TRow> = {
  columns: Array<DataTableColumn<TRow>>;
  rows: TRow[];
  getRowKey: (row: TRow, rowIndex: number) => string;
  emptyMessage?: ReactNode;
  maxHeight?: number;
  dense?: boolean;
  caption?: ReactNode;
};

export function DataTable<TRow>({
  columns,
  rows,
  getRowKey,
  emptyMessage = "No records found.",
  maxHeight = 420,
  dense = false,
  caption,
}: DataTableProps<TRow>) {
  const gridTemplateColumns = columns
    .map((c) => (c.width ? String(c.width) : "minmax(0, 1fr)"))
    .join(" ");

  return (
    <div
      className={cn(
        "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden",
      )}
    >
      {caption ? (
        <div className="px-4 py-2 text-xs text-[var(--z-muted)] border-b border-[var(--z-border)]">
          {caption}
        </div>
      ) : null}
      <div
        className="grid sticky top-0 z-10 bg-[color-mix(in_oklab,var(--z-surface),white_2%)] border-b border-[var(--z-border)]"
        style={{ gridTemplateColumns }}
      >
        {columns.map((c) => (
          <div
            key={c.id}
            className={cn(
              "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]",
              c.align === "center" && "text-center",
              c.align === "right" && "text-right",
            )}
          >
            {c.header}
          </div>
        ))}
      </div>
      <div
        className="overflow-auto"
        style={{ maxHeight }}
      >
        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-[var(--z-muted)]">
            {emptyMessage}
          </div>
        ) : (
          rows.map((row, index) => (
            <div
              key={getRowKey(row, index)}
              className={cn(
                "grid border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/[0.02] transition-colors",
              )}
              style={{ gridTemplateColumns }}
            >
              {columns.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "px-4 text-sm text-[var(--z-fg)] flex items-center min-w-0",
                    dense ? "py-2" : "py-3",
                    c.align === "center" && "justify-center text-center",
                    c.align === "right" && "justify-end text-right",
                  )}
                >
                  <div className="truncate w-full">{c.cell(row, index)}</div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
