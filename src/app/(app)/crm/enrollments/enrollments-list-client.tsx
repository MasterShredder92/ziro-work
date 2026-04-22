"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Enrollment } from "@/lib/types/crm";
import { CRMListTableSection } from "../ColumnVisibilityMenu";
import { BulkSelectCell } from "../crm-list-selection";
import { downloadCsv, rowsToCsv } from "../exportCsv";
import { useCrmLocalPatch } from "../_components/hooks/useCrmLocalPatch";
import { useInlineCrmEdit } from "../_components/hooks/useInlineCrmEdit";
import { EditableCell } from "../table-shell";
import { useCrmSort } from "../useCrmSort";
import { EnrollmentRowActions } from "./_client";

const COLUMN_KEYS = [
  "student",
  "teacher",
  "status",
  "start",
  "end",
  "updated",
  "notes",
  "actions",
] as const;

const HEADERS = [
  "Student",
  "Teacher",
  "Status",
  "Start",
  "End",
  "Updated",
  "Notes",
  "",
] as const;

const SORTABLE_COLUMN_KEYS = ["status", "start", "end", "updated"] as const;

/**
 * Safe metadata handling for Enrollments.
 * Supabase types metadata as 'Json', which causes spread errors in Turbopack/TypeScript.
 */
interface EnrollmentMetadata {
  notes?: string | null;
  [key: string]: unknown;
}

function parseMetadata(raw: unknown): EnrollmentMetadata {
  if (typeof raw === "object" && raw !== null) {
    return raw as EnrollmentMetadata;
  }
  return {};
}

function getEnrollmentNotes(row: Enrollment): string {
  const metadata = parseMetadata(row.metadata);
  return metadata.notes ?? "";
}

function withEnrollmentNotes(row: Enrollment, notes: string): Enrollment {
  const metadata = parseMetadata(row.metadata);
  return {
    ...row,
    metadata: {
      ...metadata,
      notes: notes || null,
    },
  } as Enrollment;
}

function exportEnrollmentsCsv(
  rows: Enrollment[],
  studentNameById: Record<string, string>,
  teacherNameById: Record<string, string>,
  visibility: Record<string, boolean>,
): void {
  const idxs = COLUMN_KEYS.map((_, i) => i).filter(
    (i) => visibility[COLUMN_KEYS[i]!] !== false,
  );
  const hdrs = idxs.map((i) =>
    HEADERS[i] ||
    (COLUMN_KEYS[i] === "actions" ? "Actions" : `Column ${i}`),
  );
  const dataRows = rows.map((r) =>
    idxs.map((i) => {
      const k = COLUMN_KEYS[i]!;
      switch (k) {
        case "student":
          return studentNameById[r.student_id] ?? r.student_id;
        case "teacher":
          return teacherNameById[r.teacher_id] ?? r.teacher_id;
        case "status":
          return r.status ?? "";
        case "start":
          return r.start_date ?? "";
        case "end":
          return r.end_date ?? "";
        case "updated":
          return r.updated_at.slice(0, 10);
        case "notes":
          return getEnrollmentNotes(r);
        case "actions":
          return r.id;
        default:
          return "";
      }
    }),
  );
  downloadCsv("enrollments.csv", rowsToCsv(hdrs, dataRows));
}

export function EnrollmentsListClient({
  rows,
  studentNameById,
  teacherNameById,
  teacherOptions,
  statuses,
}: {
  rows: Enrollment[];
  studentNameById: Record<string, string>;
  teacherNameById: Record<string, string>;
  teacherOptions: Array<{ id: string; label: string }>;
  statuses: string[];
}) {
  const [localRows, setLocalRows] = useState(rows);
  const [notesPopoverRowId, setNotesPopoverRowId] = useState<string | null>(null);

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const { sortKey, sortDir, toggleSort } = useCrmSort("list-enrollments");

  const teacherLabelById = useMemo(
    () =>
      Object.fromEntries(
        teacherOptions.map((t) => [t.id, t.label]),
      ) as Record<string, string>,
    [teacherOptions],
  );

  const { emitLocalPatch } = useCrmLocalPatch("enrollments", (rowId, patch) => {
    const patchMetadata = parseMetadata(patch.metadata);
    const metadataNotes = patchMetadata.notes;
    if (typeof metadataNotes !== "string" && metadataNotes !== null) return;
    setLocalRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? withEnrollmentNotes(row, metadataNotes ?? "") : row,
      ),
    );
  });

  const inlineEdit = useInlineCrmEdit({
    resource: "enrollments",
    toPatch: ({ rowId, columnKey, value }) => {
      if (columnKey === "status") return { status: value };
      if (columnKey === "teacher") return { teacher_id: value };
      if (columnKey === "notes") {
        const row = localRows.find((it) => it.id === rowId);
        const metadata = parseMetadata(row?.metadata);
        return { metadata: { ...metadata, notes: value || null } };
      }
      throw new Error(`Unsupported editable enrollments column: ${columnKey}`);
    },
    onOptimisticUpdate: ({ rowId, columnKey, value }) => {
      setLocalRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          if (columnKey === "status") return { ...row, status: value };
          if (columnKey === "teacher") return { ...row, teacher_id: value };
          if (columnKey === "notes") return withEnrollmentNotes(row, value);
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
          if (row.id !== rowId) return row;
          if (columnKey === "status") return { ...row, status: value };
          if (columnKey === "teacher") return { ...row, teacher_id: value };
          if (columnKey === "notes") return withEnrollmentNotes(row, value);
          return row;
        }),
      );
      if (columnKey === "notes") {
        emitLocalPatch(rowId, { metadata: { notes: value || null } });
      }
    },
  });

  const bulk = useMemo(
    () => ({
      rowIds: localRows.map((r) => r.id),
      rowLabelsById: Object.fromEntries(
        localRows.map((r) => [
          r.id,
          studentNameById[r.student_id] ?? r.student_id,
        ]),
      ) as Record<string, string>,
      resource: "enrollments" as const,
      buildExport: (visibility: Record<string, boolean>) =>
        exportEnrollmentsCsv(
          localRows,
          studentNameById,
          teacherNameById,
          visibility,
        ),
    }),
    [localRows, studentNameById, teacherNameById],
  );

  return (
    <>
            <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
              <Link
                href={`/crm/students/${r.student_id}`}
                className="hover:text-[var(--z-accent,#00ff88)]"
              >
                {studentNameById[r.student_id] ?? r.student_id}
              </Link>
            </td>
            <EditableCell
              rowId={r.id}
              columnKey="teacher"
              label={`teacher for ${studentNameById[r.student_id] ?? r.student_id}`}
              value={r.teacher_id}
              className="px-4 py-2 text-[var(--z-muted,#909098)]"
              isEditing={inlineEdit.isEditingCell(r.id, "teacher")}
              isSaving={inlineEdit.isSaving}
              startEditing={inlineEdit.startEditing}
              bindInputProps={inlineEdit.bindInputProps}
              selectOptions={teacherOptions.map((t) => ({
                value: t.id,
                label: t.label,
              }))}
            >
              <Link
                href={`/crm/teachers/${r.teacher_id}`}
                className="hover:text-[var(--z-accent,#00ff88)]"
              >
                {teacherLabelById[r.teacher_id] ?? teacherNameById[r.teacher_id] ?? r.teacher_id}
              </Link>
            </EditableCell>
            <EditableCell
              rowId={r.id}
              columnKey="status"
              label={`status for ${studentNameById[r.student_id] ?? r.student_id}`}
              value={r.status}
              className="px-4 py-2 text-[var(--z-muted,#909098)]"
              isEditing={inlineEdit.isEditingCell(r.id, "status")}
              isSaving={inlineEdit.isSaving}
              startEditing={inlineEdit.startEditing}
              bindInputProps={inlineEdit.bindInputProps}
              selectOptions={statuses.map((s) => ({ value: s, label: s }))}
            >
              {r.status}
            </EditableCell>
            <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
              {r.start_date ?? "—"}
            </td>
            <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
              {r.end_date ?? "—"}
            </td>
            <td className="px-4 py-2 text-[var(--z-muted,#707078)]">
              {r.updated_at.slice(0, 10)}
            </td>
            <EditableCell
              rowId={r.id}
              columnKey="notes"
              label={`notes for ${studentNameById[r.student_id] ?? r.student_id}`}
              value={getEnrollmentNotes(r)}
              className="px-4 py-2 text-[var(--z-muted,#909098)]"
              isEditing={inlineEdit.isEditingCell(r.id, "notes")}
              isSaving={inlineEdit.isSaving}
              startEditing={inlineEdit.startEditing}
              bindInputProps={inlineEdit.bindInputProps}
              notesPopover={{
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
              }}
            />
            <td className="px-4 py-2 text-right">
              <EnrollmentRowActions
                enrollmentId={r.id}
                status={r.status}
                teacherId={r.teacher_id}
                teachers={teacherOptions}
                statuses={statuses}
              />
            </td>
          </tr>
        ))}
      </CRMListTableSection>
    </>
  );
}
