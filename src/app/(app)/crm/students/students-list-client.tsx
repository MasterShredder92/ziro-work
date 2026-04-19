"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Student } from "@/lib/types/entities";
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
] as const;

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
] as const;

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
] as const;

function formatMoney(n: number | null | undefined): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "";
  return `$${n.toFixed(2)}`;
}

function exportStudentsCsv(
  rows: Student[],
  nextLessons: Record<string, string | undefined>,
  visibility: Record<string, boolean>,
  locationNameById: Record<string, string>,
): void {
  const idxs = COLUMN_KEYS.map((_, i) => i).filter(
    (i) => visibility[COLUMN_KEYS[i]!] !== false,
  );
  const hdrs = idxs.map((i) =>
    HEADERS[i] ||
    (COLUMN_KEYS[i] === "actions" ? "Scheduling" : `Column ${i}`),
  );
  const dataRows = rows.map((r) =>
    idxs.map((i) => {
      const k = COLUMN_KEYS[i]!;
      switch (k) {
        case "name":
          return `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim();
        case "status":
          return r.status ?? "";
        case "instrument":
          return r.instrument ?? "";
        case "studio":
          return r.location_id
            ? locationNameById[r.location_id] ?? r.location_id
            : "";
        case "teacher":
          return r.last_teacher_name ?? r.first_teacher_name ?? "";
        case "rate":
          return formatMoney(r.rate_per_session);
        case "paid":
          return formatMoney(r.total_paid);
        case "military":
          return r.is_military ? "Yes" : "No";
        case "family":
          return r.family_id ? "View family" : "";
        case "next_lesson":
          return nextLessons[r.id] ?? "";
        case "notes":
          return r.notes ?? "";
        case "actions":
          return `/schedule/student?studentId=${encodeURIComponent(r.id)}`;
        default:
          return "";
      }
    }),
  );
  downloadCsv("students.csv", rowsToCsv(hdrs, dataRows));
}

export function StudentsListClient({
  rows,
  nextLessons,
  locationNameById,
}: {
  rows: Student[];
  nextLessons: Record<string, string | undefined>;
  locationNameById: Record<string, string>;
}) {
  const [localRows, setLocalRows] = useState(rows);
  const [notesPopoverRowId, setNotesPopoverRowId] = useState<string | null>(null);
  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);
  const { sortKey, sortDir, toggleSort } = useCrmSort("list-students");
  const { emitLocalPatch } = useCrmLocalPatch("students", (rowId, patch) => {
    const notesPatch =
      typeof patch.notes === "string"
        ? patch.notes
        : patch.notes === null
          ? null
          : null;
    if (notesPatch === null && patch.notes !== null) return;
    setLocalRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, notes: notesPatch ?? null } : row,
      ),
    );
  });
  const statusOptions = useMemo(
    () => ["enrolled", "active", "inactive", "prospect"],
    [],
  );
  const instrumentOptions = useMemo(() => {
    const seeded = ["Piano", "Guitar", "Drums", "Voice", "Violin"];
    const fromRows = localRows
      .map((r) => r.instrument)
      .filter((v): v is string => Boolean(v));
    return Array.from(new Set([...seeded, ...fromRows])).sort();
  }, [localRows]);
  const inlineEdit = useInlineCrmEdit({
    resource: "students",
    toPatch: ({ columnKey, value }) => {
      if (columnKey === "name") {
        const [first, ...rest] = value.split(" ");
        return { first_name: first ?? "", last_name: rest.join(" ") || "" };
      }
      if (columnKey === "status") return { status: value };
      if (columnKey === "instrument") return { instrument: value || null };
      if (columnKey === "notes") return { notes: value || null };
      throw new Error(`Unsupported editable students column: ${columnKey}`);
    },
    onOptimisticUpdate: ({ rowId, columnKey, value }) => {
      setLocalRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          if (columnKey === "name") {
            const [first, ...rest] = value.split(" ");
            return { ...row, first_name: first ?? "", last_name: rest.join(" ") };
          }
          if (columnKey === "status") return { ...row, status: value };
          if (columnKey === "instrument") return { ...row, instrument: value || null };
          if (columnKey === "notes") return { ...row, notes: value || null };
          return row;
        }),
      );
      if (columnKey === "notes") emitLocalPatch(rowId, { notes: value || null });
    },
    onRevert: ({ rowId, columnKey, value }) => {
      setLocalRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          if (columnKey === "name") {
            const [first, ...rest] = value.split(" ");
            return { ...row, first_name: first ?? "", last_name: rest.join(" ") };
          }
          if (columnKey === "status") return { ...row, status: value };
          if (columnKey === "instrument") return { ...row, instrument: value || null };
          if (columnKey === "notes") return { ...row, notes: value || null };
          return row;
        }),
      );
      if (columnKey === "notes") emitLocalPatch(rowId, { notes: value || null });
    },
  });
  const bulk = useMemo(
    () => ({
      rowIds: localRows.map((r) => r.id),
      rowLabelsById: Object.fromEntries(
        localRows.map((r) => [
          r.id,
          `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.id,
        ]),
      ) as Record<string, string>,
      resource: "students" as const,
      buildExport: (visibility: Record<string, boolean>) =>
        exportStudentsCsv(localRows, nextLessons, visibility, locationNameById),
    }),
    [localRows, nextLessons, locationNameById],
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
        tableId="list-students"
        columnKeys={[...COLUMN_KEYS]}
        headers={[...HEADERS]}
        bulk={bulk}
        sortKey={sortKey}
        sortDir={sortDir}
        sortableColumnKeys={SORTABLE_COLUMN_KEYS}
        onSortColumn={toggleSort}
      >
        {localRows.map((r) => {
          const fullName = `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.id;
          return (
            <tr
              key={r.id}
              className="border-b border-[var(--z-border,#1c1c1e)] last:border-0 hover:bg-white/5"
            >
              <BulkSelectCell rowId={r.id} />
              <EditableCell
                rowId={r.id}
                columnKey="name"
                label={`name for ${fullName}`}
                value={fullName}
                className="px-4 py-2 font-semibold text-[var(--z-fg,#f0f0f0)]"
                isEditing={inlineEdit.isEditingCell(r.id, "name")}
                isSaving={inlineEdit.isSaving}
                startEditing={inlineEdit.startEditing}
                bindInputProps={inlineEdit.bindInputProps}
              >
                <Link
                  href={`/crm/students/${r.id}`}
                  className="hover:text-[var(--z-accent,#00ff88)]"
                >
                  {fullName}
                </Link>
              </EditableCell>
              <EditableCell
                rowId={r.id}
                columnKey="status"
                label={`status for ${fullName}`}
                value={r.status ?? ""}
                className="px-4 py-2 text-[var(--z-muted,#909098)]"
                isEditing={inlineEdit.isEditingCell(r.id, "status")}
                isSaving={inlineEdit.isSaving}
                startEditing={inlineEdit.startEditing}
                bindInputProps={inlineEdit.bindInputProps}
                selectOptions={statusOptions.map((opt) => ({ value: opt, label: opt }))}
              >
                {r.status}
              </EditableCell>
              <EditableCell
                rowId={r.id}
                columnKey="instrument"
                label={`primary instrument for ${fullName}`}
                value={r.instrument ?? ""}
                className="px-4 py-2 text-[var(--z-muted,#909098)]"
                isEditing={inlineEdit.isEditingCell(r.id, "instrument")}
                isSaving={inlineEdit.isSaving}
                startEditing={inlineEdit.startEditing}
                bindInputProps={inlineEdit.bindInputProps}
                selectOptions={instrumentOptions.map((opt) => ({
                  value: opt,
                  label: opt,
                }))}
              >
                {r.instrument ?? "—"}
              </EditableCell>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {r.location_id
                  ? locationNameById[r.location_id] ?? r.location_id
                  : "—"}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {r.last_teacher_name ?? r.first_teacher_name ?? "—"}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {typeof r.rate_per_session === "number" &&
                !Number.isNaN(r.rate_per_session)
                  ? formatMoney(r.rate_per_session)
                  : "—"}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {typeof r.total_paid === "number" && !Number.isNaN(r.total_paid)
                  ? formatMoney(r.total_paid)
                  : "—"}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {r.is_military ? "Yes" : "No"}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {r.family_id ? (
                  <Link
                    href={`/crm/families/${r.family_id}`}
                    className="text-[var(--z-accent,#00ff88)] hover:underline"
                  >
                    View family
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="max-w-[200px] truncate px-4 py-2 text-[var(--z-muted,#909098)]">
                {nextLessons[r.id] ?? "—"}
              </td>
              <EditableCell
                rowId={r.id}
                columnKey="notes"
                label={`notes for ${fullName}`}
                value={r.notes ?? ""}
                className="px-4 py-2 text-[var(--z-muted,#909098)]"
                isEditing={inlineEdit.isEditingCell(r.id, "notes")}
                isSaving={inlineEdit.isSaving}
                startEditing={inlineEdit.startEditing}
                bindInputProps={inlineEdit.bindInputProps}
                notesPopover={{
                  isOpen: notesPopoverRowId === r.id,
                  value: inlineEdit.draftValue,
                  onOpen: () => {
                    inlineEdit.startEditing(r.id, "notes", r.notes ?? "");
                    inlineEdit.setDraftValue(r.notes ?? "");
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
                }}
              />
              <td className="whitespace-nowrap px-4 py-2 text-right text-[var(--z-muted,#909098)]">
                <Link
                  href={`/schedule/student?studentId=${encodeURIComponent(r.id)}`}
                  className="text-[var(--z-accent,#00ff88)] hover:underline"
                >
                  Scheduling
                </Link>
              </td>
            </tr>
          );
        })}
      </CRMListTableSection>
    </>
  );
}
