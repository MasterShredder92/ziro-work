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
import { EnrollmentRowActions } from "./_client";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
const COLUMN_KEYS = [
    "student",
    "teacher",
    "status",
    "start",
    "end",
    "updated",
    "notes",
    "actions",
];
const HEADERS = [
    "Student",
    "Teacher",
    "Status",
    "Start",
    "End",
    "Updated",
    "Notes",
    "",
];
const SORTABLE_COLUMN_KEYS = ["status", "start", "end", "updated"];
function parseMetadata(raw) {
    if (typeof raw === "object" && raw !== null) {
        return raw;
    }
    return {};
}
function getEnrollmentNotes(row) {
    var _a;
    const metadata = parseMetadata(row.metadata);
    return (_a = metadata.notes) !== null && _a !== void 0 ? _a : "";
}
function withEnrollmentNotes(row, notes) {
    const metadata = parseMetadata(row.metadata);
    return Object.assign(Object.assign({}, row), { metadata: Object.assign(Object.assign({}, metadata), { notes: notes || null }) });
}
function exportEnrollmentsCsv(rows, studentNameById, teacherNameById, visibility) {
    const idxs = COLUMN_KEYS.map((_, i) => i).filter((i) => visibility[COLUMN_KEYS[i]] !== false);
    const hdrs = idxs.map((i) => HEADERS[i] ||
        (COLUMN_KEYS[i] === "actions" ? "Actions" : `Column ${i}`));
    const dataRows = rows.map((r) => idxs.map((i) => {
        var _a, _b, _c, _d, _e;
        const k = COLUMN_KEYS[i];
        switch (k) {
            case "student":
                return (_a = studentNameById[r.student_id]) !== null && _a !== void 0 ? _a : r.student_id;
            case "teacher":
                return (_b = teacherNameById[r.teacher_id]) !== null && _b !== void 0 ? _b : r.teacher_id;
            case "status":
                return (_c = r.status) !== null && _c !== void 0 ? _c : "";
            case "start":
                return (_d = r.start_date) !== null && _d !== void 0 ? _d : "";
            case "end":
                return (_e = r.end_date) !== null && _e !== void 0 ? _e : "";
            case "updated":
                return r.updated_at.slice(0, 10);
            case "notes":
                return getEnrollmentNotes(r);
            case "actions":
                return r.id;
            default:
                return "";
        }
    }));
    downloadCsv("enrollments.csv", rowsToCsv(hdrs, dataRows));
}
export function EnrollmentsListClient({ rows, studentNameById, teacherNameById, teacherOptions, statuses, }) {
    const [localRows, setLocalRows] = useState(rows);
    const [notesPopoverRowId, setNotesPopoverRowId] = useState(null);
    useEffect(() => {
        setLocalRows(rows);
    }, [rows]);
    const { sortKey, sortDir, toggleSort } = useCrmSort("list-enrollments");
    const teacherLabelById = useMemo(() => Object.fromEntries(teacherOptions.map((t) => [t.id, t.label])), [teacherOptions]);
    const { emitLocalPatch } = useCrmLocalPatch("enrollments", (rowId, patch) => {
        const patchMetadata = parseMetadata(patch.metadata);
        const metadataNotes = patchMetadata.notes;
        if (typeof metadataNotes !== "string" && metadataNotes !== null)
            return;
        setLocalRows((prev) => prev.map((row) => row.id === rowId ? withEnrollmentNotes(row, metadataNotes !== null && metadataNotes !== void 0 ? metadataNotes : "") : row));
    });
    const inlineEdit = useInlineCrmEdit({
        resource: "enrollments",
        toPatch: ({ rowId, columnKey, value }) => {
            if (columnKey === "status")
                return { status: value };
            if (columnKey === "teacher")
                return { teacher_id: value };
            if (columnKey === "notes") {
                const row = localRows.find((it) => it.id === rowId);
                const metadata = parseMetadata(row === null || row === void 0 ? void 0 : row.metadata);
                return { metadata: Object.assign(Object.assign({}, metadata), { notes: value || null }) };
            }
            throw new Error(`Unsupported editable enrollments column: ${columnKey}`);
        },
        onOptimisticUpdate: ({ rowId, columnKey, value }) => {
            setLocalRows((prev) => prev.map((row) => {
                if (row.id !== rowId)
                    return row;
                if (columnKey === "status")
                    return Object.assign(Object.assign({}, row), { status: value });
                if (columnKey === "teacher")
                    return Object.assign(Object.assign({}, row), { teacher_id: value });
                if (columnKey === "notes")
                    return withEnrollmentNotes(row, value);
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
                if (columnKey === "status")
                    return Object.assign(Object.assign({}, row), { status: value });
                if (columnKey === "teacher")
                    return Object.assign(Object.assign({}, row), { teacher_id: value });
                if (columnKey === "notes")
                    return withEnrollmentNotes(row, value);
                return row;
            }));
            if (columnKey === "notes") {
                emitLocalPatch(rowId, { metadata: { notes: value || null } });
            }
        },
    });
    const bulk = useMemo(() => ({
        rowIds: localRows.map((r) => r.id),
        rowLabelsById: Object.fromEntries(localRows.map((r) => {
            var _a;
            return [
                r.id,
                (_a = studentNameById[r.student_id]) !== null && _a !== void 0 ? _a : r.student_id,
            ];
        })),
        resource: "enrollments",
        buildExport: (visibility) => exportEnrollmentsCsv(localRows, studentNameById, teacherNameById, visibility),
    }), [localRows, studentNameById, teacherNameById]);
    return (_jsxs(_Fragment, { children: [_jsx(AgentPageBar, { agentId: "sid", chatPlaceholder: "Ask Sid about enrollments\u2026", pageContext: { page: "enrollments", count: localRows.length } }), inlineEdit.toast ? (_jsx("div", { className: "mb-2 flex justify-end", children: _jsx("button", { type: "button", onClick: inlineEdit.clearToast, className: "rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-200", children: inlineEdit.toast.message }) })) : null, _jsx(CRMListTableSection, { tableId: "list-enrollments", columnKeys: [...COLUMN_KEYS], headers: [...HEADERS], bulk: bulk, sortKey: sortKey, sortDir: sortDir, sortableColumnKeys: SORTABLE_COLUMN_KEYS, onSortColumn: toggleSort, children: localRows.map((r) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    return (_jsxs("tr", { className: "border-b border-[var(--z-border,#1c1c1e)] last:border-0", children: [_jsx(BulkSelectCell, { rowId: r.id }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: _jsx(Link, { href: `/crm/students/${r.student_id}`, className: "hover:text-[var(--z-accent,#00ff88)]", children: (_a = studentNameById[r.student_id]) !== null && _a !== void 0 ? _a : r.student_id }) }), _jsx(EditableCell, { rowId: r.id, columnKey: "teacher", label: `teacher for ${(_b = studentNameById[r.student_id]) !== null && _b !== void 0 ? _b : r.student_id}`, value: r.teacher_id, className: "px-4 py-2 text-[var(--z-muted,#909098)]", isEditing: inlineEdit.isEditingCell(r.id, "teacher"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, selectOptions: teacherOptions.map((t) => ({
                                    value: t.id,
                                    label: t.label,
                                })), children: _jsx(Link, { href: `/crm/teachers/${r.teacher_id}`, className: "hover:text-[var(--z-accent,#00ff88)]", children: (_d = (_c = teacherLabelById[r.teacher_id]) !== null && _c !== void 0 ? _c : teacherNameById[r.teacher_id]) !== null && _d !== void 0 ? _d : r.teacher_id }) }), _jsx(EditableCell, { rowId: r.id, columnKey: "status", label: `status for ${(_e = studentNameById[r.student_id]) !== null && _e !== void 0 ? _e : r.student_id}`, value: r.status, className: "px-4 py-2 text-[var(--z-muted,#909098)]", isEditing: inlineEdit.isEditingCell(r.id, "status"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, selectOptions: statuses.map((s) => ({ value: s, label: s })), children: r.status }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: (_f = r.start_date) !== null && _f !== void 0 ? _f : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: (_g = r.end_date) !== null && _g !== void 0 ? _g : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#707078)]", children: r.updated_at.slice(0, 10) }), _jsx(EditableCell, { rowId: r.id, columnKey: "notes", label: `notes for ${(_h = studentNameById[r.student_id]) !== null && _h !== void 0 ? _h : r.student_id}`, value: getEnrollmentNotes(r), className: "px-4 py-2 text-[var(--z-muted,#909098)]", isEditing: inlineEdit.isEditingCell(r.id, "notes"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, notesPopover: {
                                    isOpen: notesPopoverRowId === r.id,
                                    value: inlineEdit.draftValue,
                                    onOpen: () => {
                                        const initial = getEnrollmentNotes(r);
                                        inlineEdit.startEditing(r.id, "notes", initial);
                                        inlineEdit.setDraftValue(initial);
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
                                } }), _jsx("td", { className: "px-4 py-2 text-right", children: _jsx(EnrollmentRowActions, { enrollmentId: r.id, status: r.status, teacherId: r.teacher_id, teachers: teacherOptions, statuses: statuses }) })] }, r.id));
                }) })] }));
}
