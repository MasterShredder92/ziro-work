"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeAccessTimestamp } from "@/lib/files/formatters";
import type { FileFolder, FileObject } from "@/lib/files/types";
import { moveFolderAction } from "@/app/(app)/files/actions/moveFolderAction";
import { renameFolderAction } from "@/app/(app)/files/actions/renameFolderAction";
import { useFilesExplorerRuntimeOptional } from "../context/FilesExplorerRuntimeContext";
import { FilesLoading } from "./FilesStates";
import { showFilesToast } from "./filesToast";
import {
  FolderColorDot,
  FolderColorPicker,
  folderColorTooltip,
  isFolderColorTag,
} from "./FolderColorPicker";
import {
  FolderIconGlyph,
  FolderIconPicker,
  folderIconTooltip,
  isFolderIconTag,
} from "./FolderIconPicker";
import {
  FolderDescriptionEditor,
  folderDescriptionPreview,
  normalizeFolderDescription,
} from "./FolderDescriptionEditor";
import { MoveFolderModal } from "./MoveFolderModal";
import { INLINE_RENAME_INPUT_CLASS, useInlineRename } from "./useInlineRename";
import {
  applyOptimisticFolderParent,
  folderWritableAsMoveDestination,
  validateFolderMove,
} from "./useMoveFolder";

export interface FileListProps {
  files: FileObject[];
  /** Subfolders of the current explorer folder (shown above file rows). */
  folderRows?: FileFolder[];
  emptyLabel?: string;
  loading?: boolean;
  canWrite?: boolean;
  selectedIds?: Set<string>;
  onRowSelect?: (
    file: FileObject,
    index: number,
    e: React.MouseEvent,
  ) => void;
  onRename?: (id: string, name: string) => Promise<void>;
  /** When set, opens inline rename for this file id (e.g. keyboard shortcut from parent). */
  renameRequestId?: string | null;
  onRenameRequestConsumed?: () => void;
  /** Navigate into a subfolder (SPA); falls back to `<Link>` if omitted. */
  onFolderNavigate?: (folderId: string) => void;
  /** Persist `metadata.colorTag`; caller handles optimistic sync/revert. */
  onFolderColorChange?: (
    folderId: string,
    colorTag: string | null,
  ) => Promise<void>;
  onFolderIconChange?: (folderId: string, icon: string | null) => Promise<void>;
  onFolderDescriptionChange?: (
    folderId: string,
    description: string | null,
  ) => Promise<void>;
  onOpenShareLinks?: (folder: FileFolder) => void;
  /** Shown in the table when there are folder rows but zero file rows (e.g. search). */
  filesEmptyHint?: string;
}

function formatBytes(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let idx = 0;
  let v = n;
  while (v >= 1024 && idx < units.length - 1) {
    v /= 1024;
    idx += 1;
  }
  return `${v.toFixed(v >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso.slice(0, 10);
  }
}

function renderAccessOrUpdated(
  metadata: Record<string, unknown> | undefined,
  fallbackIso: string | null | undefined,
): { label: string; title?: string } {
  const normalized = normalizeAccessTimestamp(metadata);
  if (normalized.iso) {
    return { label: normalized.relative, title: new Date(normalized.iso).toLocaleString() };
  }
  if (fallbackIso) return { label: formatDate(fallbackIso) };
  return { label: "—" };
}

const COL_COUNT_WITH_SELECT = 7;
const COL_COUNT_NO_SELECT = 6;

function folderSortIndex(f: FileFolder): number {
  const raw = f.metadata?.sortIndex;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return 1_000_000;
}

function sortChildFolderRows(rows: FileFolder[]): FileFolder[] {
  return [...rows].sort((a, b) => {
    const ai = folderSortIndex(a);
    const bi = folderSortIndex(b);
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });
}

export function FileList({
  files,
  folderRows = [],
  emptyLabel = "No files yet.",
  loading,
  canWrite = false,
  selectedIds,
  onRowSelect,
  onRename,
  renameRequestId,
  onRenameRequestConsumed,
  onFolderNavigate,
  onFolderColorChange,
  onFolderIconChange,
  onFolderDescriptionChange,
  onOpenShareLinks,
  filesEmptyHint = "No files in this folder.",
}: FileListProps) {
  const router = useRouter();
  const interactive = Boolean(canWrite && selectedIds && onRowSelect);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const renameRef = useRef<HTMLInputElement | null>(null);

  const [folderNameOverride, setFolderNameOverride] = useState<Record<string, string>>({});
  const [folderRenamingId, setFolderRenamingId] = useState<string | null>(null);
  const [folderRenameSaving, setFolderRenameSaving] = useState(false);

  const explorerRuntime = useFilesExplorerRuntimeOptional();
  const fullFolders = useMemo(
    () => explorerRuntime?.folders ?? [],
    [explorerRuntime],
  );
  const listParentKey = useMemo(() => {
    if (folderRows.length === 0) return null;
    return folderRows[0]!.parentId ?? null;
  }, [folderRows]);

  const [movedOutIds, setMovedOutIds] = useState<string[]>([]);
  const [movedInById, setMovedInById] = useState<Record<string, FileFolder>>({});
  const [folderMenuOpenId, setFolderMenuOpenId] = useState<string | null>(null);
  const [folderColorPickerForId, setFolderColorPickerForId] = useState<string | null>(null);
  const [folderIconPickerForId, setFolderIconPickerForId] = useState<string | null>(null);
  const [folderDescriptionPickerForId, setFolderDescriptionPickerForId] = useState<string | null>(
    null,
  );
  const [folderDescriptionDraft, setFolderDescriptionDraft] = useState<string | null>(null);
  const [moveModalFolderId, setMoveModalFolderId] = useState<string | null>(null);
  const [folderColorOverride, setFolderColorOverride] = useState<
    Record<string, string | null | undefined>
  >({});
  const [folderIconOverride, setFolderIconOverride] = useState<
    Record<string, string | null | undefined>
  >({});
  const [folderDescriptionOverride, setFolderDescriptionOverride] = useState<
    Record<string, string | null | undefined>
  >({});

  const folderRowsSig = useMemo(
    () => folderRows.map((f) => `${f.id}:${f.parentId ?? ""}`).join("|"),
    [folderRows],
  );
  useEffect(() => {
    queueMicrotask(() => {
      setMovedOutIds([]);
      setMovedInById({});
      setFolderColorOverride({});
      setFolderIconOverride({});
      setFolderDescriptionOverride({});
    });
  }, [folderRowsSig]);

  const displayFolderRows = useMemo(() => {
    const base = folderRows.filter((f) => !movedOutIds.includes(f.id));
    const extras = Object.values(movedInById).filter(
      (f) => (f.parentId ?? null) === (listParentKey ?? null),
    );
    const map = new Map<string, FileFolder>();
    for (const f of base) map.set(f.id, f);
    for (const f of extras) map.set(f.id, f);
    return sortChildFolderRows([...map.values()]);
  }, [folderRows, movedOutIds, movedInById, listParentKey]);

  const resolvedFolderRows = useMemo(
    () =>
      displayFolderRows.map((f) => {
        const colorOverride = folderColorOverride[f.id];
        const iconOverride = folderIconOverride[f.id];
        const descriptionOverride = folderDescriptionOverride[f.id];
        return {
          ...f,
          name: folderNameOverride[f.id] ?? f.name,
          metadata: {
            ...(f.metadata ?? {}),
            ...(colorOverride === undefined ? {} : { colorTag: colorOverride }),
            ...(iconOverride === undefined ? {} : { icon: iconOverride }),
            ...(descriptionOverride === undefined ? {} : { description: descriptionOverride }),
          },
        };
      }),
    [
      displayFolderRows,
      folderNameOverride,
      folderColorOverride,
      folderIconOverride,
      folderDescriptionOverride,
    ],
  );

  const folderRenameOriginal =
    folderRenamingId != null
      ? (folderNameOverride[folderRenamingId] ??
          displayFolderRows.find((f) => f.id === folderRenamingId)?.name ??
          "")
      : "";

  const {
    draft: folderRenameDraft,
    setDraft: setFolderRenameDraft,
    inputRef: folderRenameInputRef,
    skipBlurSaveRef: folderSkipBlurRef,
    cancelWithoutBlurSave: cancelFolderDraft,
  } = useInlineRename({
    originalName: folderRenameOriginal,
    isEditing: folderRenamingId != null,
  });

  const cancelFolderListRename = useCallback(() => {
    const id = folderRenamingId;
    const revert = id ? (folderRows.find((f) => f.id === id)?.name ?? "") : "";
    cancelFolderDraft(revert);
    setFolderRenamingId(null);
  }, [folderRenamingId, folderRows, cancelFolderDraft]);

  const commitFolderListRename = useCallback(async () => {
    const id = folderRenamingId;
    if (!id || !canWrite || folderRenameSaving) return;
    const trimmed = folderRenameDraft.trim();
    const baseline = folderRows.find((f) => f.id === id)?.name ?? "";
    if (!trimmed) {
      cancelFolderDraft(baseline);
      setFolderRenamingId(null);
      return;
    }
    if (trimmed === baseline) {
      setFolderRenamingId(null);
      return;
    }
    setFolderRenameSaving(true);
    setFolderNameOverride((prev) => ({ ...prev, [id]: trimmed }));
    const res = await renameFolderAction(id, trimmed);
    if (!res.ok) {
      setFolderNameOverride((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      showFilesToast(res.error, "error");
    } else {
      showFilesToast("Folder renamed.", "success");
      setFolderNameOverride((prev) => ({ ...prev, [id]: res.data.name }));
    }
    setFolderRenameSaving(false);
    setFolderRenamingId(null);
  }, [
    folderRenamingId,
    canWrite,
    folderRenameSaving,
    folderRenameDraft,
    folderRows,
    cancelFolderDraft,
  ]);

  const beginRename = useCallback(
    (f: FileObject) => {
      if (!onRename) return;
      setRenameId(f.id);
      setRenameVal(f.name);
      requestAnimationFrame(() => renameRef.current?.focus());
    },
    [onRename],
  );

  useEffect(() => {
    if (!renameRequestId || !onRename) return;
    const f = files.find((x) => x.id === renameRequestId);
    queueMicrotask(() => {
      if (f) beginRename(f);
      onRenameRequestConsumed?.();
    });
  }, [renameRequestId, files, onRename, beginRename, onRenameRequestConsumed]);

  useEffect(() => {
    if (!canWrite) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "F2") return;
      if (moveModalFolderId) return;
      if (folderColorPickerForId || folderIconPickerForId || folderDescriptionPickerForId) return;
      const t = e.target as HTMLElement | null;
      const row = t?.closest?.("tr[data-folder-row]");
      if (!row) return;
      const id = row.getAttribute("data-folder-id");
      if (!id || folderRenamingId) return;
      e.preventDefault();
      setFolderRenamingId(id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    canWrite,
    folderRenamingId,
    moveModalFolderId,
    folderColorPickerForId,
    folderIconPickerForId,
    folderDescriptionPickerForId,
  ]);

  const commitRename = useCallback(async () => {
    if (!renameId || !onRename) return;
    const name = renameVal.trim();
    if (name) await onRename(renameId, name);
    setRenameId(null);
  }, [onRename, renameId, renameVal]);

  const openMoveFolderModal = useCallback(
    (folderId: string) => {
      if (!fullFolders.length) {
        showFilesToast("Folder tree is not available here.", "error");
        return;
      }
      setFolderMenuOpenId(null);
      setFolderColorPickerForId(null);
      setFolderIconPickerForId(null);
      setFolderDescriptionPickerForId(null);
      setMoveModalFolderId(folderId);
    },
    [fullFolders.length],
  );

  const commitFolderMove = useCallback(
    async (folderId: string, newParentId: string | null) => {
      if (!canWrite) return;
      const list = fullFolders;
      if (!list.length) return;
      const err = validateFolderMove(list, folderId, newParentId);
      if (err) {
        showFilesToast(err, "error");
        return;
      }
      if (
        !folderWritableAsMoveDestination(
          list,
          newParentId,
          explorerRuntime?.permissionContext ?? null,
        )
      ) {
        showFilesToast("You cannot move a folder into that location.", "error");
        return;
      }
      const selfRow = folderRows.find((f) => f.id === folderId);
      const wasUnderList =
        !!selfRow && (selfRow.parentId ?? null) === (listParentKey ?? null);
      const stillUnderList = (newParentId ?? null) === (listParentKey ?? null);
      const prevOut = movedOutIds;
      const prevIn = { ...movedInById };
      const optimisticRow = applyOptimisticFolderParent(list, folderId, newParentId).find(
        (f) => f.id === folderId,
      );
      if (wasUnderList && !stillUnderList) {
        setMovedOutIds((prev) => (prev.includes(folderId) ? prev : [...prev, folderId]));
        setMovedInById((prev) => {
          const next = { ...prev };
          delete next[folderId];
          return next;
        });
      } else if (!wasUnderList && stillUnderList && optimisticRow) {
        setMovedInById((prev) => ({ ...prev, [folderId]: optimisticRow }));
        setMovedOutIds((prev) => prev.filter((id) => id !== folderId));
      }
      const res = await moveFolderAction(folderId, { parentId: newParentId });
      if (!res.ok) {
        setMovedOutIds(prevOut);
        setMovedInById(prevIn);
        showFilesToast(res.error, "error");
        return;
      }
      showFilesToast("Folder moved.", "success");
      setMoveModalFolderId(null);
      router.refresh();
    },
    [
      canWrite,
      fullFolders,
      explorerRuntime,
      folderRows,
      listParentKey,
      movedOutIds,
      movedInById,
      router,
    ],
  );

  useEffect(() => {
    if (!folderMenuOpenId) return;
    let remove: (() => void) | undefined;
    const t = window.setTimeout(() => {
      const onDocClick = () => {
        setFolderMenuOpenId(null);
        setFolderColorPickerForId(null);
        setFolderIconPickerForId(null);
        setFolderDescriptionPickerForId(null);
      };
      window.addEventListener("click", onDocClick);
      remove = () => window.removeEventListener("click", onDocClick);
    }, 0);
    return () => {
      window.clearTimeout(t);
      remove?.();
    };
  }, [folderMenuOpenId]);

  useEffect(() => {
    if (!folderColorPickerForId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setFolderColorPickerForId(null);
      setFolderMenuOpenId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [folderColorPickerForId]);

  useEffect(() => {
    if (!folderIconPickerForId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setFolderIconPickerForId(null);
      setFolderMenuOpenId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [folderIconPickerForId]);

  useEffect(() => {
    if (!folderDescriptionPickerForId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setFolderDescriptionPickerForId(null);
      setFolderMenuOpenId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [folderDescriptionPickerForId]);

  const handleFolderColorChange = useCallback(
    async (folderId: string, colorTag: string | null) => {
      if (!onFolderColorChange) return;
      const previousRaw = resolvedFolderRows.find((folder) => folder.id === folderId)?.metadata
        ?.colorTag;
      const previousColor = isFolderColorTag(previousRaw) ? previousRaw : null;
      setFolderColorOverride((prev) => ({ ...prev, [folderId]: colorTag ?? null }));
      try {
        await onFolderColorChange(folderId, colorTag);
      } catch {
        setFolderColorOverride((prev) => ({ ...prev, [folderId]: previousColor }));
      }
    },
    [onFolderColorChange, resolvedFolderRows],
  );

  const handleFolderIconChange = useCallback(
    async (folderId: string, icon: string | null) => {
      if (!onFolderIconChange) return;
      const previousRaw = resolvedFolderRows.find((folder) => folder.id === folderId)?.metadata
        ?.icon;
      const previousIcon = isFolderIconTag(previousRaw) ? previousRaw : null;
      setFolderIconOverride((prev) => ({ ...prev, [folderId]: icon ?? null }));
      try {
        await onFolderIconChange(folderId, icon);
      } catch {
        setFolderIconOverride((prev) => ({ ...prev, [folderId]: previousIcon }));
      }
    },
    [onFolderIconChange, resolvedFolderRows],
  );

  const handleFolderDescriptionChange = useCallback(
    async (folderId: string, description: string | null) => {
      if (!onFolderDescriptionChange) return;
      const previousRaw = resolvedFolderRows.find((folder) => folder.id === folderId)?.metadata
        ?.description;
      const previousDescription =
        typeof previousRaw === "string" ? normalizeFolderDescription(previousRaw) : null;
      setFolderDescriptionOverride((prev) => ({ ...prev, [folderId]: description ?? null }));
      try {
        await onFolderDescriptionChange(folderId, description);
      } catch {
        setFolderDescriptionOverride((prev) => ({ ...prev, [folderId]: previousDescription }));
      }
    },
    [onFolderDescriptionChange, resolvedFolderRows],
  );

  const colCount = interactive ? COL_COUNT_WITH_SELECT : COL_COUNT_NO_SELECT;

  if (loading) {
    return (
      <div className="overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
        <div className="animate-pulse space-y-0 divide-y divide-[var(--z-border)] p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 py-3">
              <div className="h-4 flex-1 rounded bg-white/[0.06]" />
              <div className="h-4 w-24 rounded bg-white/[0.06]" />
              <div className="h-4 w-16 rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--z-border)] px-4 py-3">
          <FilesLoading label="Loading files..." />
        </div>
      </div>
    );
  }

  if (files.length === 0 && displayFolderRows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface)]/40 p-10 text-center text-sm text-[var(--z-muted)]">
        {emptyLabel}
      </div>
    );
  }

  const folderNavigate = (folderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    onFolderNavigate?.(folderId);
  };

  return (
    <div className="max-h-[min(70vh,720px)] overflow-auto rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] transition-shadow duration-200">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-[var(--z-surface)] text-left text-xs uppercase tracking-wider text-[var(--z-muted)] shadow-[0_1px_0_var(--z-border)]">
          <tr>
            {interactive ? (
              <th className="w-10 px-2 py-3 font-medium">
                <span className="sr-only">Select</span>
              </th>
            ) : null}
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Size</th>
            <th className="px-4 py-3 font-medium">Visibility</th>
            <th className="px-4 py-3 font-medium">Signature</th>
            <th className="px-4 py-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--z-border)]">
          {resolvedFolderRows.map((folder) => {
            const colorTag = isFolderColorTag(folder.metadata?.colorTag)
              ? folder.metadata?.colorTag
              : null;
            const iconTag = isFolderIconTag(folder.metadata?.icon) ? folder.metadata?.icon : null;
            const descriptionRaw =
              typeof folder.metadata?.description === "string" ? folder.metadata.description : null;
            const description = normalizeFolderDescription(descriptionRaw);
            const descriptionPreview = folderDescriptionPreview(description, 60);
            const isFolderRenaming = folderRenamingId === folder.id;
            const menuOpen = folderMenuOpenId === folder.id;

            return (
              <tr
                key={`folder-${folder.id}`}
                data-folder-row
                data-folder-id={folder.id}
                className="group relative bg-white/[0.02] outline-none hover:bg-white/[0.04] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--z-accent)]"
                onDoubleClick={() => {
                  if (onFolderNavigate) onFolderNavigate(folder.id);
                }}
                onContextMenu={(e) => {
                  if (!canWrite || !fullFolders.length || isFolderRenaming) return;
                  e.preventDefault();
                  setFolderMenuOpenId(folder.id);
                  setFolderColorPickerForId(null);
                  setFolderIconPickerForId(null);
                  setFolderDescriptionPickerForId(null);
                }}
              >
                {interactive ? (
                  <td className="px-2 py-3 text-[var(--z-muted)]" aria-label="Folders">
                    <span className="sr-only">Not applicable</span>
                    <span className="text-[10px] text-[var(--z-muted)]">—</span>
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span title={folderIconTooltip(iconTag)} aria-label={folderIconTooltip(iconTag)}>
                      <FolderIconGlyph icon={iconTag} className="text-[var(--z-fg)]/80" />
                    </span>
                    {colorTag ? (
                      <span title={folderColorTooltip(colorTag)} aria-label={folderColorTooltip(colorTag)}>
                        <FolderColorDot colorTag={colorTag} />
                      </span>
                    ) : null}
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {isFolderRenaming ? (
                        <input
                          ref={folderRenameInputRef}
                          disabled={folderRenameSaving}
                          value={folderRenameDraft}
                          onChange={(e) => setFolderRenameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void commitFolderListRename();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              cancelFolderListRename();
                            }
                          }}
                          onBlur={() => {
                            if (folderSkipBlurRef.current) return;
                            void commitFolderListRename();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Rename folder ${folder.name}`}
                          className={`${INLINE_RENAME_INPUT_CLASS} min-w-0 flex-1 outline-none`}
                        />
                      ) : canWrite ? (
                        <button
                          type="button"
                          onClick={() => setFolderRenamingId(folder.id)}
                          className="min-w-0 truncate text-left font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]"
                        >
                          {folder.name}
                        </button>
                      ) : onFolderNavigate ? (
                        <button
                          type="button"
                          onClick={(e) => folderNavigate(folder.id, e)}
                          className="min-w-0 truncate text-left font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]"
                        >
                          {folder.name}
                        </button>
                      ) : (
                        <Link
                          href={`/files/explorer?folderId=${encodeURIComponent(folder.id)}`}
                          className="min-w-0 truncate font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]"
                        >
                          {folder.name}
                        </Link>
                      )}
                      {!isFolderRenaming && descriptionPreview ? (
                        <span
                          className="truncate text-[11px] text-[var(--z-muted)]"
                          title={description ?? undefined}
                        >
                          {descriptionPreview}
                        </span>
                      ) : null}
                      {onFolderNavigate && !isFolderRenaming ? (
                        <button
                          type="button"
                          onClick={(e) => folderNavigate(folder.id, e)}
                          className="shrink-0 rounded border border-[var(--z-border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)] hover:border-[var(--z-accent)] hover:text-[var(--z-accent)]"
                        >
                          Open
                        </button>
                      ) : null}
                      {canWrite && fullFolders.length > 0 && !isFolderRenaming ? (
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderMenuOpenId((cur) => (cur === folder.id ? null : folder.id));
                              setFolderColorPickerForId(null);
                              setFolderIconPickerForId(null);
                              setFolderDescriptionPickerForId(null);
                            }}
                            className="rounded border border-[var(--z-border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)] hover:border-[var(--z-accent)] hover:text-[var(--z-accent)]"
                          >
                            â‹¯
                          </button>
                          {menuOpen ? (
                            <div
                              role="menu"
                              className="absolute right-0 z-20 mt-1 min-w-[9rem] rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] py-1 text-xs shadow-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                role="menuitem"
                                className="block w-full px-3 py-2 text-left text-[var(--z-fg)] hover:bg-white/[0.05]"
                                onClick={() => openMoveFolderModal(folder.id)}
                              >
                                Move to...
                              </button>
                              {onFolderColorChange ? (
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="block w-full px-3 py-2 text-left text-[var(--z-fg)] hover:bg-white/[0.05]"
                                  onClick={() => {
                                    setFolderColorPickerForId((current) =>
                                      current === folder.id ? null : folder.id,
                                    );
                                    setFolderIconPickerForId(null);
                                  }}
                                >
                                  Set Color
                                </button>
                              ) : null}
                              {onFolderIconChange ? (
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="block w-full px-3 py-2 text-left text-[var(--z-fg)] hover:bg-white/[0.05]"
                                  onClick={() => {
                                    setFolderIconPickerForId((current) =>
                                      current === folder.id ? null : folder.id,
                                    );
                                    setFolderColorPickerForId(null);
                                    setFolderDescriptionPickerForId(null);
                                  }}
                                >
                                  Set Icon
                                </button>
                              ) : null}
                              {onFolderDescriptionChange ? (
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="block w-full px-3 py-2 text-left text-[var(--z-fg)] hover:bg-white/[0.05]"
                                  onClick={() => {
                                    setFolderDescriptionDraft(description);
                                    setFolderDescriptionPickerForId((current) =>
                                      current === folder.id ? null : folder.id,
                                    );
                                    setFolderColorPickerForId(null);
                                    setFolderIconPickerForId(null);
                                  }}
                                >
                                  Set Description
                                </button>
                              ) : null}
                              {onOpenShareLinks ? (
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="block w-full px-3 py-2 text-left text-[var(--z-fg)] hover:bg-white/[0.05]"
                                  onClick={() => {
                                    onOpenShareLinks(folder);
                                    setFolderDescriptionPickerForId(null);
                                    setFolderColorPickerForId(null);
                                    setFolderIconPickerForId(null);
                                    setFolderMenuOpenId(null);
                                  }}
                                >
                                  Share links
                                </button>
                              ) : null}
                              {folderColorPickerForId === folder.id && onFolderColorChange ? (
                                <div className="px-2 pb-2 pt-1">
                                  <FolderColorPicker
                                    value={colorTag}
                                    onChange={(nextColorTag) => {
                                      void handleFolderColorChange(folder.id, nextColorTag).finally(
                                        () => {
                                          setFolderColorPickerForId(null);
                                          setFolderIconPickerForId(null);
                                          setFolderDescriptionPickerForId(null);
                                          setFolderMenuOpenId(null);
                                        },
                                      );
                                    }}
                                  />
                                </div>
                              ) : null}
                              {folderIconPickerForId === folder.id && onFolderIconChange ? (
                                <div className="px-2 pb-2 pt-1">
                                  <FolderIconPicker
                                    value={iconTag}
                                    onChange={(nextIcon) => {
                                      void handleFolderIconChange(folder.id, nextIcon).finally(
                                        () => {
                                          setFolderIconPickerForId(null);
                                          setFolderColorPickerForId(null);
                                          setFolderDescriptionPickerForId(null);
                                          setFolderMenuOpenId(null);
                                        },
                                      );
                                    }}
                                  />
                                </div>
                              ) : null}
                              {folderDescriptionPickerForId === folder.id &&
                              onFolderDescriptionChange ? (
                                <div className="px-2 pb-2 pt-1">
                                  <FolderDescriptionEditor
                                    value={folderDescriptionDraft}
                                    onChange={setFolderDescriptionDraft}
                                    onCancel={() => {
                                      setFolderDescriptionDraft(description);
                                      setFolderDescriptionPickerForId(null);
                                      setFolderMenuOpenId(null);
                                    }}
                                    onSave={() => {
                                      const nextDescription = normalizeFolderDescription(
                                        folderDescriptionDraft,
                                      );
                                      void handleFolderDescriptionChange(
                                        folder.id,
                                        nextDescription,
                                      ).finally(() => {
                                        setFolderDescriptionPickerForId(null);
                                        setFolderColorPickerForId(null);
                                        setFolderIconPickerForId(null);
                                        setFolderMenuOpenId(null);
                                      });
                                    }}
                                  />
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--z-muted)]">Folder</td>
                <td className="px-4 py-3 text-xs text-[var(--z-muted)]">—</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full border border-[var(--z-border)] px-2 py-0.5 text-xs text-[var(--z-muted)]">
                    {folder.visibility}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--z-muted)]">—</td>
                <td className="px-4 py-3 text-xs text-[var(--z-muted)]">
                  {(() => {
                    const access = renderAccessOrUpdated(folder.metadata, folder.updatedAt);
                    return <span title={access.title}>{access.label}</span>;
                  })()}
                </td>
              </tr>
            );
          })}
          {files.map((f, index) => (
            <tr
              key={f.id}
              className={`hover:bg-white/[0.02] ${selectedIds?.has(f.id) ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)]" : ""}`}
            >
              {interactive ? (
                <td className="px-2 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds?.has(f.id) ?? false}
                    onClick={(e) => onRowSelect?.(f, index, e)}
                    readOnly
                    className="accent-[var(--z-accent)]"
                    aria-label={`Select ${f.name}`}
                  />
                </td>
              ) : null}
              <td className="px-4 py-3">
                {renameId === f.id ? (
                  <input
                    ref={renameRef}
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onBlur={() => void commitRename()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void commitRename();
                      if (e.key === "Escape") setRenameId(null);
                    }}
                    className="w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-sm"
                  />
                ) : (
                  <>
                    <Link
                      href={`/files/${f.id}`}
                      className="font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]"
                    >
                      {f.name}
                    </Link>
                    {canWrite && onRename ? (
                      <button
                        type="button"
                        onClick={() => beginRename(f)}
                        className="ml-2 text-[10px] uppercase tracking-wide text-[var(--z-muted)] hover:text-[var(--z-accent)]"
                      >
                        Rename
                      </button>
                    ) : null}
                    {f.description ? (
                      <div className="mt-0.5 line-clamp-1 text-xs text-[var(--z-muted)]">
                        {f.description}
                      </div>
                    ) : null}
                  </>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-[var(--z-muted)]">
                {f.mimeType || "—"}
              </td>
              <td className="px-4 py-3 text-xs text-[var(--z-muted)]">
                {formatBytes(f.size)}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full border border-[var(--z-border)] px-2 py-0.5 text-xs text-[var(--z-muted)]">
                  {f.visibility}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-[var(--z-muted)]">
                {f.signatureStatus ?? "—"}
              </td>
              <td className="px-4 py-3 text-xs text-[var(--z-muted)]">
                {(() => {
                  const access = renderAccessOrUpdated(f.metadata, f.updatedAt);
                  return <span title={access.title}>{access.label}</span>;
                })()}
              </td>
            </tr>
          ))}
          {files.length === 0 && displayFolderRows.length > 0 ? (
            <tr>
              <td
                colSpan={colCount}
                className="px-4 py-6 text-center text-sm text-[var(--z-muted)]"
              >
                {filesEmptyHint}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {moveModalFolderId && fullFolders.length > 0 ? (
        <MoveFolderModal
          open
          folders={fullFolders}
          movingFolderId={moveModalFolderId}
          defaultDestinationParentId={
            fullFolders.find((f) => f.id === moveModalFolderId)?.parentId ?? null
          }
          permissionContext={explorerRuntime?.permissionContext ?? null}
          onClose={() => setMoveModalFolderId(null)}
          onConfirm={(newParentId) => void commitFolderMove(moveModalFolderId, newParentId)}
        />
      ) : null}
    </div>
  );
}




