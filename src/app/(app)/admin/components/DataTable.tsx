import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  accessor: (row: T) => ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  emptyLabel?: string;
  caption?: string;
  maxRows?: number;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyLabel = "No records yet.",
  caption,
  maxRows,
}: DataTableProps<T>) {
  const visible = typeof maxRows === "number" ? rows.slice(0, maxRows) : rows;

  return (
    <div className="overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
      {caption ? (
        <div className="border-b border-[var(--z-border)] px-4 py-3 text-sm font-semibold text-[var(--z-fg)]">
          {caption}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[color-mix(in_oklab,var(--z-surface),white_2%)]">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  style={c.width ? { width: c.width } : undefined}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)] ${
                    c.align === "right"
                      ? "text-right"
                      : c.align === "center"
                        ? "text-center"
                        : "text-left"
                  }`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-[var(--z-muted)]"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              visible.map((row, idx) => (
                <tr
                  key={getRowKey(row, idx)}
                  className="border-t border-[var(--z-border)] hover:bg-white/[0.02]"
                >
                  {columns.map((c) => (
                    <td
                      key={c.id}
                      className={`px-4 py-3 text-[var(--z-fg)] ${
                        c.align === "right"
                          ? "text-right"
                          : c.align === "center"
                            ? "text-center"
                            : "text-left"
                      }`}
                    >
                      {c.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {typeof maxRows === "number" && rows.length > maxRows ? (
        <div className="border-t border-[var(--z-border)] px-4 py-2 text-xs text-[var(--z-muted)]">
          Showing {maxRows} of {rows.length}
        </div>
      ) : null}
    </div>
  );
}
