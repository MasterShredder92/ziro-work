"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Link from "next/link";
import { useMemo, useState } from "react";
import { crmProfileHref } from "@/lib/crm";
import { CRMListTableSection } from "../ColumnVisibilityMenu";
import { downloadCsv, rowsToCsv } from "../exportCsv";
import { BulkSelectCell } from "../crm-list-selection";
import { useCrmLocalPatch } from "../_components/hooks/useCrmLocalPatch";
import { useInlineCrmEdit } from "../_components/hooks/useInlineCrmEdit";
import { EditableCell } from "../table-shell";
import { useCrmSort } from "../useCrmSort";
const COLUMN_KEYS = [
    "name",
    "role",
    "email",
    "phone",
    "stage_status",
    "notes",
    "updated",
];
const HEADERS = [
    "Name",
    "Role",
    "Email",
    "Phone",
    "Stage / Status",
    "Notes",
    "Updated",
];
const SORTABLE_COLUMN_KEYS = [
    "name",
    "role",
    "email",
    "phone",
    "stage_status",
    "updated",
];
function exportContactsCsv(contacts, visibility) {
    const idxs = COLUMN_KEYS.map((_, i) => i).filter((i) => visibility[COLUMN_KEYS[i]] !== false);
    const hdrs = idxs.map((i) => HEADERS[i]);
    const rows = contacts.map((c) => idxs.map((i) => {
        var _a, _b, _c, _d;
        const k = COLUMN_KEYS[i];
        switch (k) {
            case "name":
                return c.fullName;
            case "role":
                return c.kind;
            case "email":
                return (_a = c.email) !== null && _a !== void 0 ? _a : "";
            case "phone":
                return (_b = c.phone) !== null && _b !== void 0 ? _b : "";
            case "stage_status":
                return (_d = (_c = c.stage) !== null && _c !== void 0 ? _c : c.status) !== null && _d !== void 0 ? _d : "";
            case "notes":
                return "";
            case "updated":
                return c.updatedAt ? c.updatedAt.slice(0, 10) : "";
            default:
                return "";
        }
    }));
    downloadCsv("contacts.csv", rowsToCsv(hdrs, rows));
}
export function ContactsListClient({ contacts }) {
    const [rows, setRows] = useState(() => contacts);
    const [notesById, setNotesById] = useState(() => Object.fromEntries(contacts.map((c) => {
        var _a, _b, _c;
        const raw = (_a = c.notes) !== null && _a !== void 0 ? _a : ((_c = (_b = c.metadata) === null || _b === void 0 ? void 0 : _b.notes) !== null && _c !== void 0 ? _c : "");
        return [c.id, raw !== null && raw !== void 0 ? raw : ""];
    })));
    const [notesPopoverRowId, setNotesPopoverRowId] = useState(null);
    const { sortKey, sortDir, toggleSort } = useCrmSort("list-contacts");
    const { emitLocalPatch } = useCrmLocalPatch("contacts", (rowId, patch) => {
        var _a;
        const notesPatch = typeof patch.notes === "string"
            ? patch.notes
            : patch.notes === null
                ? ""
                : typeof ((_a = patch.metadata) === null || _a === void 0 ? void 0 : _a.notes) ===
                    "string"
                    ? String(patch.metadata.notes)
                    : null;
        if (notesPatch === null)
            return;
        setNotesById((prev) => (Object.assign(Object.assign({}, prev), { [rowId]: notesPatch })));
    });
    const inlineEdit = useInlineCrmEdit({
        resource: "contacts",
        toPatch: ({ rowId, columnKey, value }) => {
            var _a;
            if (columnKey === "name") {
                const [first, ...rest] = value.split(" ");
                return {
                    firstName: first !== null && first !== void 0 ? first : "",
                    lastName: rest.join(" ") || null,
                };
            }
            if (columnKey === "email")
                return { email: value || null };
            if (columnKey === "phone")
                return { phone: value || null };
            if (columnKey === "notes") {
                const row = rows.find((it) => it.id === rowId);
                if ((row === null || row === void 0 ? void 0 : row.kind) === "lead" || (row === null || row === void 0 ? void 0 : row.kind) === "student") {
                    return { notes: value || null };
                }
                const metadata = (_a = row === null || row === void 0 ? void 0 : row.metadata) !== null && _a !== void 0 ? _a : {};
                return { metadata: Object.assign(Object.assign({}, metadata), { notes: value || null }) };
            }
            throw new Error(`Unsupported editable contacts column: ${columnKey}`);
        },
        onOptimisticUpdate: ({ rowId, columnKey, value }) => {
            setRows((prev) => prev.map((row) => {
                if (row.id !== rowId)
                    return row;
                if (columnKey === "name") {
                    const [first, ...rest] = value.split(" ");
                    return Object.assign(Object.assign({}, row), { firstName: first !== null && first !== void 0 ? first : null, lastName: rest.join(" ") || null, fullName: value || "Unnamed" });
                }
                if (columnKey === "email")
                    return Object.assign(Object.assign({}, row), { email: value || null });
                if (columnKey === "phone")
                    return Object.assign(Object.assign({}, row), { phone: value || null });
                return row;
            }));
            if (columnKey === "notes") {
                setNotesById((prev) => (Object.assign(Object.assign({}, prev), { [rowId]: value })));
                emitLocalPatch(rowId, { notes: value || null });
            }
        },
        onRevert: ({ rowId, columnKey, value }) => {
            setRows((prev) => prev.map((row) => {
                if (row.id !== rowId)
                    return row;
                if (columnKey === "name") {
                    const [first, ...rest] = value.split(" ");
                    return Object.assign(Object.assign({}, row), { firstName: first !== null && first !== void 0 ? first : null, lastName: rest.join(" ") || null, fullName: value || "Unnamed" });
                }
                if (columnKey === "email")
                    return Object.assign(Object.assign({}, row), { email: value || null });
                if (columnKey === "phone")
                    return Object.assign(Object.assign({}, row), { phone: value || null });
                return row;
            }));
            if (columnKey === "notes") {
                setNotesById((prev) => (Object.assign(Object.assign({}, prev), { [rowId]: value })));
                emitLocalPatch(rowId, { notes: value || null });
            }
        },
    });
    const bulk = useMemo(() => ({
        rowIds: rows.map((c) => c.id),
        rowLabelsById: Object.fromEntries(rows.map((c) => [c.id, c.fullName])),
        resource: "contacts",
        buildExport: (visibility) => exportContactsCsv(rows, visibility),
    }), [rows]);
    return (_jsxs(_Fragment, { children: [inlineEdit.toast ? (_jsx("div", { className: "mb-2 flex justify-end", children: _jsx("button", { type: "button", onClick: inlineEdit.clearToast, className: "rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-200", children: inlineEdit.toast.message }) })) : null, _jsx(CRMListTableSection, { tableId: "list-contacts", columnKeys: [...COLUMN_KEYS], headers: [...HEADERS], bulk: bulk, sortKey: sortKey, sortDir: sortDir, sortableColumnKeys: SORTABLE_COLUMN_KEYS, onSortColumn: toggleSort, children: rows.map((c) => {
                    var _a, _b, _c, _d, _e, _f, _g;
                    return (_jsxs("tr", { className: "border-b border-[#1c1c1e] last:border-0 hover:bg-white/5", children: [_jsx(BulkSelectCell, { rowId: c.id }), _jsx(EditableCell, { rowId: c.id, columnKey: "name", label: `name for ${c.fullName}`, value: c.fullName, className: "px-4 py-2 font-semibold text-[#f0f0f0]", isEditing: inlineEdit.isEditingCell(c.id, "name"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, children: _jsx(Link, { href: crmProfileHref(c.kind, c.sourceId), className: "hover:text-[#00ff88]", children: c.fullName }) }), _jsx("td", { className: "px-4 py-2 text-[#909098]", children: c.kind }), _jsx(EditableCell, { rowId: c.id, columnKey: "email", label: `email for ${c.fullName}`, value: (_a = c.email) !== null && _a !== void 0 ? _a : "", className: "px-4 py-2 text-[#909098]", isEditing: inlineEdit.isEditingCell(c.id, "email"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, children: (_b = c.email) !== null && _b !== void 0 ? _b : "—" }), _jsx(EditableCell, { rowId: c.id, columnKey: "phone", label: `phone for ${c.fullName}`, value: (_c = c.phone) !== null && _c !== void 0 ? _c : "", className: "px-4 py-2 text-[#909098]", isEditing: inlineEdit.isEditingCell(c.id, "phone"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, children: (_d = c.phone) !== null && _d !== void 0 ? _d : "—" }), _jsx("td", { className: "px-4 py-2 text-[#909098]", children: (_f = (_e = c.stage) !== null && _e !== void 0 ? _e : c.status) !== null && _f !== void 0 ? _f : "—" }), _jsx(EditableCell, { rowId: c.id, columnKey: "notes", label: `notes for ${c.fullName}`, value: (_g = notesById[c.id]) !== null && _g !== void 0 ? _g : "", className: "px-4 py-2 text-[#909098]", isEditing: inlineEdit.isEditingCell(c.id, "notes"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, notesPopover: {
                                    isOpen: notesPopoverRowId === c.id,
                                    value: inlineEdit.draftValue,
                                    onOpen: () => {
                                        var _a, _b;
                                        inlineEdit.startEditing(c.id, "notes", (_a = notesById[c.id]) !== null && _a !== void 0 ? _a : "");
                                        inlineEdit.setDraftValue((_b = notesById[c.id]) !== null && _b !== void 0 ? _b : "");
                                        setNotesPopoverRowId(c.id);
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
                                } }), _jsx("td", { className: "px-4 py-2 text-[#707078]", children: c.updatedAt ? c.updatedAt.slice(0, 10) : "—" })] }, c.id));
                }) })] }));
}
