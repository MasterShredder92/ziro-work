"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, } from "react";
export const CRM_SELECT_COLUMN_KEY = "__select__";
const Ctx = createContext(null);
export function useCRMListSelection() {
    const v = useContext(Ctx);
    if (!v)
        throw new Error("useCRMListSelection outside provider");
    return v;
}
export function CRMListSelectionProvider({ rowIds, rowLabelsById, children, }) {
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const toggleRow = useCallback((id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    }, []);
    const selectAllVisible = useCallback(() => {
        setSelectedIds((prev) => {
            const allOn = rowIds.length > 0 && rowIds.every((id) => prev.has(id));
            if (allOn)
                return new Set();
            return new Set(rowIds);
        });
    }, [rowIds]);
    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);
    const value = useMemo(() => ({
        selectedIds,
        toggleRow,
        selectAllVisible,
        clearSelection,
        rowLabelsById,
        rowIds,
    }), [
        selectedIds,
        toggleRow,
        selectAllVisible,
        clearSelection,
        rowLabelsById,
        rowIds,
    ]);
    return _jsx(Ctx.Provider, { value: value, children: children });
}
export function BulkSelectCell({ rowId }) {
    var _a;
    const { selectedIds, toggleRow, rowLabelsById } = useCRMListSelection();
    const checked = selectedIds.has(rowId);
    const label = (_a = rowLabelsById[rowId]) !== null && _a !== void 0 ? _a : rowId;
    return (_jsx("td", { className: "w-12 min-w-[48px] max-w-[48px] px-2 py-2 align-middle", children: _jsx("input", { type: "checkbox", checked: checked, onChange: () => toggleRow(rowId), onClick: (e) => e.stopPropagation(), "aria-label": `Select ${label}`, className: "rounded border-[var(--z-border,#1c1c1e)] bg-[#0a0a0c]" }) }));
}
export function SelectAllHeaderCheckbox() {
    const { selectedIds, selectAllVisible, rowIds } = useCRMListSelection();
    const ref = useRef(null);
    const visibleSelected = rowIds.filter((id) => selectedIds.has(id));
    const allSelected = rowIds.length > 0 && visibleSelected.length === rowIds.length;
    const mixed = visibleSelected.length > 0 && visibleSelected.length < rowIds.length;
    useEffect(() => {
        if (ref.current)
            ref.current.indeterminate = mixed;
    }, [mixed]);
    const ariaChecked = mixed
        ? "mixed"
        : allSelected
            ? true
            : false;
    return (_jsx("input", { ref: ref, type: "checkbox", checked: allSelected, onChange: selectAllVisible, onClick: (e) => e.stopPropagation(), "aria-checked": ariaChecked, "aria-label": "Select all visible rows", className: "rounded border-[var(--z-border,#1c1c1e)] bg-[#0a0a0c]" }));
}
