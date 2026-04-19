"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from "react";
import type { FileFolder } from "@/lib/files/types";
import { FilesError, FilesLoading } from "./FilesStates";
import { showFilesToast } from "./filesToast";
import { moveFolderAction } from "@/app/(app)/files/actions/moveFolderAction";
import { renameFolderAction } from "@/app/(app)/files/actions/renameFolderAction";
import { useFilesExplorerRuntimeOptional } from "../context/FilesExplorerRuntimeContext";
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
import { INLINE_RENAME_INPUT_CLASS, useInlineRename } from "./useInlineRename";
import { useAutoHeightTransition } from "./useAutoHeightTransition";
import {
  applyOptimisticFolderParent,
  folderWritableAsMoveDestination,
  validateFolderMove,
} from "./useMoveFolder";
import {
  buildVisibleTreeItems,
  getEffectiveExpanded,
  indexById,
  type VisibleTreeItem,
} from "./useTreeKeyboardNavigation";

const FOLDER_DRAG_MIME = "application/x-ziro-folder-id";

export interface FolderTreeProps {
  folders: FileFolder[];
  selectedId?: string | null;
  onSelect?: (folder: FileFolder | null) => void;
  loading?: boolean;
  error?: string | null;
  /** When true, sibling folders can be reordered via drag handle (persists `metadata.sortIndex`). */
  canWrite?: boolean;
  /** Called after a successful reorder PATCH (e.g. `router.refresh()`). */
  onFoldersReordered?: () => void;
  onFolderColorChange?: (folderId: string, colorTag: string | null) => Promise<void>;
  onFolderIconChange?: (folderId: string, icon: string | null) => Promise<void>;
  onFolderDescriptionChange?: (folderId: string, description: string | null) => Promise<void>;
  onOpenShareLinks?: (folder: FileFolder) => void;
}

interface TreeNode extends FileFolder {
  children: TreeNode[];
}

/** Lower values sort first; missing index sorts after explicit values, then by name. */
function getFolderSortIndex(folder: FileFolder): number {
  const raw = folder.metadata?.sortIndex;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return 1_000_000;
}

function orderedSiblingIds(all: FileFolder[], parentId: string | null): string[] {
  const rows = all.filter((f) => (f.parentId ?? null) === (parentId ?? null));
  rows.sort((a, b) => {
    const ai = getFolderSortIndex(a);
    const bi = getFolderSortIndex(b);
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });
  return rows.map((r) => r.id);
}

/**
 * Reorder siblings by removing `draggedId` and inserting relative to `targetId`.
 * `after === true` inserts after the target (including “end of list” when target is last).
 */
function buildReorderedSiblingIds(
  siblingIds: string[],
  draggedId: string,
  targetId: string,
  after: boolean,
): string[] | null {
  if (draggedId === targetId) return null;
  const from = siblingIds.indexOf(draggedId);
  const t = siblingIds.indexOf(targetId);
  if (from < 0 || t < 0) return null;
  const next = siblingIds.filter((id) => id !== draggedId);
  let insertAt = next.indexOf(targetId);
  if (insertAt < 0) return null;
  if (after) insertAt += 1;
  next.splice(insertAt, 0, draggedId);
  return next;
}

function buildTree(folders: FileFolder[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const f of folders) map.set(f.id, { ...f, children: [] });
  const roots: TreeNode[] = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      const ai = getFolderSortIndex(a);
      const bi = getFolderSortIndex(b);
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) sortNodes(n.children);
  };
  sortNodes(roots);
  return roots;
}

function NodeRow({
  node,
  depth,
  selectedId,
  onSelect,
  expanded,
  onToggle,
  treeId,
  visibleItems,
  idToIndex,
  focusedFolderId,
  setFocusedFolderId,
  canWrite,
  folders,
  dropIndicator,
  dropMoveIntoId,
  onDragStartRow,
  onDragEnd,
  onDragOverRow,
  onDropOnRow,
  onSetFolderColor,
  onSetFolderIcon,
  onSetFolderDescription,
  onOpenShareLinks,
  treeItemRefs,
  renamingFolderId,
  renameDraft,
  setRenameDraft,
  renameInputRef,
  renameSaving,
  onRenameBlur,
  onRenameInputKeyDown,
  onFolderLabelClick,
  onRequestRename,
}: {
  node: TreeNode;
  depth: number;
  selectedId?: string | null;
  onSelect?: (folder: FileFolder | null) => void;
  expanded: Record<string, boolean>;
  onToggle: (id: string, depth: number) => void;
  treeId: string;
  visibleItems: VisibleTreeItem[];
  idToIndex: Map<string, number>;
  focusedFolderId: string | null;
  setFocusedFolderId: (id: string | null) => void;
  canWrite?: boolean;
  folders: FileFolder[];
  dropIndicator: { targetId: string; after: boolean } | null;
  dropMoveIntoId: string | null;
  onDragStartRow: (id: string, parentId: string | null) => void;
  onDragEnd: () => void;
  onDragOverRow: (e: React.DragEvent, targetId: string, parentId: string | null) => void;
  onDropOnRow: (e: React.DragEvent, targetId: string, parentId: string | null) => void;
  onSetFolderColor: (folderId: string, colorTag: string | null) => void | Promise<void>;
  onSetFolderIcon: (folderId: string, icon: string | null) => void | Promise<void>;
  onSetFolderDescription: (folderId: string, description: string | null) => void | Promise<void>;
  onOpenShareLinks?: (folder: FileFolder) => void;
  treeItemRefs: MutableRefObject<Map<string, HTMLElement>>;
  renamingFolderId: string | null;
  renameDraft: string;
  setRenameDraft: (v: string) => void;
  renameInputRef: RefObject<HTMLInputElement | null>;
  renameSaving: boolean;
  onRenameBlur: () => void;
  onRenameInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFolderLabelClick: (folderId: string, e: React.MouseEvent) => void;
  onRequestRename: (folderId: string) => void;
}) {
  const isOpen = getEffectiveExpanded(node.id, depth, expanded);
  const hasChildren = node.children.length > 0;
  const childContentSig =
    node.children.length === 0 ? "" : node.children.map((c) => c.id).join("|");
  const branchOpen = hasChildren && isOpen;
  const { innerRef, outerStyle, onTransitionEnd } = useAutoHeightTransition(
    branchOpen,
    childContentSig,
  );
  const isSelected = selectedId === node.id;
  const parentId = node.parentId ?? null;
  const colorTag = isFolderColorTag(node.metadata?.colorTag)
    ? node.metadata?.colorTag
    : null;
  const iconTag = isFolderIconTag(node.metadata?.icon) ? node.metadata?.icon : null;
  const descriptionRaw =
    typeof node.metadata?.description === "string" ? node.metadata.description : null;
  const description = normalizeFolderDescription(descriptionRaw);
  const descriptionPreview = folderDescriptionPreview(description, 60);
  const [menuOpen, setMenuOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [descriptionPickerOpen, setDescriptionPickerOpen] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState<string | null>(description);

  useEffect(() => {
    setDescriptionDraft(description);
  }, [description, node.id]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = () => {
      setMenuOpen(false);
      setColorPickerOpen(false);
      setIconPickerOpen(false);
      setDescriptionPickerOpen(false);
    };
    window.addEventListener("click", onDocClick);
    return () => window.removeEventListener("click", onDocClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen && !colorPickerOpen && !iconPickerOpen && !descriptionPickerOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setColorPickerOpen(false);
      setIconPickerOpen(false);
      setDescriptionPickerOpen(false);
      setDescriptionDraft(description);
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [menuOpen, colorPickerOpen, iconPickerOpen, descriptionPickerOpen, description]);

  const rovingTabIndex =
    (focusedFolderId ?? visibleItems[0]?.id ?? null) === node.id ? 0 : -1;

  const onTreeItemKeyDown = (e: React.KeyboardEvent) => {
    const idx = idToIndex.get(node.id);
    if (idx === undefined) return;
    const item = visibleItems[idx]!;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = visibleItems[idx + 1];
        if (next) setFocusedFolderId(next.id);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = visibleItems[idx - 1];
        if (prev) setFocusedFolderId(prev.id);
        break;
      }
      case "ArrowRight": {
        if (!item.hasChildren) return;
        e.preventDefault();
        if (!item.isExpanded) {
          onToggle(node.id, depth);
        } else {
          const next = visibleItems[idx + 1];
          if (next?.parentId === node.id) setFocusedFolderId(next.id);
        }
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        if (item.hasChildren && item.isExpanded) {
          onToggle(node.id, depth);
        } else if (item.parentId) {
          setFocusedFolderId(item.parentId);
        }
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        if (item.hasChildren) {
          onToggle(node.id, depth);
        }
        onSelect?.(node);
        break;
      }
      case "Home": {
        e.preventDefault();
        const first = visibleItems[0];
        if (first) setFocusedFolderId(first.id);
        break;
      }
      case "End": {
        e.preventDefault();
        const last = visibleItems[visibleItems.length - 1];
        if (last) setFocusedFolderId(last.id);
        break;
      }
      default:
        break;
    }
  };

  const showDropBefore =
    canWrite && dropIndicator?.targetId === node.id && !dropIndicator.after;
  const showDropAfter =
    canWrite && dropIndicator?.targetId === node.id && dropIndicator.after;

  return (
    <div className="relative overflow-visible">
      <div
        role="treeitem"
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-level={depth + 1}
        aria-selected={isSelected}
        tabIndex={rovingTabIndex}
        id={`${treeId}-item-${node.id}`}
        ref={(el) => {
          if (el) treeItemRefs.current.set(node.id, el);
          else treeItemRefs.current.delete(node.id);
        }}
        className={`group flex w-full items-stretch rounded text-sm transition-colors duration-200 outline-none focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--z-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--z-accent)] ${
          isSelected
            ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] text-[var(--z-accent)]"
            : "text-[var(--z-fg)]/90 hover:bg-white/[0.03]"
        } ${showDropBefore || showDropAfter ? "ring-1 ring-[var(--z-accent)]/40" : ""} ${
          canWrite && dropMoveIntoId === node.id
            ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)]"
            : ""
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
        onDragOver={(e) => canWrite && onDragOverRow(e, node.id, parentId)}
        onDrop={(e) => canWrite && onDropOnRow(e, node.id, parentId)}
        onKeyDown={onTreeItemKeyDown}
        onFocus={() => setFocusedFolderId(node.id)}
        onClick={(e) => {
          const el = e.target as HTMLElement;
          if (el.closest("button")) return;
          if (el.closest('[role="menu"]')) return;
          onSelect?.(node);
          setFocusedFolderId(node.id);
        }}
      >
        {showDropBefore ? (
          <span
            className="pointer-events-none absolute left-1 right-1 top-0 z-10 h-px rounded-full bg-[var(--z-accent)]"
            aria-hidden
          />
        ) : null}
        {showDropAfter ? (
          <span
            className="pointer-events-none absolute bottom-0 left-1 right-1 z-10 h-px rounded-full bg-[var(--z-accent)]"
            aria-hidden
          />
        ) : null}
        {canWrite ? (
          <button
            type="button"
            draggable={renamingFolderId !== node.id}
            tabIndex={-1}
            title="Drag to reorder or move folder"
            aria-label={`Reorder or move folder ${node.name}`}
            className="inline-flex w-6 shrink-0 cursor-grab items-center justify-center text-[var(--z-muted)] hover:text-[var(--z-fg)] active:cursor-grabbing"
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData(FOLDER_DRAG_MIME, node.id);
              e.dataTransfer.setData("text/plain", node.id);
              onDragStartRow(node.id, parentId);
            }}
            onDragEnd={() => onDragEnd()}
          >
            ⋮⋮
          </button>
        ) : (
          <span className="inline-flex w-6 shrink-0" aria-hidden />
        )}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span title={folderIconTooltip(iconTag)} aria-label={folderIconTooltip(iconTag)}>
            <FolderIconGlyph icon={iconTag} className="text-[var(--z-fg)]/80" />
          </span>
          {colorTag ? (
            <span title={folderColorTooltip(colorTag)} aria-label={folderColorTooltip(colorTag)}>
              <FolderColorDot colorTag={colorTag} />
            </span>
          ) : null}
          {renamingFolderId === node.id ? (
            <input
              ref={renameInputRef}
              disabled={renameSaving}
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={onRenameInputKeyDown}
              onBlur={onRenameBlur}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Rename folder ${node.name}`}
              className={`${INLINE_RENAME_INPUT_CLASS} min-w-0 flex-1 outline-none`}
            />
          ) : (
            <div className="min-w-0 flex-1 py-1.5">
              <span
                className="block cursor-text truncate text-left"
                onClick={(e) => onFolderLabelClick(node.id, e)}
              >
                {node.name}
              </span>
              {descriptionPreview ? (
                <span
                  className="block truncate text-[11px] text-[var(--z-muted)]"
                  title={description ?? undefined}
                >
                  {descriptionPreview}
                </span>
              ) : null}
            </div>
          )}
        </div>
        <button
          type="button"
          tabIndex={-1}
          className="inline-flex w-6 shrink-0 items-center justify-center text-[var(--z-muted)] hover:text-[var(--z-fg)]"
          aria-hidden={hasChildren ? undefined : true}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id, depth);
          }}
          aria-label={hasChildren ? (isOpen ? "Collapse folder" : "Expand folder") : undefined}
        >
          {hasChildren ? (isOpen ? "▾" : "▸") : "·"}
        </button>
        {canWrite ? (
          <div className="relative shrink-0">
            <button
              type="button"
              tabIndex={-1}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => {
                  const next = !prev;
                  if (!next) {
                    setColorPickerOpen(false);
                    setIconPickerOpen(false);
                    setDescriptionPickerOpen(false);
                  }
                  return next;
                });
              }}
            >
              ⋯
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-1 text-xs shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full rounded px-2 py-1.5 text-left text-[var(--z-fg)] hover:bg-white/[0.05]"
                  onClick={() => {
                    setColorPickerOpen((prev) => !prev);
                    setIconPickerOpen(false);
                    setDescriptionPickerOpen(false);
                  }}
                >
                  Set color
                </button>
                {colorPickerOpen ? (
                  <div className="mt-1">
                    <FolderColorPicker
                      value={colorTag}
                      onChange={(tag) => {
                        void Promise.resolve(onSetFolderColor(node.id, tag)).finally(() => {
                          setColorPickerOpen(false);
                          setIconPickerOpen(false);
                          setDescriptionPickerOpen(false);
                          setMenuOpen(false);
                        });
                      }}
                    />
                  </div>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full rounded px-2 py-1.5 text-left text-[var(--z-fg)] hover:bg-white/[0.05]"
                  onClick={() => {
                    setIconPickerOpen((prev) => !prev);
                    setColorPickerOpen(false);
                    setDescriptionPickerOpen(false);
                  }}
                >
                  Set icon
                </button>
                {iconPickerOpen ? (
                  <div className="mt-1">
                    <FolderIconPicker
                      value={iconTag}
                      onChange={(icon) => {
                        void Promise.resolve(onSetFolderIcon(node.id, icon)).finally(() => {
                          setColorPickerOpen(false);
                          setIconPickerOpen(false);
                          setDescriptionPickerOpen(false);
                          setMenuOpen(false);
                        });
                      }}
                    />
                  </div>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full rounded px-2 py-1.5 text-left text-[var(--z-fg)] hover:bg-white/[0.05]"
                  onClick={() => {
                    setDescriptionDraft(description);
                    setDescriptionPickerOpen((prev) => !prev);
                    setColorPickerOpen(false);
                    setIconPickerOpen(false);
                  }}
                >
                  Set description
                </button>
                {onOpenShareLinks ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full rounded px-2 py-1.5 text-left text-[var(--z-fg)] hover:bg-white/[0.05]"
                    onClick={() => {
                      onOpenShareLinks(node);
                      setDescriptionPickerOpen(false);
                      setColorPickerOpen(false);
                      setIconPickerOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    Share links
                  </button>
                ) : null}
                {descriptionPickerOpen ? (
                  <div className="mt-1">
                    <FolderDescriptionEditor
                      value={descriptionDraft}
                      onChange={setDescriptionDraft}
                      onCancel={() => {
                        setDescriptionDraft(description);
                        setDescriptionPickerOpen(false);
                        setMenuOpen(false);
                      }}
                      onSave={() => {
                        const next = normalizeFolderDescription(descriptionDraft);
                        void Promise.resolve(onSetFolderDescription(node.id, next)).finally(() => {
                          setDescriptionPickerOpen(false);
                          setColorPickerOpen(false);
                          setIconPickerOpen(false);
                          setMenuOpen(false);
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
      {hasChildren ? (
        <div
          role="group"
          className="overflow-hidden"
          style={outerStyle}
          onTransitionEnd={onTransitionEnd}
        >
          <div ref={innerRef}>
            {node.children.map((c) => (
              <NodeRow
                key={c.id}
                node={c}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                expanded={expanded}
                onToggle={onToggle}
                treeId={treeId}
                visibleItems={visibleItems}
                idToIndex={idToIndex}
                focusedFolderId={focusedFolderId}
                setFocusedFolderId={setFocusedFolderId}
                canWrite={canWrite}
                folders={folders}
                dropIndicator={dropIndicator}
                dropMoveIntoId={dropMoveIntoId}
                onDragStartRow={onDragStartRow}
                onDragEnd={onDragEnd}
                onDragOverRow={onDragOverRow}
                onDropOnRow={onDropOnRow}
                onSetFolderColor={onSetFolderColor}
                onSetFolderIcon={onSetFolderIcon}
                onSetFolderDescription={onSetFolderDescription}
                onOpenShareLinks={onOpenShareLinks}
                treeItemRefs={treeItemRefs}
                renamingFolderId={renamingFolderId}
                renameDraft={renameDraft}
                setRenameDraft={setRenameDraft}
                renameInputRef={renameInputRef}
                renameSaving={renameSaving}
                onRenameBlur={onRenameBlur}
                onRenameInputKeyDown={onRenameInputKeyDown}
                onFolderLabelClick={onFolderLabelClick}
                onRequestRename={onRequestRename}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FolderTree({
  folders,
  selectedId,
  onSelect,
  loading,
  error,
  canWrite,
  onFoldersReordered,
  onFolderColorChange,
  onFolderIconChange,
  onFolderDescriptionChange,
  onOpenShareLinks,
}: FolderTreeProps) {
  const [folderNameOverride, setFolderNameOverride] = useState<Record<string, string>>({});
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameSaving, setRenameSaving] = useState(false);
  const lastFolderNameClickRef = useRef<{ id: string; t: number } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [focusedFolderId, setFocusedFolderId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    targetId: string;
    after: boolean;
  } | null>(null);
  const [dropMoveIntoId, setDropMoveIntoId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [inlineName, setInlineName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [workingFolders, setWorkingFolders] = useState<FileFolder[] | null>(null);
  const explorerRuntime = useFilesExplorerRuntimeOptional();
  const displayFolders = workingFolders ?? folders;
  const displayFoldersRef = useRef(displayFolders);
  displayFoldersRef.current = displayFolders;
  const baseId = useId();
  const treeId = `ft-${baseId}`;
  const foldersSig = useMemo(
    () => folders.map((f) => `${f.id}:${f.parentId ?? ""}`).join("|"),
    [folders],
  );
  useEffect(() => {
    queueMicrotask(() => {
      setWorkingFolders(null);
    });
  }, [foldersSig]);
  const foldersForTree = useMemo(
    () =>
      displayFolders.map((f) => ({
        ...f,
        name: folderNameOverride[f.id] ?? f.name,
      })),
    [displayFolders, folderNameOverride],
  );
  const tree = useMemo(() => buildTree(foldersForTree), [foldersForTree]);
  const renameOriginal =
    renamingFolderId != null
      ? (folderNameOverride[renamingFolderId] ??
          folders.find((f) => f.id === renamingFolderId)?.name ??
          "")
      : "";
  const {
    draft: renameDraft,
    setDraft: setRenameDraft,
    inputRef: renameInputRef,
    skipBlurSaveRef,
    cancelWithoutBlurSave,
  } = useInlineRename({
    originalName: renameOriginal,
    isEditing: renamingFolderId != null,
  });
  const visibleItems = useMemo(
    () => buildVisibleTreeItems(tree, expanded),
    [tree, expanded],
  );
  const idToIndex = useMemo(() => indexById(visibleItems), [visibleItems]);
  const treeItemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const dragContextRef = useRef<{ id: string; parentId: string | null } | null>(null);

  const executeFolderMove = useCallback(
    async (fromId: string, newParentId: string | null) => {
      if (!canWrite) return;
      const list = displayFoldersRef.current;
      const err = validateFolderMove(list, fromId, newParentId);
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
      setWorkingFolders(applyOptimisticFolderParent(list, fromId, newParentId));
      const res = await moveFolderAction(fromId, { parentId: newParentId });
      if (!res.ok) {
        setWorkingFolders(null);
        showFilesToast(res.error, "error");
        return;
      }
      showFilesToast("Folder moved.", "success");
      onFoldersReordered?.();
    },
    [canWrite, explorerRuntime, onFoldersReordered],
  );

  const persistFolderColor = useCallback(
    async (folderId: string, colorTag: string | null) => {
      if (!canWrite || !onFolderColorChange) return;
      try {
        await onFolderColorChange(folderId, colorTag);
      } catch {
        // onFolderColorChange handles its own revert path.
      }
    },
    [canWrite, onFolderColorChange],
  );

  const persistFolderIcon = useCallback(
    async (folderId: string, icon: string | null) => {
      if (!canWrite || !onFolderIconChange) return;
      try {
        await onFolderIconChange(folderId, icon);
      } catch {
        // onFolderIconChange handles its own revert path.
      }
    },
    [canWrite, onFolderIconChange],
  );

  const persistFolderDescription = useCallback(
    async (folderId: string, description: string | null) => {
      if (!canWrite || !onFolderDescriptionChange) return;
      try {
        await onFolderDescriptionChange(folderId, description);
      } catch {
        // onFolderDescriptionChange handles its own revert path.
      }
    },
    [canWrite, onFolderDescriptionChange],
  );

  const createInlineFolder = useCallback(async () => {
    const name = inlineName.trim();
    if (!canWrite || !name) return;
    setCreatingFolder(true);
    try {
      const res = await fetch("/api/files/folders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          parentId: selectedId ?? null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Create failed (${res.status})`);
      }
      setInlineName("");
      showFilesToast("Folder created.", "success");
      onFoldersReordered?.();
    } catch (e) {
      showFilesToast(e instanceof Error ? e.message : "Create failed.", "error");
    } finally {
      setCreatingFolder(false);
    }
  }, [canWrite, inlineName, selectedId, onFoldersReordered]);

  const toggle = useCallback((id: string, depth: number) => {
    setExpanded((prev) => {
      const cur = getEffectiveExpanded(id, depth, prev);
      return { ...prev, [id]: !cur };
    });
  }, []);

  const startFolderRename = useCallback((id: string) => {
    if (!canWrite) return;
    if (dragContextRef.current) return;
    setRenamingFolderId(id);
  }, [canWrite]);

  const cancelFolderRename = useCallback(() => {
    const id = renamingFolderId;
    const revert = id ? (folders.find((f) => f.id === id)?.name ?? "") : "";
    cancelWithoutBlurSave(revert);
    setRenamingFolderId(null);
  }, [renamingFolderId, folders, cancelWithoutBlurSave]);

  const commitFolderRename = useCallback(async () => {
    const id = renamingFolderId;
    if (!id || !canWrite || renameSaving) return;
    const trimmed = renameDraft.trim();
    const baseline = folders.find((f) => f.id === id)?.name ?? "";
    if (!trimmed) {
      cancelWithoutBlurSave(baseline);
      setRenamingFolderId(null);
      return;
    }
    if (trimmed === baseline) {
      setRenamingFolderId(null);
      return;
    }
    setRenameSaving(true);
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
    setRenameSaving(false);
    setRenamingFolderId(null);
  }, [
    renamingFolderId,
    canWrite,
    renameSaving,
    renameDraft,
    folders,
    cancelWithoutBlurSave,
  ]);

  const onFolderLabelClick = useCallback(
    (folderId: string, e: React.MouseEvent) => {
      if (!canWrite || renamingFolderId) return;
      const now = Date.now();
      const prev = lastFolderNameClickRef.current;
      lastFolderNameClickRef.current = { id: folderId, t: now };
      if (prev && prev.id === folderId && selectedId === folderId && now - prev.t < 650) {
        e.stopPropagation();
        startFolderRename(folderId);
        lastFolderNameClickRef.current = null;
      }
    },
    [canWrite, renamingFolderId, selectedId, startFolderRename],
  );

  const onRenameInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        void commitFolderRename();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelFolderRename();
      }
    },
    [commitFolderRename, cancelFolderRename],
  );

  const onRenameBlur = useCallback(() => {
    if (skipBlurSaveRef.current) return;
    void commitFolderRename();
  }, [skipBlurSaveRef, commitFolderRename]);

  useLayoutEffect(() => {
    if (!focusedFolderId) return;
    const el = treeItemRefs.current.get(focusedFolderId);
    if (el && document.activeElement !== el) {
      el.focus({ preventScroll: true });
    }
  }, [focusedFolderId]);

  useLayoutEffect(() => {
    const visible = new Set(visibleItems.map((x) => x.id));
    if (focusedFolderId && !visible.has(focusedFolderId)) {
      let cur: string | null = focusedFolderId;
      while (cur) {
        const p = displayFolders.find((f) => f.id === cur)?.parentId ?? null;
        if (p && visible.has(p)) {
          setFocusedFolderId(p);
          return;
        }
        cur = p;
      }
      setFocusedFolderId(visibleItems[0]?.id ?? null);
    }
  }, [visibleItems, focusedFolderId, displayFolders]);

  useEffect(() => {
    if (!selectedId) return;
    if (displayFolders.some((f) => f.id === selectedId)) {
      setFocusedFolderId(selectedId);
    }
  }, [selectedId, displayFolders]);

  const persistSiblingOrder = useCallback(
    async (parentId: string | null, orderedIds: string[]) => {
      if (!canWrite || orderedIds.length === 0) return;
      setReordering(true);
      try {
        const results = await Promise.all(
          orderedIds.map((id, idx) => {
            const row = displayFoldersRef.current.find((f) => f.id === id);
            const metadata = { ...(row?.metadata ?? {}), sortIndex: idx };
            return fetch(`/api/files/folders/${encodeURIComponent(id)}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ metadata }),
            });
          }),
        );
        if (results.some((r) => !r.ok)) {
          showFilesToast("Could not save folder order.", "error");
          return;
        }
        showFilesToast("Folder order updated.", "success");
        onFoldersReordered?.();
      } catch {
        showFilesToast("Could not save folder order.", "error");
      } finally {
        setReordering(false);
        setDropIndicator(null);
        setDropMoveIntoId(null);
        dragContextRef.current = null;
      }
    },
    [canWrite, onFoldersReordered],
  );

  const onDragStartRow = useCallback((id: string, parentId: string | null) => {
    dragContextRef.current = { id, parentId };
  }, []);

  const onDragEnd = useCallback(() => {
    setDropIndicator(null);
    setDropMoveIntoId(null);
    dragContextRef.current = null;
  }, []);

  const onDragOverRow = useCallback(
    (e: React.DragEvent, targetId: string, targetParentId: string | null) => {
      const ctx = dragContextRef.current;
      if (!ctx || ctx.id === targetId) return;
      if (!canWrite) return;
      if (renamingFolderId === ctx.id || renamingFolderId === targetId) return;
      const list = displayFoldersRef.current;
      const sameParent = (ctx.parentId ?? null) === (targetParentId ?? null);
      if (sameParent) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const el = e.currentTarget as HTMLElement;
        const rect = el.getBoundingClientRect();
        const ratio = (e.clientY - rect.top) / rect.height;
        if (ratio < 0.32) {
          setDropIndicator({ targetId, after: false });
          setDropMoveIntoId(null);
        } else if (ratio > 0.68) {
          setDropIndicator({ targetId, after: true });
          setDropMoveIntoId(null);
        } else {
          const mvErr = validateFolderMove(list, ctx.id, targetId);
          const destOk = folderWritableAsMoveDestination(
            list,
            targetId,
            explorerRuntime?.permissionContext ?? null,
          );
          if (mvErr || !destOk) {
            setDropIndicator(null);
            setDropMoveIntoId(null);
            return;
          }
          setDropMoveIntoId(targetId);
          setDropIndicator(null);
        }
        return;
      }
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const mvErr = validateFolderMove(list, ctx.id, targetId);
      const destOk = folderWritableAsMoveDestination(
        list,
        targetId,
        explorerRuntime?.permissionContext ?? null,
      );
      if (mvErr || !destOk) {
        setDropIndicator(null);
        setDropMoveIntoId(null);
        return;
      }
      setDropMoveIntoId(targetId);
      setDropIndicator(null);
    },
    [canWrite, renamingFolderId, explorerRuntime],
  );

  const onDropOnRow = useCallback(
    (e: React.DragEvent, targetId: string, targetParentId: string | null) => {
      e.preventDefault();
      const ctx = dragContextRef.current;
      if (!ctx || ctx.id === targetId) {
        onDragEnd();
        return;
      }
      if (!canWrite) {
        onDragEnd();
        return;
      }
      const list = displayFoldersRef.current;
      const sameParent = (ctx.parentId ?? null) === (targetParentId ?? null);
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const ratio = (e.clientY - rect.top) / rect.height;
      const mode: "reorder" | "move-into" =
        !sameParent || (ratio >= 0.32 && ratio <= 0.68) ? "move-into" : "reorder";
      if (mode === "move-into") {
        const err = validateFolderMove(list, ctx.id, targetId);
        const destOk = folderWritableAsMoveDestination(
          list,
          targetId,
          explorerRuntime?.permissionContext ?? null,
        );
        if (err || !destOk) {
          if (err) showFilesToast(err, "error");
          else showFilesToast("You cannot move a folder into that location.", "error");
          onDragEnd();
          return;
        }
        void executeFolderMove(ctx.id, targetId).finally(() => onDragEnd());
        return;
      }
      const after = ratio > 0.68;
      const ids = orderedSiblingIds(list, ctx.parentId);
      const next = buildReorderedSiblingIds(ids, ctx.id, targetId, after);
      if (!next || next.every((id, i) => id === ids[i])) {
        onDragEnd();
        return;
      }
      void persistSiblingOrder(ctx.parentId, next);
    },
    [
      canWrite,
      persistSiblingOrder,
      onDragEnd,
      explorerRuntime,
      executeFolderMove,
    ],
  );

  // Expand ancestors so the selected folder is visible (sync derived UI state).
  useEffect(() => {
    if (!selectedId) return;
    const next: Record<string, boolean> = {};
    let cur = displayFolders.find((f) => f.id === selectedId);
    while (cur?.parentId) {
      next[cur.parentId] = true;
      cur = displayFolders.find((f) => f.id === cur!.parentId);
    }
    if (Object.keys(next).length) {
      queueMicrotask(() => {
        setExpanded((prev) => ({ ...prev, ...next }));
      });
    }
  }, [selectedId, displayFolders]);

  if (loading) {
    return (
      <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-2">
        <div className="px-2 py-1 text-xs uppercase tracking-wider text-[var(--z-muted)]">
          Folders
        </div>
        <FilesLoading label="Loading folders…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-2">
        <div className="px-2 py-1 text-xs uppercase tracking-wider text-[var(--z-muted)]">
          Folders
        </div>
        <FilesError message={error} title="Could not load folders" />
      </div>
    );
  }

  return (
    <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-2">
      <div className="flex items-center justify-between gap-2 px-2 py-1">
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">Folders</div>
        {reordering ? (
          <span className="text-[10px] text-[var(--z-muted)]" aria-live="polite">
            Saving…
          </span>
        ) : null}
      </div>
        {canWrite ? (
        <p className="mb-1 px-2 text-[10px] leading-snug text-[var(--z-muted)]">
          Drag ⋮⋮ on a sibling: top / bottom thirds reorder (persists{" "}
          <code className="text-[var(--z-fg)]/80">metadata.sortIndex</code>); middle third or
          another branch = move into that folder. Dot ={" "}
          <code className="text-[var(--z-fg)]/80">colorTag</code>, icon ={" "}
          <code className="text-[var(--z-fg)]/80">icon</code>, description ={" "}
          <code className="text-[var(--z-fg)]/80">description</code>.
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => onSelect?.(null)}
        className={`flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] ${
          !selectedId
            ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] text-[var(--z-accent)]"
            : "text-[var(--z-fg)]/80 hover:bg-white/[0.03]"
        }`}
      >
        <span className="inline-flex w-4 justify-center">▦</span>
        <span>All files</span>
      </button>
      {tree.length === 0 ? (
        <div className="px-2 py-2 text-xs text-[var(--z-muted)]">
          No folders in tree yet. Use the field below to add one, or{" "}
          <Link
            href="/files/explorer?create=folder"
            className="text-[var(--z-accent)] underline"
          >
            open folder manager
          </Link>
          .
        </div>
      ) : (
        <div role="tree" aria-label="Folder hierarchy">
          {tree.map((n) => (
            <NodeRow
              key={n.id}
              node={n}
              depth={0}
              selectedId={selectedId}
              onSelect={onSelect}
              expanded={expanded}
              onToggle={toggle}
              treeId={treeId}
              visibleItems={visibleItems}
              idToIndex={idToIndex}
              focusedFolderId={focusedFolderId}
              setFocusedFolderId={setFocusedFolderId}
              canWrite={canWrite}
              folders={displayFolders}
              dropIndicator={dropIndicator}
              dropMoveIntoId={dropMoveIntoId}
              onDragStartRow={onDragStartRow}
              onDragEnd={onDragEnd}
              onDragOverRow={onDragOverRow}
              onDropOnRow={onDropOnRow}
              onSetFolderColor={persistFolderColor}
              onSetFolderIcon={persistFolderIcon}
              onSetFolderDescription={persistFolderDescription}
              onOpenShareLinks={onOpenShareLinks}
              treeItemRefs={treeItemRefs}
              renamingFolderId={renamingFolderId}
              renameDraft={renameDraft}
              setRenameDraft={setRenameDraft}
              renameInputRef={renameInputRef}
              renameSaving={renameSaving}
              onRenameBlur={onRenameBlur}
              onRenameInputKeyDown={onRenameInputKeyDown}
              onFolderLabelClick={onFolderLabelClick}
              onRequestRename={startFolderRename}
            />
          ))}
        </div>
      )}
      {canWrite ? (
        <div className="mt-2 border-t border-[var(--z-border)] pt-2">
          <div className="px-1 text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
            New folder {selectedId ? "(inside selected)" : "(root)"}
          </div>
          <div className="mt-1 flex gap-1 px-1">
            <input
              value={inlineName}
              onChange={(e) => setInlineName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void createInlineFolder();
              }}
              placeholder="Folder name…"
              className="min-w-0 flex-1 rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]"
              disabled={creatingFolder}
            />
            <button
              type="button"
              disabled={creatingFolder || !inlineName.trim()}
              onClick={() => void createInlineFolder()}
              className="shrink-0 rounded bg-[var(--z-accent)] px-2 py-1.5 text-xs font-semibold text-black disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
