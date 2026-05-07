"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { crmProfileHref } from "@/lib/crm";
import type { Contact } from "@/lib/types/crm";
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
] as const;

const HEADERS = [
  "Name",
  "Role",
  "Email",
  "Phone",
  "Stage / Status",
  "Notes",
  "Updated",
] as const;

const SORTABLE_COLUMN_KEYS = [
  "name",
  "role",
  "email",
  "phone",
  "stage_status",
  "updated",
] as const;

function exportContactsCsv(
  contacts: Contact[],
  visibility: Record<string, boolean>,
): void {
  const idxs = COLUMN_KEYS.map((_, i) => i).filter(
    (i) => visibility[COLUMN_KEYS[i]!] !== false,
  );
  const hdrs = idxs.map((i) => HEADERS[i]!);
  const rows = contacts.map((c) =>
    idxs.map((i) => {
      const k = COLUMN_KEYS[i]!;
      switch (k) {
        case "name":
          return c.fullName;
        case "role":
          return c.kind;
        case "email":
          return c.email ?? "";
        case "phone":
          return c.phone ?? "";
        case "stage_status":
          return c.stage ?? c.status ?? "";
        case "notes":
          return "";
        case "updated":
          return c.updatedAt ? c.updatedAt.slice(0, 10) : "";
        default:
          return "";
      }
    }),
  );
  downloadCsv("contacts.csv", rowsToCsv(hdrs, rows));
}

export function ContactsListClient({ contacts }: { contacts: Contact[] }) {
  const [rows, setRows] = useState(() => contacts);
  const [notesById, setNotesById] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      contacts.map((c) => {
        const raw =
          (c as Contact & { notes?: string | null }).notes ??
          ((c as Contact & { metadata?: { notes?: string | null } }).metadata?.notes ??
            "");
        return [c.id, raw ?? ""];
      }),
    ),
  );
  const [notesPopoverRowId, setNotesPopoverRowId] = useState<string | null>(null);
  const { sortKey, sortDir, toggleSort } = useCrmSort("list-contacts");
  const { emitLocalPatch } = useCrmLocalPatch("contacts", (rowId, patch) => {
    const notesPatch =
      typeof patch.notes === "string"
        ? patch.notes
        : (patch.notes as null | undefined) === null
          ? ""
          : typeof (patch.metadata as { notes?: unknown } | undefined)?.notes ===
              "string"
            ? String((patch.metadata as { notes?: unknown }).notes)
            : null;
    if (notesPatch === null) return;
    setNotesById((prev) => ({ ...prev, [rowId]: notesPatch }));
  });
  const inlineEdit = useInlineCrmEdit({
    resource: "contacts",
    toPatch: ({ rowId, columnKey, value }) => {
      if (columnKey === "name") {
        const [first, ...rest] = value.split(" ");
        return {
          firstName: first ?? "",
          lastName: rest.join(" ") || null,
        };
      }
      if (columnKey === "email") return { email: value || null };
      if (columnKey === "phone") return { phone: value || null };
      if (columnKey === "notes") {
        const row = rows.find((it) => it.id === rowId);
        if (row?.kind === "lead" || row?.kind === "student") {
          return { notes: value || null };
        }
        const metadata =
          (row as Contact & { metadata?: Record<string, unknown> } | undefined)
            ?.metadata ?? {};
        return { metadata: { ...metadata, notes: value || null } };
      }
      throw new Error(`Unsupported editable contacts column: ${columnKey}`);
    },
    onOptimisticUpdate: ({ rowId, columnKey, value }) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          if (columnKey === "name") {
            const [first, ...rest] = value.split(" ");
            return {
              ...row,
              firstName: first ?? null,
              lastName: rest.join(" ") || null,
              fullName: value || "Unnamed",
            };
          }
          if (columnKey === "email") return { ...row, email: value || null };
          if (columnKey === "phone") return { ...row, phone: value || null };
          return row;
        }),
      );
      if (columnKey === "notes") {
        setNotesById((prev) => ({ ...prev, [rowId]: value }));
        emitLocalPatch(rowId, { notes: value || null });
      }
    },
    onRevert: ({ rowId, columnKey, value }) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          if (columnKey === "name") {
            const [first, ...rest] = value.split(" ");
            return {
              ...row,
              firstName: first ?? null,
              lastName: rest.join(" ") || null,
              fullName: value || "Unnamed",
            };
          }
          if (columnKey === "email") return { ...row, email: value || null };
          if (columnKey === "phone") return { ...row, phone: value || null };
          return row;
        }),
      );
      if (columnKey === "notes") {
        setNotesById((prev) => ({ ...prev, [rowId]: value }));
        emitLocalPatch(rowId, { notes: value || null });
      }
    },
  });
  const bulk = useMemo(
    () => ({
      rowIds: rows.map((c) => c.id),
      rowLabelsById: Object.fromEntries(
        rows.map((c) => [c.id, c.fullName]),
      ) as Record<string, string>,
      resource: "contacts" as const,
      buildExport: (visibility: Record<string, boolean>) =>
        exportContactsCsv(rows, visibility),
    }),
    [rows],
  );

  return (
    <>
      {inlineEdit.toast ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={inlineEdit.clearToast}
            className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-200"
          >
            {inlineEdit.toast.message}
          </button>
        </div>
      ) : null}
      <CRMListTableSection
        tableId="list-contacts"
        columnKeys={[...COLUMN_KEYS]}
        headers={[...HEADERS]}
        bulk={bulk}
        sortKey={sortKey}
        sortDir={sortDir}
        sortableColumnKeys={SORTABLE_COLUMN_KEYS}
        onSortColumn={toggleSort}
      >
        {rows.map((c) => (
          <tr
            key={c.id}
            className="border-b border-[#1c1c1e] last:border-0 hover:bg-white/5"
          >
            <BulkSelectCell rowId={c.id} />
            <EditableCell
              rowId={c.id}
              columnKey="name"
              label={`name for ${c.fullName}`}
              value={c.fullName}
              className="px-4 py-2 font-semibold text-[#f0f0f0]"
              isEditing={inlineEdit.isEditingCell(c.id, "name")}
              isSaving={inlineEdit.isSaving}
              startEditing={inlineEdit.startEditing}
              bindInputProps={inlineEdit.bindInputProps}
            >
              <Link
                href={crmProfileHref(c.kind, c.sourceId)}
                className="hover:text-[#c4f036]"
              >
                {c.fullName}
              </Link>
            </EditableCell>
            <td className="px-4 py-2 text-[#909098]">{c.kind}</td>
            <EditableCell
              rowId={c.id}
              columnKey="email"
              label={`email for ${c.fullName}`}
              value={c.email ?? ""}
              className="px-4 py-2 text-[#909098]"
              isEditing={inlineEdit.isEditingCell(c.id, "email")}
              isSaving={inlineEdit.isSaving}
              startEditing={inlineEdit.startEditing}
              bindInputProps={inlineEdit.bindInputProps}
            >
              {c.email ?? "—"}
            </EditableCell>
            <EditableCell
              rowId={c.id}
              columnKey="phone"
              label={`phone for ${c.fullName}`}
              value={c.phone ?? ""}
              className="px-4 py-2 text-[#909098]"
              isEditing={inlineEdit.isEditingCell(c.id, "phone")}
              isSaving={inlineEdit.isSaving}
              startEditing={inlineEdit.startEditing}
              bindInputProps={inlineEdit.bindInputProps}
            >
              {c.phone ?? "—"}
            </EditableCell>
            <td className="px-4 py-2 text-[#909098]">
              {c.stage ?? c.status ?? "—"}
            </td>
            <EditableCell
              rowId={c.id}
              columnKey="notes"
              label={`notes for ${c.fullName}`}
              value={notesById[c.id] ?? ""}
              className="px-4 py-2 text-[#909098]"
              isEditing={inlineEdit.isEditingCell(c.id, "notes")}
              isSaving={inlineEdit.isSaving}
              startEditing={inlineEdit.startEditing}
              bindInputProps={inlineEdit.bindInputProps}
              notesPopover={{
                isOpen: notesPopoverRowId === c.id,
                value: inlineEdit.draftValue,
                onOpen: () => {
                  inlineEdit.startEditing(c.id, "notes", notesById[c.id] ?? "");
                  inlineEdit.setDraftValue(notesById[c.id] ?? "");
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
              }}
            />
            <td className="px-4 py-2 text-[#707078]">
              {c.updatedAt ? c.updatedAt.slice(0, 10) : "—"}
            </td>
          </tr>
        ))}
      </CRMListTableSection>
    </>
  );
}
