"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CRMListTableSection } from "../ColumnVisibilityMenu";
import { BulkSelectCell } from "../crm-list-selection";
import { downloadCsv, rowsToCsv } from "../exportCsv";
import { useCrmLocalPatch } from "../_components/hooks/useCrmLocalPatch";
import { useInlineCrmEdit } from "../_components/hooks/useInlineCrmEdit";
import { EditableCell } from "../table-shell";
import { useCrmSort } from "../useCrmSort";
const COLUMN_KEYS = [
    "name",
    "status",
    "instrument",
    "studio",
    "teacher",
    "rate",
    "paid",
    "military",
    "family",
    "next_lesson",
    "notes",
    "actions",
];
const HEADERS = [
    "Name",
    "Status",
    "Instrument",
    "Studio",
    "Teacher",
    "Rate / lesson",
    "Total paid",
    "Military",
    "Family",
    "Next lesson",
    "Notes",
    "",
];
/** Sortable data columns only (not computed next lesson or actions). */
const SORTABLE_COLUMN_KEYS = [
    "name",
    "status",
    "instrument",
    "teacher",
    "family",
    "studio",
    "rate",
    "paid",
];
function formatMoney(n) {
    if (typeof n !== "number" || Number.isNaN(n))
        return "";
    return `$${n.toFixed(2)}`;
}
function exportStudentsCsv(rows, nextLessons, visibility, locationNameById) {
    const idxs = COLUMN_KEYS.map((_, i) => i).filter((i) => visibility[COLUMN_KEYS[i]] !== false);
    const hdrs = idxs.map((i) => HEADERS[i] ||
        (COLUMN_KEYS[i] === "actions" ? "Scheduling" : `Column ${i}`));
    const dataRows = rows.map((r) => idxs.map((i) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const k = COLUMN_KEYS[i];
        switch (k) {
            case "name":
                return `${(_a = r.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = r.last_name) !== null && _b !== void 0 ? _b : ""}`.trim();
            case "status":
                return (_c = r.status) !== null && _c !== void 0 ? _c : "";
            case "instrument":
                return (_d = r.instrument) !== null && _d !== void 0 ? _d : "";
            case "studio":
                return r.location_id
                    ? (_e = locationNameById[r.location_id]) !== null && _e !== void 0 ? _e : r.location_id
                    : "";
            case "teacher":
                return (_g = (_f = r.last_teacher_name) !== null && _f !== void 0 ? _f : r.first_teacher_name) !== null && _g !== void 0 ? _g : "";
            case "rate":
                return formatMoney(r.rate_per_session);
            case "paid":
                return formatMoney(r.total_paid);
            case "military":
                return r.is_military ? "Yes" : "No";
            case "family":
                return r.family_id ? "View family" : "";
            case "next_lesson":
                return (_h = nextLessons[r.id]) !== null && _h !== void 0 ? _h : "";
            case "notes":
                return (_j = r.notes) !== null && _j !== void 0 ? _j : "";
            case "actions":
                return `/schedule/student?studentId=${encodeURIComponent(r.id)}`;
            default:
                return "";
        }
    }));
    downloadCsv("students.csv", rowsToCsv(hdrs, dataRows));
}
export function StudentsListClient({ rows, nextLessons, locationNameById, }) {
    const [localRows, setLocalRows] = useState(rows);
    const [notesPopoverRowId, setNotesPopoverRowId] = useState(null);
    useEffect(() => {
        setLocalRows(rows);
    }, [rows]);
    const { sortKey, sortDir, toggleSort } = useCrmSort("list-students");
    const { emitLocalPatch } = useCrmLocalPatch("students", (rowId, patch) => {
        const notesPatch = typeof patch.notes === "string"
            ? patch.notes
            : patch.notes === null
                ? null
                : null;
        if (notesPatch === null && patch.notes !== null)
            return;
        setLocalRows((prev) => prev.map((row) => row.id === rowId ? Object.assign(Object.assign({}, row), { notes: notesPatch !== null && notesPatch !== void 0 ? notesPatch : null }) : row));
    });
    const statusOptions = useMemo(() => ["enrolled", "active", "inactive", "prospect"], []);
    const instrumentOptions = useMemo(() => {
        const seeded = ["Piano", "Guitar", "Drums", "Voice", "Violin"];
        const fromRows = localRows
            .map((r) => r.instrument)
            .filter((v) => Boolean(v));
        return Array.from(new Set([...seeded, ...fromRows])).sort();
    }, [localRows]);
    const inlineEdit = useInlineCrmEdit({
        resource: "students",
        toPatch: ({ columnKey, value }) => {
            if (columnKey === "name") {
                const [first, ...rest] = value.split(" ");
                return { first_name: first !== null && first !== void 0 ? first : "", last_name: rest.join(" ") || "" };
            }
            if (columnKey === "status")
                return { status: value };
            if (columnKey === "instrument")
                return { instrument: value || null };
            if (columnKey === "notes")
                return { notes: value || null };
            throw new Error(`Unsupported editable students column: ${columnKey}`);
        },
        onOptimisticUpdate: ({ rowId, columnKey, value }) => {
            setLocalRows((prev) => prev.map((row) => {
                if (row.id !== rowId)
                    return row;
                if (columnKey === "name") {
                    const [first, ...rest] = value.split(" ");
                    return Object.assign(Object.assign({}, row), { first_name: first !== null && first !== void 0 ? first : "", last_name: rest.join(" ") });
                }
                if (columnKey === "status")
                    return Object.assign(Object.assign({}, row), { status: value });
                if (columnKey === "instrument")
                    return Object.assign(Object.assign({}, row), { instrument: value || null });
                if (columnKey === "notes")
                    return Object.assign(Object.assign({}, row), { notes: value || null });
                return row;
            }));
            if (columnKey === "notes")
                emitLocalPatch(rowId, { notes: value || null });
        },
        onRevert: ({ rowId, columnKey, value }) => {
            setLocalRows((prev) => prev.map((row) => {
                if (row.id !== rowId)
                    return row;
                if (columnKey === "name") {
                    const [first, ...rest] = value.split(" ");
                    return Object.assign(Object.assign({}, row), { first_name: first !== null && first !== void 0 ? first : "", last_name: rest.join(" ") });
                }
                if (columnKey === "status")
                    return Object.assign(Object.assign({}, row), { status: value });
                if (columnKey === "instrument")
                    return Object.assign(Object.assign({}, row), { instrument: value || null });
                if (columnKey === "notes")
                    return Object.assign(Object.assign({}, row), { notes: value || null });
                return row;
            }));
            if (columnKey === "notes")
                emitLocalPatch(rowId, { notes: value || null });
        },
    });
    const bulk = useMemo(() => ({
        rowIds: localRows.map((r) => r.id),
        rowLabelsById: Object.fromEntries(localRows.map((r) => {
            var _a, _b;
            return [
                r.id,
                `${(_a = r.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = r.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() || r.id,
            ];
        })),
        resource: "students",
        buildExport: (visibility) => exportStudentsCsv(localRows, nextLessons, visibility, locationNameById),
    }), [localRows, nextLessons, locationNameById]);
    return (_jsxs(_Fragment, { children: [inlineEdit.toast ? (_jsx("div", { className: "mb-2 flex justify-end", children: _jsx("button", { type: "button", onClick: inlineEdit.clearToast, className: "rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-200", children: inlineEdit.toast.message }) })) : null, _jsx(CRMListTableSection, { tableId: "list-students", columnKeys: [...COLUMN_KEYS], headers: [...HEADERS], bulk: bulk, sortKey: sortKey, sortDir: sortDir, sortableColumnKeys: SORTABLE_COLUMN_KEYS, onSortColumn: toggleSort, children: localRows.map((r) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                    const fullName = `${(_a = r.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = r.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() || r.id;
                    return (_jsxs("tr", { className: "border-b border-[var(--z-border,#1c1c1e)] last:border-0 hover:bg-white/5", children: [_jsx(BulkSelectCell, { rowId: r.id }), _jsx(EditableCell, { rowId: r.id, columnKey: "name", label: `name for ${fullName}`, value: fullName, className: "px-4 py-2 font-semibold text-[var(--z-fg,#f0f0f0)]", isEditing: inlineEdit.isEditingCell(r.id, "name"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, children: _jsx(Link, { href: `/crm/students/${r.id}`, className: "hover:text-[var(--z-accent,#00ff88)]", children: fullName }) }), _jsx(EditableCell, { rowId: r.id, columnKey: "status", label: `status for ${fullName}`, value: (_c = r.status) !== null && _c !== void 0 ? _c : "", className: "px-4 py-2 text-[var(--z-muted,#909098)]", isEditing: inlineEdit.isEditingCell(r.id, "status"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, selectOptions: statusOptions.map((opt) => ({ value: opt, label: opt })), children: r.status }), _jsx(EditableCell, { rowId: r.id, columnKey: "instrument", label: `primary instrument for ${fullName}`, value: (_d = r.instrument) !== null && _d !== void 0 ? _d : "", className: "px-4 py-2 text-[var(--z-muted,#909098)]", isEditing: inlineEdit.isEditingCell(r.id, "instrument"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, selectOptions: instrumentOptions.map((opt) => ({
                                    value: opt,
                                    label: opt,
                                })), children: (_e = r.instrument) !== null && _e !== void 0 ? _e : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: r.location_id
                                    ? (_f = locationNameById[r.location_id]) !== null && _f !== void 0 ? _f : r.location_id
                                    : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: (_h = (_g = r.last_teacher_name) !== null && _g !== void 0 ? _g : r.first_teacher_name) !== null && _h !== void 0 ? _h : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: typeof r.rate_per_session === "number" &&
                                    !Number.isNaN(r.rate_per_session)
                                    ? formatMoney(r.rate_per_session)
                                    : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: typeof r.total_paid === "number" && !Number.isNaN(r.total_paid)
                                    ? formatMoney(r.total_paid)
                                    : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: r.is_military ? "Yes" : "No" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: r.family_id ? (_jsx(Link, { href: `/crm/families/${r.family_id}`, className: "text-[var(--z-accent,#00ff88)] hover:underline", children: "View family" })) : ("—") }), _jsx("td", { className: "max-w-[200px] truncate px-4 py-2 text-[var(--z-muted,#909098)]", children: (_j = nextLessons[r.id]) !== null && _j !== void 0 ? _j : "—" }), _jsx(EditableCell, { rowId: r.id, columnKey: "notes", label: `notes for ${fullName}`, value: (_k = r.notes) !== null && _k !== void 0 ? _k : "", className: "px-4 py-2 text-[var(--z-muted,#909098)]", isEditing: inlineEdit.isEditingCell(r.id, "notes"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, notesPopover: {
                                    isOpen: notesPopoverRowId === r.id,
                                    value: inlineEdit.draftValue,
                                    onOpen: () => {
                                        var _a, _b;
                                        inlineEdit.startEditing(r.id, "notes", (_a = r.notes) !== null && _a !== void 0 ? _a : "");
                                        inlineEdit.setDraftValue((_b = r.notes) !== null && _b !== void 0 ? _b : "");
                                        setNotesPopoverRowId(r.id);
                                    },
                                    onChange: (next) => inlineEdit.setDraftValue(next),
                                    onSave: () => {
                                        void inlineEdit.commitEditing();
                                        setNotesPopoverRowId(null);
                                    },
                                    onCancel: () => {
                                        inlineEdit.cancelEditing();
                                        setNotesPopoverRowId(null);
                                    },
                                } }), _jsx("td", { className: "whitespace-nowrap px-4 py-2 text-right text-[var(--z-muted,#909098)]", children: _jsx(Link, { href: `/schedule/student?studentId=${encodeURIComponent(r.id)}`, className: "text-[var(--z-accent,#00ff88)] hover:underline", children: "Scheduling" }) })] }, r.id));
                }) })] }));
}
