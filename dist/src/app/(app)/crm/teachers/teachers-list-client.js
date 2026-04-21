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
    "active",
    "active_students",
    "enrollments",
    "schedule",
    "email",
    "phone",
    "notes",
];
const HEADERS = [
    "Name",
    "Status",
    "Active",
    "Active students",
    "Enrollments",
    "Schedule (recurring)",
    "Email",
    "Phone",
    "Notes",
];
const SORTABLE_COLUMN_KEYS = [
    "name",
    "status",
    "active",
    "email",
    "phone",
];
function getTeacherNotes(row) {
    var _a;
    const metadata = row.metadata;
    return (_a = metadata === null || metadata === void 0 ? void 0 : metadata.notes) !== null && _a !== void 0 ? _a : "";
}
function withTeacherNotes(row, notes) {
    var _a;
    const metadata = (_a = row.metadata) !== null && _a !== void 0 ? _a : {};
    return Object.assign(Object.assign({}, row), { metadata: Object.assign(Object.assign({}, metadata), { notes: notes || null }) });
}
function exportTeachersCsv(rows, activeByTeacher, totalByTeacher, headlines, visibility) {
    const idxs = COLUMN_KEYS.map((_, i) => i).filter((i) => visibility[COLUMN_KEYS[i]] !== false);
    const hdrs = idxs.map((i) => HEADERS[i]);
    const dataRows = rows.map((r) => {
        var _a, _b, _c;
        const tid = r.id;
        const fullName = `${(_a = r.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = r.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() ||
            "Unnamed";
        const name = (_c = r.display_name) !== null && _c !== void 0 ? _c : fullName;
        return idxs.map((i) => {
            var _a, _b, _c, _d, _e, _f;
            const k = COLUMN_KEYS[i];
            switch (k) {
                case "name":
                    return name;
                case "status":
                    return (_a = r.status) !== null && _a !== void 0 ? _a : "";
                case "active":
                    return r.is_active ? "Yes" : "No";
                case "active_students":
                    return String((_b = activeByTeacher[tid]) !== null && _b !== void 0 ? _b : 0);
                case "enrollments":
                    return String((_c = totalByTeacher[tid]) !== null && _c !== void 0 ? _c : 0);
                case "schedule":
                    return (_d = headlines[tid]) !== null && _d !== void 0 ? _d : "";
                case "email":
                    return (_e = r.email) !== null && _e !== void 0 ? _e : "";
                case "phone":
                    return (_f = r.phone) !== null && _f !== void 0 ? _f : "";
                case "notes":
                    return getTeacherNotes(r);
                default:
                    return "";
            }
        });
    });
    downloadCsv("teachers.csv", rowsToCsv(hdrs, dataRows));
}
export function TeachersListClient({ rows, activeByTeacher, totalByTeacher, headlines, }) {
    const [localRows, setLocalRows] = useState(rows);
    const [notesPopoverRowId, setNotesPopoverRowId] = useState(null);
    useEffect(() => {
        setLocalRows(rows);
    }, [rows]);
    const { sortKey, sortDir, toggleSort } = useCrmSort("list-teachers");
    const { emitLocalPatch } = useCrmLocalPatch("teachers", (rowId, patch) => {
        var _a;
        const metadataNotes = (_a = patch.metadata) === null || _a === void 0 ? void 0 : _a.notes;
        if (typeof metadataNotes !== "string" && metadataNotes !== null)
            return;
        setLocalRows((prev) => prev.map((row) => row.id === rowId
            ? withTeacherNotes(row, metadataNotes !== null && metadataNotes !== void 0 ? metadataNotes : "")
            : row));
    });
    const inlineEdit = useInlineCrmEdit({
        resource: "teachers",
        toPatch: ({ rowId, columnKey, value }) => {
            var _a;
            if (columnKey === "name") {
                const [first, ...rest] = value.split(" ");
                return { first_name: first !== null && first !== void 0 ? first : "", last_name: rest.join(" ") || "" };
            }
            if (columnKey === "email")
                return { email: value || null };
            if (columnKey === "phone")
                return { phone: value || null };
            if (columnKey === "notes") {
                const row = localRows.find((it) => it.id === rowId);
                const metadata = (_a = row === null || row === void 0 ? void 0 : row.metadata) !== null && _a !== void 0 ? _a : {};
                return { metadata: Object.assign(Object.assign({}, metadata), { notes: value || null }) };
            }
            throw new Error(`Unsupported editable teachers column: ${columnKey}`);
        },
        onOptimisticUpdate: ({ rowId, columnKey, value }) => {
            setLocalRows((prev) => prev.map((row) => {
                if (row.id !== rowId)
                    return row;
                if (columnKey === "name") {
                    const [first, ...rest] = value.split(" ");
                    return Object.assign(Object.assign({}, row), { first_name: first !== null && first !== void 0 ? first : "", last_name: rest.join(" ") });
                }
                if (columnKey === "email")
                    return Object.assign(Object.assign({}, row), { email: value || null });
                if (columnKey === "phone")
                    return Object.assign(Object.assign({}, row), { phone: value || null });
                if (columnKey === "notes")
                    return withTeacherNotes(row, value);
                return row;
            }));
            if (columnKey === "notes") {
                emitLocalPatch(rowId, { metadata: { notes: value || null } });
            }
        },
        onRevert: ({ rowId, columnKey, value }) => {
            setLocalRows((prev) => prev.map((row) => {
                if (row.id !== rowId)
                    return row;
                if (columnKey === "name") {
                    const [first, ...rest] = value.split(" ");
                    return Object.assign(Object.assign({}, row), { first_name: first !== null && first !== void 0 ? first : "", last_name: rest.join(" ") });
                }
                if (columnKey === "email")
                    return Object.assign(Object.assign({}, row), { email: value || null });
                if (columnKey === "phone")
                    return Object.assign(Object.assign({}, row), { phone: value || null });
                if (columnKey === "notes")
                    return withTeacherNotes(row, value);
                return row;
            }));
            if (columnKey === "notes") {
                emitLocalPatch(rowId, { metadata: { notes: value || null } });
            }
        },
    });
    const bulk = useMemo(() => {
        const labels = Object.fromEntries(localRows.map((r) => {
            var _a, _b, _c;
            const tid = r.id;
            const fullName = `${(_a = r.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = r.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() ||
                "Unnamed";
            const name = (_c = r.display_name) !== null && _c !== void 0 ? _c : fullName;
            return [tid, name];
        }));
        return {
            rowIds: localRows.map((r) => r.id),
            rowLabelsById: labels,
            resource: "teachers",
            buildExport: (visibility) => exportTeachersCsv(localRows, activeByTeacher, totalByTeacher, headlines, visibility),
        };
    }, [localRows, activeByTeacher, totalByTeacher, headlines]);
    return (_jsxs(_Fragment, { children: [inlineEdit.toast ? (_jsx("div", { className: "mb-2 flex justify-end", children: _jsx("button", { type: "button", onClick: inlineEdit.clearToast, className: "rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-200", children: inlineEdit.toast.message }) })) : null, _jsx(CRMListTableSection, { tableId: "list-teachers", columnKeys: [...COLUMN_KEYS], headers: [...HEADERS], bulk: bulk, sortKey: sortKey, sortDir: sortDir, sortableColumnKeys: SORTABLE_COLUMN_KEYS, onSortColumn: toggleSort, children: localRows.map((r) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                    const tid = r.id;
                    const fullName = `${(_a = r.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = r.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() ||
                        "Unnamed";
                    const name = (_c = r.display_name) !== null && _c !== void 0 ? _c : fullName;
                    return (_jsxs("tr", { className: "border-b border-[var(--z-border,#1c1c1e)] last:border-0 hover:bg-white/5", children: [_jsx(BulkSelectCell, { rowId: tid }), _jsx(EditableCell, { rowId: tid, columnKey: "name", label: `name for ${name}`, value: name, className: "px-4 py-2 font-semibold text-[var(--z-fg,#f0f0f0)]", isEditing: inlineEdit.isEditingCell(tid, "name"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, children: _jsx(Link, { href: `/crm/teachers/${tid}`, className: "hover:text-[var(--z-accent,#00ff88)]", children: name }) }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: (_d = r.status) !== null && _d !== void 0 ? _d : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: r.is_active ? "Yes" : "No" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: (_e = activeByTeacher[tid]) !== null && _e !== void 0 ? _e : 0 }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: (_f = totalByTeacher[tid]) !== null && _f !== void 0 ? _f : 0 }), _jsx("td", { className: "max-w-[220px] truncate px-4 py-2 text-[var(--z-muted,#909098)]", children: (_g = headlines[tid]) !== null && _g !== void 0 ? _g : "—" }), _jsx(EditableCell, { rowId: tid, columnKey: "email", label: `email for ${name}`, value: (_h = r.email) !== null && _h !== void 0 ? _h : "", className: "px-4 py-2 text-[var(--z-muted,#909098)]", isEditing: inlineEdit.isEditingCell(tid, "email"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, children: (_j = r.email) !== null && _j !== void 0 ? _j : "—" }), _jsx(EditableCell, { rowId: tid, columnKey: "phone", label: `phone for ${name}`, value: (_k = r.phone) !== null && _k !== void 0 ? _k : "", className: "px-4 py-2 text-[var(--z-muted,#909098)]", isEditing: inlineEdit.isEditingCell(tid, "phone"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, children: (_l = r.phone) !== null && _l !== void 0 ? _l : "—" }), _jsx(EditableCell, { rowId: tid, columnKey: "notes", label: `notes for ${name}`, value: getTeacherNotes(r), className: "px-4 py-2 text-[var(--z-muted,#909098)]", isEditing: inlineEdit.isEditingCell(tid, "notes"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, notesPopover: {
                                    isOpen: notesPopoverRowId === tid,
                                    value: inlineEdit.draftValue,
                                    onOpen: () => {
                                        const initial = getTeacherNotes(r);
                                        inlineEdit.startEditing(tid, "notes", initial);
                                        inlineEdit.setDraftValue(initial);
                                        setNotesPopoverRowId(tid);
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
                                } })] }, tid));
                }) })] }));
}
