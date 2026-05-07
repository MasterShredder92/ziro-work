"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Teacher } from "@data/teachers";
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
] as const;

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
] as const;

const SORTABLE_COLUMN_KEYS = [
  "name",
  "status",
  "active",
  "email",
  "phone",
] as const;

function getTeacherNotes(row: Teacher): string {
  const metadata = (row as Teacher & { metadata?: { notes?: string | null } }).metadata;
  return metadata?.notes ?? "";
}

function withTeacherNotes(row: Teacher, notes: string): Teacher {
  const metadata = (row as Teacher & { metadata?: Record<string, unknown> }).metadata ?? {};
  return {
    ...row,
    metadata: {
      ...metadata,
      notes: notes || null,
    },
  } as Teacher;
}

function exportTeachersCsv(
  rows: Teacher[],
  activeByTeacher: Record<string, number>,
  totalByTeacher: Record<string, number>,
  headlines: Record<string, string | null | undefined>,
  visibility: Record<string, boolean>,
): void {
  const idxs = COLUMN_KEYS.map((_, i) => i).filter(
    (i) => visibility[COLUMN_KEYS[i]!] !== false,
  );
  const hdrs = idxs.map((i) => HEADERS[i]!);
  const dataRows = rows.map((r) => {
    const tid = r.id as string;
    const fullName =
      `${(r.first_name as string | null) ?? ""} ${(r.last_name as string | null) ?? ""}`.trim() ||
      "Unnamed";
    const name = (r.display_name as string | null) ?? fullName;
    return idxs.map((i) => {
      const k = COLUMN_KEYS[i]!;
      switch (k) {
        case "name":
          return name;
        case "status":
          return (r.status as string | null) ?? "";
        case "active":
          return r.is_active ? "Yes" : "No";
        case "active_students":
          return String(activeByTeacher[tid] ?? 0);
        case "enrollments":
          return String(totalByTeacher[tid] ?? 0);
        case "schedule":
          return headlines[tid] ?? "";
        case "email":
          return (r.email as string | null) ?? "";
        case "phone":
          return (r.phone as string | null) ?? "";
        case "notes":
          return getTeacherNotes(r);
        default:
          return "";
      }
    });
  });
  downloadCsv("teachers.csv", rowsToCsv(hdrs, dataRows));
}

export function TeachersListClient({
  rows,
  activeByTeacher,
  totalByTeacher,
  headlines,
}: {
  rows: Teacher[];
  activeByTeacher: Record<string, number>;
  totalByTeacher: Record<string, number>;
  headlines: Record<string, string | null | undefined>;
}) {
  const [localRows, setLocalRows] = useState(rows);
  const [notesPopoverRowId, setNotesPopoverRowId] = useState<string | null>(null);
  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);
  const { sortKey, sortDir, toggleSort } = useCrmSort("list-teachers");
  const { emitLocalPatch } = useCrmLocalPatch("teachers", (rowId, patch) => {
    const metadataNotes = (patch.metadata as { notes?: unknown } | undefined)?.notes;
    if (typeof metadataNotes !== "string" && metadataNotes !== null) return;
    setLocalRows((prev) =>
      prev.map((row) =>
        (row.id as string) === rowId
          ? withTeacherNotes(row, metadataNotes ?? "")
          : row,
      ),
    );
  });
  const inlineEdit = useInlineCrmEdit({
    resource: "teachers",
    toPatch: ({ rowId, columnKey, value }) => {
      if (columnKey === "name") {
        const [first, ...rest] = value.split(" ");
        return { first_name: first ?? "", last_name: rest.join(" ") || "" };
      }
      if (columnKey === "email") return { email: value || null };
      if (columnKey === "phone") return { phone: value || null };
      if (columnKey === "notes") {
        const row = localRows.find((it) => (it.id as string) === rowId);
        const metadata =
          (row as Teacher & { metadata?: Record<string, unknown> } | undefined)
            ?.metadata ?? {};
        return { metadata: { ...metadata, notes: value || null } };
      }
      throw new Error(`Unsupported editable teachers column: ${columnKey}`);
    },
    onOptimisticUpdate: ({ rowId, columnKey, value }) => {
      setLocalRows((prev) =>
        prev.map((row) => {
          if ((row.id as string) !== rowId) return row;
          if (columnKey === "name") {
            const [first, ...rest] = value.split(" ");
            return { ...row, first_name: first ?? "", last_name: rest.join(" ") };
          }
          if (columnKey === "email") return { ...row, email: value || null };
          if (columnKey === "phone") return { ...row, phone: value || null };
          if (columnKey === "notes") return withTeacherNotes(row, value);
          return row;
        }),
      );
      if (columnKey === "notes") {
        emitLocalPatch(rowId, { metadata: { notes: value || null } });
      }
    },
    onRevert: ({ rowId, columnKey, value }) => {
      setLocalRows((prev) =>
        prev.map((row) => {
          if ((row.id as string) !== rowId) return row;
          if (columnKey === "name") {
            const [first, ...rest] = value.split(" ");
            return { ...row, first_name: first ?? "", last_name: rest.join(" ") };
          }
          if (columnKey === "email") return { ...row, email: value || null };
          if (columnKey === "phone") return { ...row, phone: value || null };
          if (columnKey === "notes") return withTeacherNotes(row, value);
          return row;
        }),
      );
      if (columnKey === "notes") {
        emitLocalPatch(rowId, { metadata: { notes: value || null } });
      }
    },
  });
  const bulk = useMemo(() => {
    const labels = Object.fromEntries(
      localRows.map((r) => {
        const tid = r.id as string;
        const fullName =
          `${(r.first_name as string | null) ?? ""} ${(r.last_name as string | null) ?? ""}`.trim() ||
          "Unnamed";
        const name = (r.display_name as string | null) ?? fullName;
        return [tid, name];
      }),
    ) as Record<string, string>;
    return {
      rowIds: localRows.map((r) => r.id as string),
      rowLabelsById: labels,
      resource: "teachers" as const,
      buildExport: (visibility: Record<string, boolean>) =>
        exportTeachersCsv(
          localRows,
          activeByTeacher,
          totalByTeacher,
          headlines,
          visibility,
        ),
    };
  }, [localRows, activeByTeacher, totalByTeacher, headlines]);

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
        tableId="list-teachers"
        columnKeys={[...COLUMN_KEYS]}
        headers={[...HEADERS]}
        bulk={bulk}
        sortKey={sortKey}
        sortDir={sortDir}
        sortableColumnKeys={SORTABLE_COLUMN_KEYS}
        onSortColumn={toggleSort}
      >
        {localRows.map((r) => {
          const tid = r.id as string;
          const fullName =
            `${(r.first_name as string | null) ?? ""} ${(r.last_name as string | null) ?? ""}`.trim() ||
            "Unnamed";
          const name = (r.display_name as string | null) ?? fullName;
          return (
            <tr
              key={tid}
              className="border-b border-[var(--z-border,#1c1c1e)] last:border-0 hover:bg-white/5"
            >
              <BulkSelectCell rowId={tid} />
              <EditableCell
                rowId={tid}
                columnKey="name"
                label={`name for ${name}`}
                value={name}
                className="px-4 py-2 font-semibold text-[var(--z-fg,#f0f0f0)]"
                isEditing={inlineEdit.isEditingCell(tid, "name")}
                isSaving={inlineEdit.isSaving}
                startEditing={inlineEdit.startEditing}
                bindInputProps={inlineEdit.bindInputProps}
              >
                <Link
                  href={`/crm/teachers/${tid}`}
                  className="hover:text-[var(--z-accent,#c4f036)]"
                >
                  {name}
                </Link>
              </EditableCell>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {(r.status as string | null) ?? "—"}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {r.is_active ? "Yes" : "No"}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {activeByTeacher[tid] ?? 0}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {totalByTeacher[tid] ?? 0}
              </td>
              <td className="max-w-[220px] truncate px-4 py-2 text-[var(--z-muted,#909098)]">
                {headlines[tid] ?? "—"}
              </td>
              <EditableCell
                rowId={tid}
                columnKey="email"
                label={`email for ${name}`}
                value={(r.email as string | null) ?? ""}
                className="px-4 py-2 text-[var(--z-muted,#909098)]"
                isEditing={inlineEdit.isEditingCell(tid, "email")}
                isSaving={inlineEdit.isSaving}
                startEditing={inlineEdit.startEditing}
                bindInputProps={inlineEdit.bindInputProps}
              >
                {(r.email as string | null) ?? "—"}
              </EditableCell>
              <EditableCell
                rowId={tid}
                columnKey="phone"
                label={`phone for ${name}`}
                value={(r.phone as string | null) ?? ""}
                className="px-4 py-2 text-[var(--z-muted,#909098)]"
                isEditing={inlineEdit.isEditingCell(tid, "phone")}
                isSaving={inlineEdit.isSaving}
                startEditing={inlineEdit.startEditing}
                bindInputProps={inlineEdit.bindInputProps}
              >
                {(r.phone as string | null) ?? "—"}
              </EditableCell>
              <EditableCell
                rowId={tid}
                columnKey="notes"
                label={`notes for ${name}`}
                value={getTeacherNotes(r)}
                className="px-4 py-2 text-[var(--z-muted,#909098)]"
                isEditing={inlineEdit.isEditingCell(tid, "notes")}
                isSaving={inlineEdit.isSaving}
                startEditing={inlineEdit.startEditing}
                bindInputProps={inlineEdit.bindInputProps}
                notesPopover={{
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
                }}
              />
            </tr>
          );
        })}
      </CRMListTableSection>
    </>
  );
}
