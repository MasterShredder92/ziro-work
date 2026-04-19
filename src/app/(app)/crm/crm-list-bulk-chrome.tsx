"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { BulkActionBar, BulkMenuItem } from "./BulkActionBar";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import type { CRMListBulkResource } from "./crm-bulk-delete";
import { deleteManyCrmRows } from "./crm-bulk-delete";
import { useCRMListSelection } from "./crm-list-selection";

export function CRMListBulkChrome({
  resource,
  buildExport,
  visibility,
}: {
  resource: CRMListBulkResource;
  buildExport: (visibility: Record<string, boolean>) => void;
  visibility: Record<string, boolean>;
}) {
  const router = useRouter();
  const { selectedIds, clearSelection, rowIds } = useCRMListSelection();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const allowed = useMemo(() => new Set(rowIds), [rowIds]);
  const validSelected = useMemo(
    () => [...selectedIds].filter((id) => allowed.has(id)),
    [selectedIds, allowed],
  );
  const count = validSelected.length;

  const runDelete = useCallback(async () => {
    setDeleteBusy(true);
    try {
      await deleteManyCrmRows(resource, validSelected);
      clearSelection();
      setDeleteOpen(false);
      router.refresh();
    } finally {
      setDeleteBusy(false);
    }
  }, [validSelected, resource, clearSelection, router]);

  return (
    <>
      <BulkActionBar
        selectedCount={count}
        onRefresh={() => router.refresh()}
      >
        {({ closeMenu }) => (
          <>
            <BulkMenuItem
              label="Export CSV"
              onClick={() => {
                buildExport(visibility);
                closeMenu();
              }}
            />
            <BulkMenuItem
              label="Delete…"
              destructive
              onClick={() => {
                setDeleteOpen(true);
                closeMenu();
              }}
            />
            <BulkMenuItem
              label="Clear selection"
              onClick={() => {
                clearSelection();
                closeMenu();
              }}
            />
          </>
        )}
      </BulkActionBar>
      <ConfirmDeleteModal
        open={deleteOpen}
        title="Delete selected rows?"
        body={`This will permanently delete ${count} selected row(s). This cannot be undone.`}
        busy={deleteBusy}
        onCancel={() => !deleteBusy && setDeleteOpen(false)}
        onConfirm={runDelete}
      />
    </>
  );
}
