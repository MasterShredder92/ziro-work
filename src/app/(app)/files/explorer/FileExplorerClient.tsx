"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from "react";
import { useRouter } from "next/navigation";
import type { FileFolder, FileObject } from "@/lib/files/types";
import { updateFolderColorAction } from "@/app/(app)/files/actions/updateFolderColorAction";
import { updateFolderIconAction } from "@/app/(app)/files/actions/updateFolderIconAction";
import { updateFolderDescriptionAction } from "@/app/(app)/files/actions/updateFolderDescriptionAction";
import {
  FileList,
  FilesBreadcrumbs,
  type FilesCrumb,
  FileUploadModal,
  FolderManager,
  FolderInspector,
  FolderShareLinksPanel,
  FolderTree,
  MoveToFolderModal,
  folderColorHex,
} from "../components";
import { showFilesToast } from "../components/filesToast";

function useDebouncedValue<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Root → … → selected folder (for breadcrumbs). */
function folderAncestorsToSelected(
  folders: FileFolder[],
  selectedId: string,
): FileFolder[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const chain: FileFolder[] = [];
  let cur: FileFolder | undefined = byId.get(selectedId);
  while (cur) {
    chain.push(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return chain.reverse();
}

export interface FileExplorerClientProps {
  folders: FileFolder[];
  files: FileObject[];
  initialFolderId: string | null;
  initialUpload: boolean;
  canWrite: boolean;
}

export function FileExplorerClient({
  folders,
  files,
  initialFolderId,
  initialUpload,
  canWrite,
}: FileExplorerClientProps) {
  const router = useRouter();
  const [liveFolders, setLiveFolders] = useState<FileFolder[]>(folders);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    initialFolderId,
  );
  const [uploadOpen, setUploadOpen] = useState(initialUpload);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 220);
  const deferredFolderId = useDeferredValue(selectedFolderId);
  const [showFolders, setShowFolders] = useState(false);
  const [dropOver, setDropOver] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const anchorIndex = useRef<number | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [renameRequestId, setRenameRequestId] = useState<string | null>(null);
  const [shareLinksFolderId, setShareLinksFolderId] = useState<string | null>(null);
  const [accessLogsLinkId, setAccessLogsLinkId] = useState<string | null>(null);

  useEffect(() => {
    setLiveFolders((prev) => {
      const prevById = new Map(prev.map((folder) => [folder.id, folder]));
      return folders.map((incoming) => {
        const existing = prevById.get(incoming.id);
        if (!existing) return incoming;
        const incomingColorTag = incoming.metadata?.colorTag;
        const incomingIcon = incoming.metadata?.icon;
        const incomingDescription = incoming.metadata?.description;
        const previousColorTag = existing.metadata?.colorTag;
        const previousIcon = existing.metadata?.icon;
        const previousDescription = existing.metadata?.description;
        return {
          ...incoming,
          metadata: {
            ...(existing.metadata ?? {}),
            ...(incoming.metadata ?? {}),
            colorTag: incomingColorTag ?? previousColorTag ?? null,
            icon: incomingIcon ?? previousIcon ?? null,
            description: incomingDescription ?? previousDescription ?? null,
          },
        };
      });
    });
  }, [folders]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let list = files;
    if (deferredFolderId) {
      list = list.filter((f) => f.folderId === deferredFolderId);
    }
    if (q) {
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.description ?? "").toLowerCase().includes(q) ||
          (f.mimeType ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [files, deferredFolderId, debouncedQuery]);

  const childFolders = useMemo(() => {
    const parentKey = selectedFolderId ?? null;
    const rows = liveFolders.filter((f) => (f.parentId ?? null) === parentKey);
    const sortIndex = (f: (typeof folders)[number]) => {
      const raw = f.metadata?.sortIndex;
      if (typeof raw === "number" && Number.isFinite(raw)) return raw;
      if (typeof raw === "string") {
        const n = Number(raw);
        if (Number.isFinite(n)) return n;
      }
      return 1_000_000;
    };
    rows.sort((a, b) => {
      const ai = sortIndex(a);
      const bi = sortIndex(b);
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name);
    });
    return rows;
  }, [liveFolders, selectedFolderId]);

  const patchFolderColor = useCallback(
    async (folderId: string, colorTag: string | null) => {
      if (!canWrite) return;
      const previousColorById = new Map(
        liveFolders.map((folder) => [folder.id, folder.metadata?.colorTag ?? null]),
      );
      setLiveFolders((prev) =>
        prev.map((folder) =>
          folder.id === folderId
            ? {
                ...folder,
                metadata: { ...(folder.metadata ?? {}), colorTag: colorTag ?? null },
              }
            : folder,
        ),
      );
      try {
        const res = await updateFolderColorAction(folderId, colorTag);
        if (!res.ok) throw new Error(res.error);
        const serverColorTag = res.data.metadata?.colorTag ?? null;
        setLiveFolders((prev) =>
          prev.map((folder) =>
            folder.id === folderId
              ? {
                  ...folder,
                  metadata: { ...(folder.metadata ?? {}), colorTag: serverColorTag },
                }
              : folder,
          ),
        );
        showFilesToast("Folder color updated.", "success");
      } catch {
        setLiveFolders((prev) =>
          prev.map((folder) =>
            folder.id === folderId
              ? {
                  ...folder,
                  metadata: {
                    ...(folder.metadata ?? {}),
                    colorTag: previousColorById.get(folderId) ?? null,
                  },
                }
              : folder,
          ),
        );
        showFilesToast("Could not update folder color.", "error");
        throw new Error("Could not update folder color.");
      }
    },
    [canWrite, liveFolders],
  );

  const patchFolderIcon = useCallback(
    async (folderId: string, icon: string | null) => {
      if (!canWrite) return;
      const previousIconById = new Map(
        liveFolders.map((folder) => [folder.id, folder.metadata?.icon ?? null]),
      );
      setLiveFolders((prev) =>
        prev.map((folder) =>
          folder.id === folderId
            ? {
                ...folder,
                metadata: { ...(folder.metadata ?? {}), icon: icon ?? null },
              }
            : folder,
        ),
      );
      try {
        const res = await updateFolderIconAction(folderId, icon);
        if (!res.ok) throw new Error(res.error);
        const serverIcon = res.data.metadata?.icon ?? null;
        setLiveFolders((prev) =>
          prev.map((folder) =>
            folder.id === folderId
              ? {
                  ...folder,
                  metadata: { ...(folder.metadata ?? {}), icon: serverIcon },
                }
              : folder,
          ),
        );
        showFilesToast("Folder icon updated.", "success");
      } catch {
        setLiveFolders((prev) =>
          prev.map((folder) =>
            folder.id === folderId
              ? {
                  ...folder,
                  metadata: {
                    ...(folder.metadata ?? {}),
                    icon: previousIconById.get(folderId) ?? null,
                  },
                }
              : folder,
          ),
        );
        showFilesToast("Could not update folder icon.", "error");
        throw new Error("Could not update folder icon.");
      }
    },
    [canWrite, liveFolders],
  );

  const patchFolderDescription = useCallback(
    async (folderId: string, description: string | null) => {
      if (!canWrite) return;
      const previousDescriptionById = new Map(
        liveFolders.map((folder) => [folder.id, folder.metadata?.description ?? null]),
      );
      setLiveFolders((prev) =>
        prev.map((folder) =>
          folder.id === folderId
            ? {
                ...folder,
                metadata: { ...(folder.metadata ?? {}), description: description ?? null },
              }
            : folder,
        ),
      );
      try {
        const res = await updateFolderDescriptionAction(folderId, description);
        if (!res.ok) throw new Error(res.error);
        const serverDescription = res.data.metadata?.description ?? null;
        setLiveFolders((prev) =>
          prev.map((folder) =>
            folder.id === folderId
              ? {
                  ...folder,
                  metadata: { ...(folder.metadata ?? {}), description: serverDescription },
                }
              : folder,
          ),
        );
        showFilesToast("Folder description updated.", "success");
      } catch {
        setLiveFolders((prev) =>
          prev.map((folder) =>
            folder.id === folderId
              ? {
                  ...folder,
                  metadata: {
                    ...(folder.metadata ?? {}),
                    description: previousDescriptionById.get(folderId) ?? null,
                  },
                }
              : folder,
          ),
        );
        showFilesToast("Could not update folder description.", "error");
        throw new Error("Could not update folder description.");
      }
    },
    [canWrite, liveFolders],
  );

  const onFolderNavigate = useCallback(
    (folderId: string) => {
      startTransition(() => {
        setSelectedFolderId(folderId);
        router.push(
          `/files/explorer?folderId=${encodeURIComponent(folderId)}`,
        );
      });
    },
    [router],
  );

  const selectedFolder = useMemo(
    () =>
      selectedFolderId ? liveFolders.find((folder) => folder.id === selectedFolderId) ?? null : null,
    [liveFolders, selectedFolderId],
  );
  const shareLinksFolder = useMemo(
    () =>
      shareLinksFolderId
        ? liveFolders.find((folder) => folder.id === shareLinksFolderId) ?? null
        : null,
    [liveFolders, shareLinksFolderId],
  );

  const crumbs = useMemo((): FilesCrumb[] => {
    const base: FilesCrumb[] = [
      { label: "Files", href: "/files" },
      { label: "Explorer", href: "/files/explorer" },
    ];
    if (selectedFolderId) {
      const chain = folderAncestorsToSelected(liveFolders, selectedFolderId);
      for (const f of chain) {
        base.push({
          label: f.name,
          href: `/files/explorer?folderId=${encodeURIComponent(f.id)}`,
          colorHex: folderColorHex(f),
        });
      }
    }
    return base;
  }, [liveFolders, selectedFolderId]);

  const onRowSelect = useCallback(
    (file: FileObject, index: number, e: React.MouseEvent) => {
      e.preventDefault();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (e.shiftKey && anchorIndex.current !== null) {
          const lo = Math.min(anchorIndex.current, index);
          const hi = Math.max(anchorIndex.current, index);
          for (let i = lo; i <= hi; i++) {
            const row = filtered[i];
            if (row) next.add(row.id);
          }
        } else if (e.ctrlKey || e.metaKey) {
          if (next.has(file.id)) next.delete(file.id);
          else next.add(file.id);
        } else {
          next.clear();
          next.add(file.id);
        }
        return next;
      });
      if (!e.shiftKey) anchorIndex.current = index;
    },
    [filtered],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    anchorIndex.current = null;
  }, []);

  const bulkDelete = useCallback(async () => {
    if (!canWrite || selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} file(s)?`)) return;
    const res = await fetch("/api/files/batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "delete", fileIds: [...selectedIds] }),
    });
    if (res.ok) {
      clearSelection();
      showFilesToast("Files deleted.", "success");
      router.refresh();
    } else {
      showFilesToast("Bulk delete failed.", "error");
    }
  }, [canWrite, selectedIds, clearSelection, router]);

  const selectedIdsRef = useRef(selectedIds);
  const bulkDeleteRef = useRef(bulkDelete);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    bulkDeleteRef.current = bulkDelete;
  }, [bulkDelete]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement)
        return;
      const ids = selectedIdsRef.current;
      if (ev.key === "Escape") clearSelection();
      if ((ev.key === "r" || ev.key === "R") && canWrite && ids.size === 1) {
        ev.preventDefault();
        setRenameRequestId([...ids][0]!);
      }
      if ((ev.key === "m" || ev.key === "M") && canWrite && ids.size > 0) {
        ev.preventDefault();
        setMoveOpen(true);
      }
      if ((ev.key === "Delete" || ev.key === "Backspace") && ids.size > 0) {
        ev.preventDefault();
        void bulkDeleteRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canWrite, clearSelection]);

  const doMove = async (folderId: string | null) => {
    setMoveOpen(false);
    if (selectedIds.size === 0) return;
    const res = await fetch("/api/files/batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "move",
        fileIds: [...selectedIds],
        folderId,
      }),
    });
    if (res.ok) {
      clearSelection();
      showFilesToast("Files moved.", "success");
      router.refresh();
    } else {
      showFilesToast("Move failed.", "error");
    }
  };

  const onRename = async (id: string, name: string) => {
    const res = await fetch(`/api/files/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      showFilesToast("Renamed.", "success");
      router.refresh();
    } else {
      showFilesToast("Rename failed.", "error");
    }
  };

  const onDragOverMain = (e: React.DragEvent) => {
    if (!canWrite) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDropOver(true);
  };

  const onDragLeaveMain = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDropOver(false);
  };

  const onDropMain = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDropOver(false);
      if (!canWrite) {
        showFilesToast("You do not have permission to upload here.", "error");
        return;
      }
      const f = e.dataTransfer?.files?.[0] ?? null;
      if (f) {
        setDroppedFile(f);
        setUploadOpen(true);
      }
    },
    [canWrite],
  );

  return (
    <div className="space-y-5">
      <FilesBreadcrumbs items={crumbs} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
            Files &amp; Documents
          </div>
          <h1 className="text-2xl font-semibold text-[var(--z-fg)]">File explorer</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files…"
            className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-1.5 text-sm text-[var(--z-fg)]"
            aria-busy={debouncedQuery !== query}
          />
          <button
            type="button"
            onClick={() => setShowFolders((v) => !v)}
            className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]"
          >
            {showFolders ? "Hide" : "Manage"} folders
          </button>
          {canWrite ? (
            <button
              type="button"
              onClick={() => {
                setDroppedFile(null);
                setUploadOpen(true);
              }}
              className="rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90"
            >
              Upload
            </button>
          ) : null}
        </div>
      </header>

      {canWrite && selectedIds.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-xs text-[var(--z-fg)]">
          <span>{selectedIds.size} selected</span>
          <button
            type="button"
            className="rounded border border-[var(--z-border)] px-2 py-1 hover:bg-white/[0.04]"
            onClick={() => setMoveOpen(true)}
          >
            Move to…
          </button>
          <button
            type="button"
            className="rounded border border-red-500/40 px-2 py-1 text-red-400 hover:bg-red-500/10"
            onClick={() => void bulkDelete()}
          >
            Delete
          </button>
          <button
            type="button"
            className="text-[var(--z-muted)] hover:text-[var(--z-fg)]"
            onClick={clearSelection}
          >
            Clear
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[260px,1fr]">
        <div>
          <FolderTree
            key={liveFolders.map((x) => x.updatedAt).join("|")}
            folders={liveFolders}
            selectedId={selectedFolderId}
            canWrite={canWrite}
            onFoldersReordered={() => router.refresh()}
            onFolderColorChange={canWrite ? patchFolderColor : undefined}
            onFolderIconChange={canWrite ? patchFolderIcon : undefined}
            onFolderDescriptionChange={canWrite ? patchFolderDescription : undefined}
            onOpenShareLinks={(folder) => {
              setAccessLogsLinkId(null);
              setShareLinksFolderId(folder.id);
            }}
            onSelect={(f) => {
              const id = f?.id ?? null;
              startTransition(() => {
                setSelectedFolderId(id);
                const qs = new URLSearchParams();
                if (id) qs.set("folderId", id);
                router.push(`/files/explorer${qs.toString() ? `?${qs}` : ""}`);
              });
            }}
          />
          <FolderInspector
            folder={selectedFolder}
            canWrite={canWrite}
            onSaveDescription={canWrite ? patchFolderDescription : undefined}
            onOpenShareLinks={
              canWrite
                ? (folder) => {
                    setAccessLogsLinkId(null);
                    setShareLinksFolderId(folder.id);
                  }
                : undefined
            }
          />
        </div>
        <div
          className={`relative space-y-4 rounded-lg transition-colors ${
            dropOver && canWrite
              ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_94%)] ring-2 ring-[var(--z-accent)]/40"
              : ""
          }`}
          onDragEnter={onDragOverMain}
          onDragOver={onDragOverMain}
          onDragLeave={onDragLeaveMain}
          onDrop={onDropMain}
        >
          {dropOver && canWrite ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-[var(--z-accent)] bg-black/20 text-sm font-medium text-[var(--z-fg)]">
              Drop file to upload
            </div>
          ) : null}
          {showFolders ? (
            <FolderManager folders={liveFolders} canWrite={canWrite} />
          ) : null}
          <FileList
            files={filtered}
            folderRows={childFolders}
            emptyLabel={
              query
                ? "No files match your search."
                : selectedFolderId
                  ? "This folder is empty."
                  : "No files yet — upload your first document."
            }
            canWrite={canWrite}
            selectedIds={selectedIds}
            onRowSelect={canWrite ? onRowSelect : undefined}
            onRename={canWrite ? onRename : undefined}
            renameRequestId={renameRequestId}
            onRenameRequestConsumed={() => setRenameRequestId(null)}
            onFolderNavigate={onFolderNavigate}
            onFolderColorChange={canWrite ? patchFolderColor : undefined}
            onFolderIconChange={canWrite ? patchFolderIcon : undefined}
            onFolderDescriptionChange={canWrite ? patchFolderDescription : undefined}
            onOpenShareLinks={(folder) => {
              setAccessLogsLinkId(null);
              setShareLinksFolderId(folder.id);
            }}
            filesEmptyHint={
              query.trim()
                ? "No files match your search."
                : selectedFolderId
                  ? "No files in this folder."
                  : "No files yet — upload your first document."
            }
          />
        </div>
      </div>

      <FileUploadModal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setDroppedFile(null);
        }}
        folderId={selectedFolderId}
        initialFile={droppedFile}
      />

      <MoveToFolderModal
        open={moveOpen}
        folders={liveFolders}
        onClose={() => setMoveOpen(false)}
        onConfirm={(folderId) => void doMove(folderId)}
      />

      <FolderShareLinksPanel
        open={shareLinksFolderId != null}
        folderId={shareLinksFolder?.id ?? null}
        folderName={shareLinksFolder?.name ?? null}
        canShare={canWrite}
        accessLogsLinkId={accessLogsLinkId}
        onAccessLogsLinkIdChange={setAccessLogsLinkId}
        onClose={() => {
          setAccessLogsLinkId(null);
          setShareLinksFolderId(null);
        }}
      />
    </div>
  );
}
