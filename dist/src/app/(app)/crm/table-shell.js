"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Children, cloneElement, isValidElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, } from "react";
import { NotesPopoverEditor } from "./_components/NotesPopoverEditor";
import { CRM_SELECT_COLUMN_KEY } from "./crm-list-selection";
const MIN_COL_PX = 80;
const MAX_COL_PX = 400;
const DEFAULT_COL_PX = 160;
const SELECT_COL_PX = 48;
function clamp(n) {
    return Math.min(MAX_COL_PX, Math.max(MIN_COL_PX, Math.round(n)));
}
function defaultWidths(count) {
    return Array.from({ length: count }, () => DEFAULT_COL_PX);
}
function deriveColumnKeys(headers, explicit) {
    if (explicit && explicit.length === headers.length)
        return explicit;
    return headers.map((h, i) => {
        const base = h.trim()
            ? h.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase()
            : "col";
        return `${base}_${i}`;
    });
}
function loadStoredWidths(tableId, keys, fallback) {
    if (typeof window === "undefined")
        return fallback;
    try {
        const raw = localStorage.getItem(`crm:${tableId}:columnWidths`);
        if (!raw)
            return fallback;
        const parsed = JSON.parse(raw);
        return keys.map((key, i) => {
            if (key === CRM_SELECT_COLUMN_KEY)
                return SELECT_COL_PX;
            const v = parsed[key];
            return typeof v === "number" && Number.isFinite(v)
                ? clamp(v)
                : fallback[i];
        });
    }
    catch (_a) {
        return fallback;
    }
}
function saveWidths(tableId, keys, widths) {
    try {
        const obj = {};
        keys.forEach((k, i) => {
            if (k === CRM_SELECT_COLUMN_KEY) {
                obj[k] = SELECT_COL_PX;
            }
            else {
                obj[k] = widths[i];
            }
        });
        localStorage.setItem(`crm:${tableId}:columnWidths`, JSON.stringify(obj));
    }
    catch (_a) {
        /* ignore quota / private mode */
    }
}
function filterTrCellsByIndices(children, indices) {
    return Children.map(children, (row) => {
        var _a;
        if (!isValidElement(row))
            return row;
        if (typeof row.type !== "string" || row.type !== "tr")
            return row;
        const rowProps = row.props;
        const cells = Children.toArray((_a = rowProps.children) !== null && _a !== void 0 ? _a : []);
        const picked = indices
            .map((i) => cells[i])
            .filter((c) => c !== undefined && c !== null);
        return cloneElement(row, {}, ...picked);
    });
}
function SaveSpinner() {
    return (_jsx("span", { "aria-hidden": true, className: "h-3.5 w-3.5 shrink-0 animate-spin rounded-full border border-[var(--z-accent,#00ff88)] border-t-transparent" }));
}
export function EditableCell({ rowId, columnKey, label, value, children, className, isEditing, isSaving, startEditing, bindInputProps, selectOptions, notesPopover, }) {
    var _a;
    const inputProps = bindInputProps(rowId, columnKey, `${label}`);
    const isNotesCell = columnKey === "notes";
    const notesPreview = value.length > 60 ? `${value.slice(0, 60).trimEnd()}...` : value;
    return (_jsxs("td", { onDoubleClick: () => startEditing(rowId, columnKey, value), className: `relative ${className !== null && className !== void 0 ? className : ""}`, children: [isEditing ? (_jsxs("div", { className: "flex items-center gap-2", children: [selectOptions ? (_jsx("select", Object.assign({}, inputProps, { children: selectOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) }))) : (_jsx("input", Object.assign({ type: "text" }, inputProps))), isNotesCell && notesPopover ? (_jsx("button", { type: "button", "aria-label": `Expand notes editor for ${label}`, onMouseDown: (event) => event.preventDefault(), onClick: (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            notesPopover.onOpen();
                        }, className: "rounded px-1 text-xs text-[var(--z-muted,#909098)] hover:bg-white/5 hover:text-[var(--z-fg,#f0f0f0)]", children: "\u2197" })) : null, isSaving ? _jsx(SaveSpinner, {}) : null] })) : (_jsx(_Fragment, { children: isNotesCell ? (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { type: "button", onClick: (event) => {
                                event.preventDefault();
                                startEditing(rowId, columnKey, value);
                            }, className: "min-w-0 flex-1 truncate text-left text-[var(--z-muted,#909098)] hover:text-[var(--z-fg,#f0f0f0)]", children: notesPreview || "—" }), notesPopover ? (_jsx("button", { type: "button", "aria-label": `Expand notes editor for ${label}`, onClick: (event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                notesPopover.onOpen();
                            }, className: "rounded px-1 text-xs text-[var(--z-muted,#909098)] hover:bg-white/5 hover:text-[var(--z-fg,#f0f0f0)]", children: "\u2197" })) : null] })) : ((_a = children !== null && children !== void 0 ? children : value) !== null && _a !== void 0 ? _a : "—") })), isNotesCell && (notesPopover === null || notesPopover === void 0 ? void 0 : notesPopover.isOpen) ? (_jsx(NotesPopoverEditor, { value: notesPopover.value, onChange: notesPopover.onChange, onSave: notesPopover.onSave, onCancel: notesPopover.onCancel })) : null] }));
}
export function TableShell({ headers: dataHeaders, columnKeys: columnKeysProp, visibleColumns, bulkSelectHeader, children, stickyHeader = true, tableId, showColumnReset = true, sortKey = null, sortDir = null, sortableColumnKeys, onSortColumn, }) {
    const headerSig = JSON.stringify(dataHeaders);
    const explicitSig = columnKeysProp ? JSON.stringify(columnKeysProp) : "";
    const dataColumnKeys = useMemo(() => deriveColumnKeys(dataHeaders, columnKeysProp), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [headerSig, explicitSig]);
    const fullColumnKeys = useMemo(() => bulkSelectHeader
        ? [CRM_SELECT_COLUMN_KEY, ...dataColumnKeys]
        : dataColumnKeys, [bulkSelectHeader, dataColumnKeys]);
    const fullHeaders = useMemo(() => (bulkSelectHeader ? ["", ...dataHeaders] : dataHeaders), [bulkSelectHeader, dataHeaders]);
    const mergedVisible = useMemo(() => {
        if (!bulkSelectHeader)
            return visibleColumns;
        const out = { [CRM_SELECT_COLUMN_KEY]: true };
        if (!visibleColumns) {
            dataColumnKeys.forEach((k) => {
                out[k] = true;
            });
            return out;
        }
        dataColumnKeys.forEach((k) => {
            out[k] = visibleColumns[k] !== false;
        });
        return out;
    }, [bulkSelectHeader, visibleColumns, dataColumnKeys]);
    const visibleIndices = useMemo(() => {
        if (!mergedVisible)
            return fullColumnKeys.map((_, i) => i);
        const idxs = fullColumnKeys
            .map((k, i) => (mergedVisible[k] === false ? -1 : i))
            .filter((i) => i >= 0);
        return idxs.length === 0 ? [0] : idxs;
    }, [fullColumnKeys, mergedVisible]);
    const filteredChildren = useMemo(() => filterTrCellsByIndices(children, visibleIndices), [children, visibleIndices]);
    const n = fullHeaders.length;
    const makeDefaultWidths = useCallback(() => {
        if (bulkSelectHeader) {
            return [SELECT_COL_PX, ...Array(dataHeaders.length).fill(DEFAULT_COL_PX)];
        }
        return defaultWidths(n);
    }, [bulkSelectHeader, dataHeaders.length, n]);
    const [widths, setWidths] = useState(() => makeDefaultWidths());
    const widthsRef = useRef(widths);
    useEffect(() => {
        widthsRef.current = widths;
    }, [widths]);
    useLayoutEffect(() => {
        setWidths((prev) => {
            if (prev.length === n)
                return prev;
            return makeDefaultWidths();
        });
    }, [n, makeDefaultWidths]);
    useLayoutEffect(() => {
        if (!tableId)
            return;
        const fallback = makeDefaultWidths();
        const loaded = loadStoredWidths(tableId, fullColumnKeys, fallback);
        setWidths(loaded);
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableId, n, headerSig, explicitSig, bulkSelectHeader]);
    const headerCellClass = stickyHeader
        ? "sticky top-0 z-20 bg-[var(--z-surface,#0a0a0c)] shadow-[inset_0_-1px_0_var(--z-border,#1c1c1e)]"
        : "";
    const rafRef = useRef(null);
    const pendingMoveRef = useRef(null);
    const handleResizeStart = useCallback((colIndex) => (e) => {
        var _a;
        if (fullColumnKeys[colIndex] === CRM_SELECT_COLUMN_KEY) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startW = (_a = widthsRef.current[colIndex]) !== null && _a !== void 0 ? _a : DEFAULT_COL_PX;
        const flushMove = () => {
            const me = pendingMoveRef.current;
            pendingMoveRef.current = null;
            rafRef.current = null;
            if (!me)
                return;
            const delta = me.clientX - startX;
            const next = clamp(startW + delta);
            setWidths((prev) => {
                if (prev[colIndex] === next)
                    return prev;
                const copy = [...prev];
                copy[colIndex] = next;
                widthsRef.current = copy;
                return copy;
            });
        };
        const onMove = (me) => {
            pendingMoveRef.current = me;
            if (rafRef.current != null)
                return;
            rafRef.current = requestAnimationFrame(flushMove);
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            if (rafRef.current != null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            flushMove();
            if (tableId) {
                saveWidths(tableId, fullColumnKeys, widthsRef.current);
            }
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }, [fullColumnKeys, tableId]);
    const resetColumns = useCallback(() => {
        const fresh = makeDefaultWidths();
        setWidths(fresh);
        widthsRef.current = fresh;
        if (tableId) {
            try {
                localStorage.removeItem(`crm:${tableId}:columnWidths`);
            }
            catch (_a) {
                /* ignore */
            }
        }
    }, [makeDefaultWidths, tableId]);
    useEffect(() => () => {
        if (rafRef.current != null)
            cancelAnimationFrame(rafRef.current);
    }, []);
    return (_jsxs("div", { className: "overflow-hidden rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)]", children: [tableId && showColumnReset ? (_jsx("div", { className: "flex justify-end border-b border-[var(--z-border,#1c1c1e)] px-2 py-1.5", children: _jsx("button", { type: "button", onClick: resetColumns, className: "text-xs font-medium text-[var(--z-muted,#909098)] underline-offset-2 hover:text-[var(--z-fg,#f0f0f0)] hover:underline", children: "Reset columns" }) })) : null, _jsx("div", { className: "max-h-[min(70vh,720px)] min-w-0 overflow-auto overscroll-contain", children: _jsxs("table", { className: "w-full table-fixed border-collapse text-sm", children: [_jsx("colgroup", { children: visibleIndices.map((colIdx) => (_jsx("col", { style: {
                                    width: fullColumnKeys[colIdx] === CRM_SELECT_COLUMN_KEY
                                        ? SELECT_COL_PX
                                        : widths[colIdx],
                                } }, fullColumnKeys[colIdx]))) }), _jsx("thead", { children: _jsx("tr", { className: "border-b border-[var(--z-border,#1c1c1e)] text-left text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]", children: visibleIndices.map((colIdx) => {
                                    var _a;
                                    const key = fullColumnKeys[colIdx];
                                    const h = (_a = fullHeaders[colIdx]) !== null && _a !== void 0 ? _a : "";
                                    const isSelect = key === CRM_SELECT_COLUMN_KEY;
                                    const canSort = !isSelect &&
                                        (sortableColumnKeys === null || sortableColumnKeys === void 0 ? void 0 : sortableColumnKeys.includes(key)) &&
                                        typeof onSortColumn === "function";
                                    const sortedAsc = canSort && sortKey === key && sortDir === "asc";
                                    const sortedDesc = canSort && sortKey === key && sortDir === "desc";
                                    const ariaSort = sortedAsc ? "ascending" : sortedDesc ? "descending" : "none";
                                    return (_jsx("th", { "aria-sort": isSelect ? undefined : ariaSort, className: `relative box-border overflow-hidden px-4 py-3 font-semibold ${headerCellClass}`, children: isSelect && bulkSelectHeader ? (_jsx("div", { className: "flex items-center justify-center pr-0", children: bulkSelectHeader })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex min-w-0 items-stretch pr-3", children: canSort ? (_jsxs("button", { type: "button", onClick: () => onSortColumn(key), className: "flex min-w-0 flex-1 items-center gap-1 rounded-sm text-left font-semibold text-inherit outline-offset-2 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[var(--z-accent,#00ff88)]", children: [_jsx("span", { className: "min-w-0 flex-1 truncate", children: h }), _jsx("span", { className: "shrink-0 text-[10px] leading-none text-[var(--z-muted,#909098)]", "aria-hidden": true, children: sortedAsc ? "▲" : sortedDesc ? "▼" : " " })] })) : (_jsx("span", { className: "block min-w-0 flex-1 truncate", children: h })) }), _jsx("div", { role: "separator", "aria-orientation": "vertical", "aria-label": `Resize column ${h || String(colIdx + 1)}`, onMouseDown: handleResizeStart(colIdx), className: "absolute top-0 right-0 z-30 h-full w-3 cursor-col-resize select-none touch-none hover:bg-[var(--z-accent,#00ff88)]/15" })] })) }, key));
                                }) }) }), _jsx("tbody", { children: filteredChildren })] }) })] }));
}
