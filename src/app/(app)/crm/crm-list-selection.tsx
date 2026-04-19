"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export const CRM_SELECT_COLUMN_KEY = "__select__";

type SelectionCtx = {
  selectedIds: ReadonlySet<string>;
  toggleRow: (id: string) => void;
  selectAllVisible: () => void;
  clearSelection: () => void;
  rowLabelsById: Record<string, string>;
  rowIds: string[];
};

const Ctx = createContext<SelectionCtx | null>(null);

export function useCRMListSelection(): SelectionCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCRMListSelection outside provider");
  return v;
}

export function CRMListSelectionProvider({
  rowIds,
  rowLabelsById,
  children,
}: {
  rowIds: string[];
  rowLabelsById: Record<string, string>;
  children: ReactNode;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const allOn =
        rowIds.length > 0 && rowIds.every((id) => prev.has(id));
      if (allOn) return new Set();
      return new Set(rowIds);
    });
  }, [rowIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const value = useMemo(
    () =>
      ({
        selectedIds,
        toggleRow,
        selectAllVisible,
        clearSelection,
        rowLabelsById,
        rowIds,
      }) satisfies SelectionCtx,
    [
      selectedIds,
      toggleRow,
      selectAllVisible,
      clearSelection,
      rowLabelsById,
      rowIds,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function BulkSelectCell({ rowId }: { rowId: string }) {
  const { selectedIds, toggleRow, rowLabelsById } = useCRMListSelection();
  const checked = selectedIds.has(rowId);
  const label = rowLabelsById[rowId] ?? rowId;
  return (
    <td className="w-12 min-w-[48px] max-w-[48px] px-2 py-2 align-middle">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => toggleRow(rowId)}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Select ${label}`}
        className="rounded border-[var(--z-border,#1c1c1e)] bg-[#0a0a0c]"
      />
    </td>
  );
}

export function SelectAllHeaderCheckbox() {
  const { selectedIds, selectAllVisible, rowIds } = useCRMListSelection();
  const ref = useRef<HTMLInputElement>(null);

  const visibleSelected = rowIds.filter((id) => selectedIds.has(id));
  const allSelected =
    rowIds.length > 0 && visibleSelected.length === rowIds.length;
  const mixed =
    visibleSelected.length > 0 && visibleSelected.length < rowIds.length;

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);

  const ariaChecked: boolean | "mixed" = mixed
    ? "mixed"
    : allSelected
      ? true
      : false;

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={allSelected}
      onChange={selectAllVisible}
      onClick={(e) => e.stopPropagation()}
      aria-checked={ariaChecked}
      aria-label="Select all visible rows"
      className="rounded border-[var(--z-border,#1c1c1e)] bg-[#0a0a0c]"
    />
  );
}
