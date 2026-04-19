"use client";

import { Columns2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CRMListBulkResource } from "./crm-bulk-delete";
import {
  CRMListBulkChrome,
} from "./crm-list-bulk-chrome";
import {
  CRMListSelectionProvider,
  CRM_SELECT_COLUMN_KEY,
  SelectAllHeaderCheckbox,
} from "./crm-list-selection";
import { TableShell, type TableShellProps } from "./table-shell";

const VIS_KEY = "columnVisibility";

function storageKey(tableId: string): string {
  return `crm:${tableId}:${VIS_KEY}`;
}

function defaultVisibility(keys: string[]): Record<string, boolean> {
  return Object.fromEntries(keys.map((k) => [k, true])) as Record<
    string,
    boolean
  >;
}

function loadVisibility(
  tableId: string,
  keys: string[],
): Record<string, boolean> {
  const base = defaultVisibility(keys);
  if (typeof window === "undefined") return base;
  try {
    const raw = localStorage.getItem(storageKey(tableId));
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out = { ...base };
    for (const k of keys) {
      if (typeof parsed[k] === "boolean") out[k] = parsed[k]!;
    }
    const anyOn = keys.some((k) => out[k] !== false);
    return anyOn ? out : base;
  } catch {
    return base;
  }
}

export function saveColumnVisibility(
  tableId: string,
  vis: Record<string, boolean>,
): void {
  try {
    localStorage.setItem(storageKey(tableId), JSON.stringify(vis));
  } catch {
    /* ignore */
  }
}

export function useColumnVisibility(tableId: string, columnKeys: string[]) {
  const sig = JSON.stringify(columnKeys);
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() =>
    defaultVisibility(columnKeys),
  );

  useLayoutEffect(() => {
    setVisibility(loadVisibility(tableId, columnKeys));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, sig]);

  const resetVisibility = useCallback(() => {
    const fresh = defaultVisibility(columnKeys);
    setVisibility(fresh);
    try {
      localStorage.removeItem(storageKey(tableId));
    } catch {
      /* ignore */
    }
  }, [tableId, columnKeys]);

  return { visibility, setVisibility, resetVisibility };
}

export function ColumnVisibilityMenu({
  columnKeys,
  labels,
  visibility,
  onChange,
  onReset,
}: {
  columnKeys: string[];
  labels: string[];
  visibility: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = (key: string) => {
    const next = { ...visibility, [key]: !visibility[key] };
    const visibleCount = columnKeys.filter((k) => next[k] !== false).length;
    if (visibleCount === 0) return;
    onChange(next);
  };

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] px-2.5 py-1.5 text-xs font-semibold text-[var(--z-fg,#f0f0f0)] hover:bg-white/5"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Columns2 className="h-3.5 w-3.5 text-[var(--z-muted,#909098)]" aria-hidden />
        Columns
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Column visibility"
          className="absolute right-0 z-50 mt-1 w-56 rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] py-2 shadow-lg"
        >
          <div className="max-h-64 overflow-y-auto px-2">
            {columnKeys
              .map((key, i) => ({ key, i, label: labels[i] ?? key }))
              .filter(({ key }) => key !== CRM_SELECT_COLUMN_KEY)
              .map(({ key, i, label }) => {
                const checked = visibility[key] !== false;
                return (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--z-fg,#e8e8e8)] hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(key)}
                      className="rounded border-[var(--z-border,#1c1c1e)] bg-[#0a0a0c]"
                    />
                    <span className="truncate">{label || `Column ${i + 1}`}</span>
                  </label>
                );
              })}
          </div>
          <div className="mt-1 border-t border-[var(--z-border,#1c1c1e)] px-2 pt-2">
            <button
              type="button"
              onClick={() => {
                onReset();
                setOpen(false);
              }}
              className="w-full rounded px-2 py-1.5 text-left text-xs font-medium text-[var(--z-muted,#909098)] hover:bg-white/5 hover:text-[var(--z-fg,#f0f0f0)]"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** List pages: columns menu + persisted visibility + TableShell. */
export function CRMListTableSection({
  tableId,
  columnKeys,
  headers,
  children,
  stickyHeader,
  showColumnReset,
  bulk,
  sortKey,
  sortDir,
  sortableColumnKeys,
  onSortColumn,
}: {
  tableId: string;
  columnKeys: string[];
  headers: TableShellProps["headers"];
  children: ReactNode;
  stickyHeader?: boolean;
  showColumnReset?: boolean;
  bulk?: {
    rowIds: string[];
    rowLabelsById: Record<string, string>;
    resource: CRMListBulkResource;
    buildExport: (visibility: Record<string, boolean>) => void;
  };
  sortKey?: string | null;
  sortDir?: "asc" | "desc" | null;
  sortableColumnKeys?: readonly string[];
  onSortColumn?: (columnKey: string) => void;
}) {
  const { visibility, setVisibility, resetVisibility } = useColumnVisibility(
    tableId,
    columnKeys,
  );

  const toolbar = (
    <div className="mb-2 flex justify-end">
      <ColumnVisibilityMenu
        columnKeys={columnKeys}
        labels={headers.map((h) => h)}
        visibility={visibility}
        onChange={(next) => {
          setVisibility(next);
          saveColumnVisibility(tableId, next);
        }}
        onReset={resetVisibility}
      />
    </div>
  );

  const table = (
    <TableShell
      tableId={tableId}
      columnKeys={columnKeys}
      headers={headers}
      visibleColumns={visibility}
      stickyHeader={stickyHeader}
      showColumnReset={showColumnReset}
      bulkSelectHeader={bulk ? <SelectAllHeaderCheckbox /> : undefined}
      sortKey={sortKey}
      sortDir={sortDir}
      sortableColumnKeys={sortableColumnKeys}
      onSortColumn={onSortColumn}
    >
      {children}
    </TableShell>
  );

  if (!bulk) {
    return (
      <>
        {toolbar}
        {table}
      </>
    );
  }

  return (
    <CRMListSelectionProvider
      key={[...bulk.rowIds].sort().join("\u001e")}
      rowIds={bulk.rowIds}
      rowLabelsById={bulk.rowLabelsById}
    >
      <CRMListBulkChrome
        resource={bulk.resource}
        buildExport={bulk.buildExport}
        visibility={visibility}
      />
      {toolbar}
      {table}
    </CRMListSelectionProvider>
  );
}
