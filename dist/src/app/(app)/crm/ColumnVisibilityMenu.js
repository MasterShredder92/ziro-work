"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Columns2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, } from "react";
import { CRMListBulkChrome, } from "./crm-list-bulk-chrome";
import { CRMListSelectionProvider, CRM_SELECT_COLUMN_KEY, SelectAllHeaderCheckbox, } from "./crm-list-selection";
import { TableShell } from "./table-shell";
const VIS_KEY = "columnVisibility";
function storageKey(tableId) {
    return `crm:${tableId}:${VIS_KEY}`;
}
function defaultVisibility(keys) {
    return Object.fromEntries(keys.map((k) => [k, true]));
}
function loadVisibility(tableId, keys) {
    const base = defaultVisibility(keys);
    if (typeof window === "undefined")
        return base;
    try {
        const raw = localStorage.getItem(storageKey(tableId));
        if (!raw)
            return base;
        const parsed = JSON.parse(raw);
        const out = Object.assign({}, base);
        for (const k of keys) {
            if (typeof parsed[k] === "boolean")
                out[k] = parsed[k];
        }
        const anyOn = keys.some((k) => out[k] !== false);
        return anyOn ? out : base;
    }
    catch (_a) {
        return base;
    }
}
export function saveColumnVisibility(tableId, vis) {
    try {
        localStorage.setItem(storageKey(tableId), JSON.stringify(vis));
    }
    catch (_a) {
        /* ignore */
    }
}
export function useColumnVisibility(tableId, columnKeys) {
    const sig = JSON.stringify(columnKeys);
    const [visibility, setVisibility] = useState(() => defaultVisibility(columnKeys));
    useLayoutEffect(() => {
        setVisibility(loadVisibility(tableId, columnKeys));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableId, sig]);
    const resetVisibility = useCallback(() => {
        const fresh = defaultVisibility(columnKeys);
        setVisibility(fresh);
        try {
            localStorage.removeItem(storageKey(tableId));
        }
        catch (_a) {
            /* ignore */
        }
    }, [tableId, columnKeys]);
    return { visibility, setVisibility, resetVisibility };
}
export function ColumnVisibilityMenu({ columnKeys, labels, visibility, onChange, onReset, }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const close = (e) => {
            var _a;
            if (!((_a = rootRef.current) === null || _a === void 0 ? void 0 : _a.contains(e.target)))
                setOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [open]);
    const toggle = (key) => {
        const next = Object.assign(Object.assign({}, visibility), { [key]: !visibility[key] });
        const visibleCount = columnKeys.filter((k) => next[k] !== false).length;
        if (visibleCount === 0)
            return;
        onChange(next);
    };
    return (_jsxs("div", { ref: rootRef, className: "relative inline-block text-left", children: [_jsxs("button", { type: "button", onClick: () => setOpen((o) => !o), className: "inline-flex items-center gap-1.5 rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] px-2.5 py-1.5 text-xs font-semibold text-[var(--z-fg,#f0f0f0)] hover:bg-white/5", "aria-expanded": open, "aria-haspopup": "dialog", children: [_jsx(Columns2, { className: "h-3.5 w-3.5 text-[var(--z-muted,#909098)]", "aria-hidden": true }), "Columns"] }), open ? (_jsxs("div", { role: "dialog", "aria-label": "Column visibility", className: "absolute right-0 z-50 mt-1 w-56 rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] py-2 shadow-lg", children: [_jsx("div", { className: "max-h-64 overflow-y-auto px-2", children: columnKeys
                            .map((key, i) => { var _a; return ({ key, i, label: (_a = labels[i]) !== null && _a !== void 0 ? _a : key }); })
                            .filter(({ key }) => key !== CRM_SELECT_COLUMN_KEY)
                            .map(({ key, i, label }) => {
                            const checked = visibility[key] !== false;
                            return (_jsxs("label", { className: "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--z-fg,#e8e8e8)] hover:bg-white/5", children: [_jsx("input", { type: "checkbox", checked: checked, onChange: () => toggle(key), className: "rounded border-[var(--z-border,#1c1c1e)] bg-[#0a0a0c]" }), _jsx("span", { className: "truncate", children: label || `Column ${i + 1}` })] }, key));
                        }) }), _jsx("div", { className: "mt-1 border-t border-[var(--z-border,#1c1c1e)] px-2 pt-2", children: _jsx("button", { type: "button", onClick: () => {
                                onReset();
                                setOpen(false);
                            }, className: "w-full rounded px-2 py-1.5 text-left text-xs font-medium text-[var(--z-muted,#909098)] hover:bg-white/5 hover:text-[var(--z-fg,#f0f0f0)]", children: "Reset to defaults" }) })] })) : null] }));
}
/** List pages: columns menu + persisted visibility + TableShell. */
export function CRMListTableSection({ tableId, columnKeys, headers, children, stickyHeader, showColumnReset, bulk, sortKey, sortDir, sortableColumnKeys, onSortColumn, }) {
    const { visibility, setVisibility, resetVisibility } = useColumnVisibility(tableId, columnKeys);
    const toolbar = (_jsx("div", { className: "mb-2 flex justify-end", children: _jsx(ColumnVisibilityMenu, { columnKeys: columnKeys, labels: headers.map((h) => h), visibility: visibility, onChange: (next) => {
                setVisibility(next);
                saveColumnVisibility(tableId, next);
            }, onReset: resetVisibility }) }));
    const table = (_jsx(TableShell, { tableId: tableId, columnKeys: columnKeys, headers: headers, visibleColumns: visibility, stickyHeader: stickyHeader, showColumnReset: showColumnReset, bulkSelectHeader: bulk ? _jsx(SelectAllHeaderCheckbox, {}) : undefined, sortKey: sortKey, sortDir: sortDir, sortableColumnKeys: sortableColumnKeys, onSortColumn: onSortColumn, children: children }));
    if (!bulk) {
        return (_jsxs(_Fragment, { children: [toolbar, table] }));
    }
    return (_jsxs(CRMListSelectionProvider, { rowIds: bulk.rowIds, rowLabelsById: bulk.rowLabelsById, children: [_jsx(CRMListBulkChrome, { resource: bulk.resource, buildExport: bulk.buildExport, visibility: visibility }), toolbar, table] }, [...bulk.rowIds].sort().join("\u001e")));
}
