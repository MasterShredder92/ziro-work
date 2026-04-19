"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Family as FamilyRow } from "@/lib/types/entities";
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
] as const;

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
] as const;

const SORTABLE_COLUMN_KEYS = [
  "family",
  "primary_contact",
  "balance",
  "email",
  "phone",
  "studio",
  "lifetime_paid",
] as const;

function getFamilyNotes(row: FamilyRow): string {
  const metadata = (row as FamilyRow & { metadata?: { notes?: string | null } }).metadata;
  return metadata?.notes ?? "";
}

function withFamilyNotes(row: FamilyRow, notes: string): FamilyRow {
  const metadata =
    (row as FamilyRow & { metadata?: Record<string, unknown> }).metadata ?? {};
  return {
    ...row,
    metadata: {
      ...metadata,
      notes: notes || null,
    },
  } as FamilyRow;
}

function primaryContactName(f: FamilyRow): string {
  const fromParts =
    [f.parent_first_name, f.parent_last_name].filter(Boolean).join(" ").trim() ||
    "—";
  return f.primary_contact_name ?? f.parent_name ?? fromParts;
}

function formatLifetimePaidCents(row: FamilyRow): string {
  const cents = row.lifetime_paid_cents;
  if (typeof cents !== "number" || Number.isNaN(cents)) return "";
  return `$${(cents / 100).toFixed(2)}`;
}

function exportFamiliesCsv(
  rows: FamilyRow[],
  counts: Record<string, number>,
  visibility: Record<string, boolean>,
  locationNameById: Record<string, string>,
): void {
  const idxs = COLUMN_KEYS.map((_, i) => i).filter(
    (i) => visibility[COLUMN_KEYS[i]!] !== false,
  );
  const hdrs = idxs.map((i) => HEADERS[i]!);
  const dataRows = rows.map((r) =>
    idxs.map((i) => {
      const k = COLUMN_KEYS[i]!;
      switch (k) {
        case "family":
          return r.name ?? "";
        case "primary_contact":
          return primaryContactName(r);
        case "students":
          return String(counts[r.id] ?? 0);
        case "studio":
          return r.primary_location_id
            ? locationNameById[r.primary_location_id] ?? r.primary_location_id
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
          return r.primary_email ?? "";
        case "phone":
          return r.primary_phone ?? "";
        case "notes":
          return getFamilyNotes(r);
        default:
          return "";
      }
    }),
  );
  downloadCsv("families.csv", rowsToCsv(hdrs, dataRows));
}

export function FamiliesListClient({
  rows,
  counts,
  locationNameById,
}: {
  rows: FamilyRow[];
  counts: Record<string, number>;
  locationNameById: Record<string, string>;
}) {
  const [localRows, setLocalRows] = useState(rows);
  const [notesPopoverRowId, setNotesPopoverRowId] = useState<string | null>(null);
  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);
  const { sortKey, sortDir, toggleSort } = useCrmSort("list-families");
  const { emitLocalPatch } = useCrmLocalPatch("families", (rowId, patch) => {
    const metadataNotes = (patch.metadata as { notes?: unknown } | undefined)?.notes;
    if (typeof metadataNotes !== "string" && metadataNotes !== null) return;
    setLocalRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? withFamilyNotes(row, metadataNotes ?? "") : row,
      ),
    );
  });
  const inlineEdit = useInlineCrmEdit({
    resource: "families",
    toPatch: ({ rowId, columnKey, value }) => {
      if (columnKey === "primary_contact") return { primary_contact_name: value || null };
      if (columnKey === "email") return { primary_email: value || null };
      if (columnKey === "phone") return { primary_phone: value || null };
      if (columnKey === "notes") {
        const row = localRows.find((it) => it.id === rowId);
        const metadata =
          (row as FamilyRow & { metadata?: Record<string, unknown> } | undefined)
            ?.metadata ?? {};
        return { metadata: { ...metadata, notes: value || null } };
      }
      throw new Error(`Unsupported editable families column: ${columnKey}`);
    },
    onOptimisticUpdate: ({ rowId, columnKey, value }) => {
      setLocalRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          if (columnKey === "primary_contact") {
            return { ...row, primary_contact_name: value || null };
          }
          if (columnKey === "email") return { ...row, primary_email: value || null };
          if (columnKey === "phone") return { ...row, primary_phone: value || null };
          if (columnKey === "notes") return withFamilyNotes(row, value);
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
          if (columnKey === "primary_contact") {
            return { ...row, primary_contact_name: value || null };
          }
          if (columnKey === "email") return { ...row, primary_email: value || null };
          if (columnKey === "phone") return { ...row, primary_phone: value || null };
          if (columnKey === "notes") return withFamilyNotes(row, value);
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
        localRows.map((r) => [r.id, r.name ?? r.id]),
      ) as Record<string, string>,
      resource: "families" as const,
      buildExport: (visibility: Record<string, boolean>) =>
        exportFamiliesCsv(localRows, counts, visibility, locationNameById),
    }),
    [localRows, counts, locationNameById],
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
        tableId="list-families"
        columnKeys={[...COLUMN_KEYS]}
        headers={[...HEADERS]}
        bulk={bulk}
        sortKey={sortKey}
        sortDir={sortDir}
        sortableColumnKeys={SORTABLE_COLUMN_KEYS}
        onSortColumn={toggleSort}
      >
        {localRows.map((r) => {
          const familyName = r.name ?? r.id;
          return (
            <tr
              key={r.id}
              className="border-b border-[var(--z-border,#1c1c1e)] last:border-0 hover:bg-white/5"
            >
              <BulkSelectCell rowId={r.id} />
              <td className="px-4 py-2 font-semibold text-[var(--z-fg,#f0f0f0)]">
                <Link
                  href={`/crm/families/${r.id}`}
                  className="hover:text-[var(--z-accent,#00ff88)]"
                >
                  {r.name}
                </Link>
              </td>
              <EditableCell
                rowId={r.id}
                columnKey="primary_contact"
                label={`primary contact name for ${familyName}`}
                value={primaryContactName(r)}
                className="px-4 py-2 text-[var(--z-muted,#909098)]"
                isEditing={inlineEdit.isEditingCell(r.id, "primary_contact")}
                isSaving={inlineEdit.isSaving}
                startEditing={inlineEdit.startEditing}
                bindInputProps={inlineEdit.bindInputProps}
              >
                {primaryContactName(r)}
              </EditableCell>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {counts[r.id] ?? 0}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {r.primary_location_id
                  ? locationNameById[r.primary_location_id] ??
                    r.primary_location_id
                  : "—"}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {r.is_military ? "Yes" : "No"}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {typeof r.rate_tier === "number" && !Number.isNaN(r.rate_tier)
                  ? r.rate_tier
                  : "—"}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {formatLifetimePaidCents(r) || "—"}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted,#909098)]">
                {typeof r.balance === "number"
                  ? `$${r.balance.toFixed(2)}`
                  : "—"}
              </td>
              <EditableCell
                rowId={r.id}
                columnKey="email"
                label={`email for ${familyName}`}
                value={r.primary_email ?? ""}
                className="px-4 py-2 text-[var(--z-muted,#909098)]"
                isEditing={inlineEdit.isEditingCell(r.id, "email")}
                isSaving={inlineEdit.isSaving}
                startEditing={inlineEdit.startEditing}
                bindInputProps={inlineEdit.bindInputProps}
              >
                {r.primary_email ?? "—"}
              </EditableCell>
              <EditableCell
                rowId={r.id}
                columnKey="phone"
                label={`phone for ${familyName}`}
                value={r.primary_phone ?? ""}
                className="px-4 py-2 text-[var(--z-muted,#909098)]"
                isEditing={inlineEdit.isEditingCell(r.id, "phone")}
                isSaving={inlineEdit.isSaving}
                startEditing={inlineEdit.startEditing}
                bindInputProps={inlineEdit.bindInputProps}
              >
                {r.primary_phone ?? "—"}
              </EditableCell>
              <EditableCell
                rowId={r.id}
                columnKey="notes"
                label={`notes for ${familyName}`}
                value={getFamilyNotes(r)}
                className="px-4 py-2 text-[var(--z-muted,#909098)]"
                isEditing={inlineEdit.isEditingCell(r.id, "notes")}
                isSaving={inlineEdit.isSaving}
                startEditing={inlineEdit.startEditing}
                bindInputProps={inlineEdit.bindInputProps}
                notesPopover={{
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
                }}
              />
            </tr>
          );
        })}
      </CRMListTableSection>
    </>
  );
}
