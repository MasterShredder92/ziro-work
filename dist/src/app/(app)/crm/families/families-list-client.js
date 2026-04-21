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
    "family",
    "primary_contact",
    "students",
    "studio",
    "military",
    "rate_tier",
    "lifetime_paid",
    "balance",
    "email",
    "phone",
    "notes",
];
const HEADERS = [
    "Family",
    "Primary contact",
    "Students",
    "Studio",
    "Military",
    "Rate tier",
    "Lifetime paid",
    "Balance",
    "Email",
    "Phone",
    "Notes",
];
const SORTABLE_COLUMN_KEYS = [
    "family",
    "primary_contact",
    "balance",
    "email",
    "phone",
    "studio",
    "lifetime_paid",
];
function getFamilyNotes(row) {
    var _a;
    const metadata = row.metadata;
    return (_a = metadata === null || metadata === void 0 ? void 0 : metadata.notes) !== null && _a !== void 0 ? _a : "";
}
function withFamilyNotes(row, notes) {
    var _a;
    const metadata = (_a = row.metadata) !== null && _a !== void 0 ? _a : {};
    return Object.assign(Object.assign({}, row), { metadata: Object.assign(Object.assign({}, metadata), { notes: notes || null }) });
}
function primaryContactName(f) {
    var _a, _b;
    const fromParts = [f.parent_first_name, f.parent_last_name].filter(Boolean).join(" ").trim() ||
        "—";
    return (_b = (_a = f.primary_contact_name) !== null && _a !== void 0 ? _a : f.parent_name) !== null && _b !== void 0 ? _b : fromParts;
}
function formatLifetimePaidCents(row) {
    const cents = row.lifetime_paid_cents;
    if (typeof cents !== "number" || Number.isNaN(cents))
        return "";
    return `$${(cents / 100).toFixed(2)}`;
}
function exportFamiliesCsv(rows, counts, visibility, locationNameById) {
    const idxs = COLUMN_KEYS.map((_, i) => i).filter((i) => visibility[COLUMN_KEYS[i]] !== false);
    const hdrs = idxs.map((i) => HEADERS[i]);
    const dataRows = rows.map((r) => idxs.map((i) => {
        var _a, _b, _c, _d, _e;
        const k = COLUMN_KEYS[i];
        switch (k) {
            case "family":
                return (_a = r.name) !== null && _a !== void 0 ? _a : "";
            case "primary_contact":
                return primaryContactName(r);
            case "students":
                return String((_b = counts[r.id]) !== null && _b !== void 0 ? _b : 0);
            case "studio":
                return r.primary_location_id
                    ? (_c = locationNameById[r.primary_location_id]) !== null && _c !== void 0 ? _c : r.primary_location_id
                    : "";
            case "military":
                return r.is_military ? "Yes" : "No";
            case "rate_tier":
                return typeof r.rate_tier === "number" && !Number.isNaN(r.rate_tier)
                    ? String(r.rate_tier)
                    : "";
            case "lifetime_paid":
                return formatLifetimePaidCents(r);
            case "balance":
                return typeof r.balance === "number" ? r.balance.toFixed(2) : "";
            case "email":
                return (_d = r.primary_email) !== null && _d !== void 0 ? _d : "";
            case "phone":
                return (_e = r.primary_phone) !== null && _e !== void 0 ? _e : "";
            case "notes":
                return getFamilyNotes(r);
            default:
                return "";
        }
    }));
    downloadCsv("families.csv", rowsToCsv(hdrs, dataRows));
}
export function FamiliesListClient({ rows, counts, locationNameById, }) {
    const [localRows, setLocalRows] = useState(rows);
    const [notesPopoverRowId, setNotesPopoverRowId] = useState(null);
    useEffect(() => {
        setLocalRows(rows);
    }, [rows]);
    const { sortKey, sortDir, toggleSort } = useCrmSort("list-families");
    const { emitLocalPatch } = useCrmLocalPatch("families", (rowId, patch) => {
        var _a;
        const metadataNotes = (_a = patch.metadata) === null || _a === void 0 ? void 0 : _a.notes;
        if (typeof metadataNotes !== "string" && metadataNotes !== null)
            return;
        setLocalRows((prev) => prev.map((row) => row.id === rowId ? withFamilyNotes(row, metadataNotes !== null && metadataNotes !== void 0 ? metadataNotes : "") : row));
    });
    const inlineEdit = useInlineCrmEdit({
        resource: "families",
        toPatch: ({ rowId, columnKey, value }) => {
            var _a;
            if (columnKey === "primary_contact")
                return { primary_contact_name: value || null };
            if (columnKey === "email")
                return { primary_email: value || null };
            if (columnKey === "phone")
                return { primary_phone: value || null };
            if (columnKey === "notes") {
                const row = localRows.find((it) => it.id === rowId);
                const metadata = (_a = row === null || row === void 0 ? void 0 : row.metadata) !== null && _a !== void 0 ? _a : {};
                return { metadata: Object.assign(Object.assign({}, metadata), { notes: value || null }) };
            }
            throw new Error(`Unsupported editable families column: ${columnKey}`);
        },
        onOptimisticUpdate: ({ rowId, columnKey, value }) => {
            setLocalRows((prev) => prev.map((row) => {
                if (row.id !== rowId)
                    return row;
                if (columnKey === "primary_contact") {
                    return Object.assign(Object.assign({}, row), { primary_contact_name: value || null });
                }
                if (columnKey === "email")
                    return Object.assign(Object.assign({}, row), { primary_email: value || null });
                if (columnKey === "phone")
                    return Object.assign(Object.assign({}, row), { primary_phone: value || null });
                if (columnKey === "notes")
                    return withFamilyNotes(row, value);
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
                if (columnKey === "primary_contact") {
                    return Object.assign(Object.assign({}, row), { primary_contact_name: value || null });
                }
                if (columnKey === "email")
                    return Object.assign(Object.assign({}, row), { primary_email: value || null });
                if (columnKey === "phone")
                    return Object.assign(Object.assign({}, row), { primary_phone: value || null });
                if (columnKey === "notes")
                    return withFamilyNotes(row, value);
                return row;
            }));
            if (columnKey === "notes") {
                emitLocalPatch(rowId, { metadata: { notes: value || null } });
            }
        },
    });
    const bulk = useMemo(() => ({
        rowIds: localRows.map((r) => r.id),
        rowLabelsById: Object.fromEntries(localRows.map((r) => { var _a; return [r.id, (_a = r.name) !== null && _a !== void 0 ? _a : r.id]; })),
        resource: "families",
        buildExport: (visibility) => exportFamiliesCsv(localRows, counts, visibility, locationNameById),
    }), [localRows, counts, locationNameById]);
    return (_jsxs(_Fragment, { children: [inlineEdit.toast ? (_jsx("div", { className: "mb-2 flex justify-end", children: _jsx("button", { type: "button", onClick: inlineEdit.clearToast, className: "rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-200", children: inlineEdit.toast.message }) })) : null, _jsx(CRMListTableSection, { tableId: "list-families", columnKeys: [...COLUMN_KEYS], headers: [...HEADERS], bulk: bulk, sortKey: sortKey, sortDir: sortDir, sortableColumnKeys: SORTABLE_COLUMN_KEYS, onSortColumn: toggleSort, children: localRows.map((r) => {
                    var _a, _b, _c, _d, _e, _f, _g;
                    const familyName = (_a = r.name) !== null && _a !== void 0 ? _a : r.id;
                    return (_jsxs("tr", { className: "border-b border-[var(--z-border,#1c1c1e)] last:border-0 hover:bg-white/5", children: [_jsx(BulkSelectCell, { rowId: r.id }), _jsx("td", { className: "px-4 py-2 font-semibold text-[var(--z-fg,#f0f0f0)]", children: _jsx(Link, { href: `/crm/families/${r.id}`, className: "hover:text-[var(--z-accent,#00ff88)]", children: r.name }) }), _jsx(EditableCell, { rowId: r.id, columnKey: "primary_contact", label: `primary contact name for ${familyName}`, value: primaryContactName(r), className: "px-4 py-2 text-[var(--z-muted,#909098)]", isEditing: inlineEdit.isEditingCell(r.id, "primary_contact"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, children: primaryContactName(r) }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: (_b = counts[r.id]) !== null && _b !== void 0 ? _b : 0 }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: r.primary_location_id
                                    ? (_c = locationNameById[r.primary_location_id]) !== null && _c !== void 0 ? _c : r.primary_location_id
                                    : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: r.is_military ? "Yes" : "No" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: typeof r.rate_tier === "number" && !Number.isNaN(r.rate_tier)
                                    ? r.rate_tier
                                    : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: formatLifetimePaidCents(r) || "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted,#909098)]", children: typeof r.balance === "number"
                                    ? `$${r.balance.toFixed(2)}`
                                    : "—" }), _jsx(EditableCell, { rowId: r.id, columnKey: "email", label: `email for ${familyName}`, value: (_d = r.primary_email) !== null && _d !== void 0 ? _d : "", className: "px-4 py-2 text-[var(--z-muted,#909098)]", isEditing: inlineEdit.isEditingCell(r.id, "email"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, children: (_e = r.primary_email) !== null && _e !== void 0 ? _e : "—" }), _jsx(EditableCell, { rowId: r.id, columnKey: "phone", label: `phone for ${familyName}`, value: (_f = r.primary_phone) !== null && _f !== void 0 ? _f : "", className: "px-4 py-2 text-[var(--z-muted,#909098)]", isEditing: inlineEdit.isEditingCell(r.id, "phone"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, children: (_g = r.primary_phone) !== null && _g !== void 0 ? _g : "—" }), _jsx(EditableCell, { rowId: r.id, columnKey: "notes", label: `notes for ${familyName}`, value: getFamilyNotes(r), className: "px-4 py-2 text-[var(--z-muted,#909098)]", isEditing: inlineEdit.isEditingCell(r.id, "notes"), isSaving: inlineEdit.isSaving, startEditing: inlineEdit.startEditing, bindInputProps: inlineEdit.bindInputProps, notesPopover: {
                                    isOpen: notesPopoverRowId === r.id,
                                    value: inlineEdit.draftValue,
                                    onOpen: () => {
                                        const initial = getFamilyNotes(r);
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
                                } })] }, r.id));
                }) })] }));
}
