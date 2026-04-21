"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { BulkActionBar, BulkMenuItem } from "./BulkActionBar";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { deleteManyCrmRows } from "./crm-bulk-delete";
import { useCRMListSelection } from "./crm-list-selection";
export function CRMListBulkChrome({ resource, buildExport, visibility, }) {
    const router = useRouter();
    const { selectedIds, clearSelection, rowIds } = useCRMListSelection();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const allowed = useMemo(() => new Set(rowIds), [rowIds]);
    const validSelected = useMemo(() => [...selectedIds].filter((id) => allowed.has(id)), [selectedIds, allowed]);
    const count = validSelected.length;
    const runDelete = useCallback(async () => {
        setDeleteBusy(true);
        try {
            await deleteManyCrmRows(resource, validSelected);
            clearSelection();
            setDeleteOpen(false);
            router.refresh();
        }
        finally {
            setDeleteBusy(false);
        }
    }, [validSelected, resource, clearSelection, router]);
    return (_jsxs(_Fragment, { children: [_jsx(BulkActionBar, { selectedCount: count, onRefresh: () => router.refresh(), children: ({ closeMenu }) => (_jsxs(_Fragment, { children: [_jsx(BulkMenuItem, { label: "Export CSV", onClick: () => {
                                buildExport(visibility);
                                closeMenu();
                            } }), _jsx(BulkMenuItem, { label: "Delete\u2026", destructive: true, onClick: () => {
                                setDeleteOpen(true);
                                closeMenu();
                            } }), _jsx(BulkMenuItem, { label: "Clear selection", onClick: () => {
                                clearSelection();
                                closeMenu();
                            } })] })) }), _jsx(ConfirmDeleteModal, { open: deleteOpen, title: "Delete selected rows?", body: `This will permanently delete ${count} selected row(s). This cannot be undone.`, busy: deleteBusy, onCancel: () => !deleteBusy && setDeleteOpen(false), onConfirm: runDelete })] }));
}
