import type { ReportColumn } from "@/lib/reports/types";

export type PivotTableProps = {
  columns: ReportColumn[];
  rows: Array<Record<string, unknown>>;
  title?: string;
  maxRows?: number;
};

export function PivotTable({
  columns,
  rows,
  title,
  maxRows = 200,
}: PivotTableProps) {
  const displayed = rows.slice(0, maxRows);
  const truncated = rows.length > maxRows;

  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
      {title ? (
        <div className="border-b border-[var(--z-border)] px-4 py-2 text-xs font-semibold text-[var(--z-fg)]">
          {title}
        </div>
      ) : null}
      <div className="max-h-[480px] overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-[var(--z-surface)] text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="border-b border-[var(--z-border)] px-3 py-2 font-semibold"
                  style={{
                    textAlign: col.align ?? "left",
                    width: col.width,
                  }}
                >
                  {col.label ?? col.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="px-3 py-6 text-center text-[var(--z-muted)]"
                >
                  No rows.
                </td>
              </tr>
            ) : (
              displayed.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/5"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-3 py-2 text-[var(--z-fg)]"
                      style={{ textAlign: col.align ?? "left" }}
                    >
                      {formatCell(row[col.key], col)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {truncated ? (
        <div className="border-t border-[var(--z-border)] px-3 py-2 text-[11px] text-[var(--z-muted)]">
          Showing first {maxRows} of {rows.length} rows.
        </div>
      ) : null}
    </div>
  );
}

function formatCell(value: unknown, col: ReportColumn): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    if (col.format === "currency") {
      return `$${(value / 100).toFixed(2)}`;
    }
    if (col.format === "percent") {
      return `${value}%`;
    }
    return String(value);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
