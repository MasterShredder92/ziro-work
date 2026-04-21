"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, startTransition, } from "react";
import { useRouter } from "next/navigation";
import { updateFolderColorAction } from "@/app/(app)/files/actions/updateFolderColorAction";
import { updateFolderIconAction } from "@/app/(app)/files/actions/updateFolderIconAction";
import { updateFolderDescriptionAction } from "@/app/(app)/files/actions/updateFolderDescriptionAction";
import { FileList, FilesBreadcrumbs, FileUploadModal, FolderManager, FolderInspector, FolderShareLinksPanel, FolderTree, MoveToFolderModal, folderColorHex, } from "../components";
import { showFilesToast } from "../components/filesToast";
function useDebouncedValue(value, ms) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = window.setTimeout(() => setV(value), ms);
        return () => window.clearTimeout(t);
    }, [value, ms]);
    return v;
}
/** Root → … → selected folder (for breadcrumbs). */
function folderAncestorsToSelected(folders, selectedId) {
    const byId = new Map(folders.map((f) => [f.id, f]));
    const chain = [];
    let cur = byId.get(selectedId);
    while (cur) {
        chain.push(cur);
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return chain.reverse();
}
export function FileExplorerClient({ folders, files, initialFolderId, initialUpload, canWrite, }) {
    var _a, _b;
    const router = useRouter();
    const [liveFolders, setLiveFolders] = useState(folders);
    const [selectedFolderId, setSelectedFolderId] = useState(initialFolderId);
    const [uploadOpen, setUploadOpen] = useState(initialUpload);
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebouncedValue(query, 220);
    const deferredFolderId = useDeferredValue(selectedFolderId);
    const [showFolders, setShowFolders] = useState(false);
    const [dropOver, setDropOver] = useState(false);
    const [droppedFile, setDroppedFile] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const anchorIndex = useRef(null);
    const [moveOpen, setMoveOpen] = useState(false);
    const [renameRequestId, setRenameRequestId] = useState(null);
    const [shareLinksFolderId, setShareLinksFolderId] = useState(null);
    const [accessLogsLinkId, setAccessLogsLinkId] = useState(null);
    useEffect(() => {
        setLiveFolders((prev) => {
            const prevById = new Map(prev.map((folder) => [folder.id, folder]));
            return folders.map((incoming) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                const existing = prevById.get(incoming.id);
                if (!existing)
                    return incoming;
                const incomingColorTag = (_a = incoming.metadata) === null || _a === void 0 ? void 0 : _a.colorTag;
                const incomingIcon = (_b = incoming.metadata) === null || _b === void 0 ? void 0 : _b.icon;
                const incomingDescription = (_c = incoming.metadata) === null || _c === void 0 ? void 0 : _c.description;
                const previousColorTag = (_d = existing.metadata) === null || _d === void 0 ? void 0 : _d.colorTag;
                const previousIcon = (_e = existing.metadata) === null || _e === void 0 ? void 0 : _e.icon;
                const previousDescription = (_f = existing.metadata) === null || _f === void 0 ? void 0 : _f.description;
                return Object.assign(Object.assign({}, incoming), { metadata: Object.assign(Object.assign(Object.assign({}, ((_g = existing.metadata) !== null && _g !== void 0 ? _g : {})), ((_h = incoming.metadata) !== null && _h !== void 0 ? _h : {})), { colorTag: (_j = incomingColorTag !== null && incomingColorTag !== void 0 ? incomingColorTag : previousColorTag) !== null && _j !== void 0 ? _j : null, icon: (_k = incomingIcon !== null && incomingIcon !== void 0 ? incomingIcon : previousIcon) !== null && _k !== void 0 ? _k : null, description: (_l = incomingDescription !== null && incomingDescription !== void 0 ? incomingDescription : previousDescription) !== null && _l !== void 0 ? _l : null }) });
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
            list = list.filter((f) => {
                var _a, _b;
                return f.name.toLowerCase().includes(q) ||
                    ((_a = f.description) !== null && _a !== void 0 ? _a : "").toLowerCase().includes(q) ||
                    ((_b = f.mimeType) !== null && _b !== void 0 ? _b : "").toLowerCase().includes(q);
            });
        }
        return list;
    }, [files, deferredFolderId, debouncedQuery]);
    const childFolders = useMemo(() => {
        const parentKey = selectedFolderId !== null && selectedFolderId !== void 0 ? selectedFolderId : null;
        const rows = liveFolders.filter((f) => { var _a; return ((_a = f.parentId) !== null && _a !== void 0 ? _a : null) === parentKey; });
        const sortIndex = (f) => {
            var _a;
            const raw = (_a = f.metadata) === null || _a === void 0 ? void 0 : _a.sortIndex;
            if (typeof raw === "number" && Number.isFinite(raw))
                return raw;
            if (typeof raw === "string") {
                const n = Number(raw);
                if (Number.isFinite(n))
                    return n;
            }
            return 1000000;
        };
        rows.sort((a, b) => {
            const ai = sortIndex(a);
            const bi = sortIndex(b);
            if (ai !== bi)
                return ai - bi;
            return a.name.localeCompare(b.name);
        });
        return rows;
    }, [liveFolders, selectedFolderId]);
    const patchFolderColor = useCallback(async (folderId, colorTag) => {
        var _a, _b;
        if (!canWrite)
            return;
        const previousColorById = new Map(liveFolders.map((folder) => { var _a, _b; return [folder.id, (_b = (_a = folder.metadata) === null || _a === void 0 ? void 0 : _a.colorTag) !== null && _b !== void 0 ? _b : null]; }));
        setLiveFolders((prev) => prev.map((folder) => {
            var _a;
            return folder.id === folderId
                ? Object.assign(Object.assign({}, folder), { metadata: Object.assign(Object.assign({}, ((_a = folder.metadata) !== null && _a !== void 0 ? _a : {})), { colorTag: colorTag !== null && colorTag !== void 0 ? colorTag : null }) }) : folder;
        }));
        try {
            const res = await updateFolderColorAction(folderId, colorTag);
            if (!res.ok)
                throw new Error(res.error);
            const serverColorTag = (_b = (_a = res.data.metadata) === null || _a === void 0 ? void 0 : _a.colorTag) !== null && _b !== void 0 ? _b : null;
            setLiveFolders((prev) => prev.map((folder) => {
                var _a;
                return folder.id === folderId
                    ? Object.assign(Object.assign({}, folder), { metadata: Object.assign(Object.assign({}, ((_a = folder.metadata) !== null && _a !== void 0 ? _a : {})), { colorTag: serverColorTag }) }) : folder;
            }));
            showFilesToast("Folder color updated.", "success");
        }
        catch (_c) {
            setLiveFolders((prev) => prev.map((folder) => {
                var _a, _b;
                return folder.id === folderId
                    ? Object.assign(Object.assign({}, folder), { metadata: Object.assign(Object.assign({}, ((_a = folder.metadata) !== null && _a !== void 0 ? _a : {})), { colorTag: (_b = previousColorById.get(folderId)) !== null && _b !== void 0 ? _b : null }) }) : folder;
            }));
            showFilesToast("Could not update folder color.", "error");
            throw new Error("Could not update folder color.");
        }
    }, [canWrite, liveFolders]);
    const patchFolderIcon = useCallback(async (folderId, icon) => {
        var _a, _b;
        if (!canWrite)
            return;
        const previousIconById = new Map(liveFolders.map((folder) => { var _a, _b; return [folder.id, (_b = (_a = folder.metadata) === null || _a === void 0 ? void 0 : _a.icon) !== null && _b !== void 0 ? _b : null]; }));
        setLiveFolders((prev) => prev.map((folder) => {
            var _a;
            return folder.id === folderId
                ? Object.assign(Object.assign({}, folder), { metadata: Object.assign(Object.assign({}, ((_a = folder.metadata) !== null && _a !== void 0 ? _a : {})), { icon: icon !== null && icon !== void 0 ? icon : null }) }) : folder;
        }));
        try {
            const res = await updateFolderIconAction(folderId, icon);
            if (!res.ok)
                throw new Error(res.error);
            const serverIcon = (_b = (_a = res.data.metadata) === null || _a === void 0 ? void 0 : _a.icon) !== null && _b !== void 0 ? _b : null;
            setLiveFolders((prev) => prev.map((folder) => {
                var _a;
                return folder.id === folderId
                    ? Object.assign(Object.assign({}, folder), { metadata: Object.assign(Object.assign({}, ((_a = folder.metadata) !== null && _a !== void 0 ? _a : {})), { icon: serverIcon }) }) : folder;
            }));
            showFilesToast("Folder icon updated.", "success");
        }
        catch (_c) {
            setLiveFolders((prev) => prev.map((folder) => {
                var _a, _b;
                return folder.id === folderId
                    ? Object.assign(Object.assign({}, folder), { metadata: Object.assign(Object.assign({}, ((_a = folder.metadata) !== null && _a !== void 0 ? _a : {})), { icon: (_b = previousIconById.get(folderId)) !== null && _b !== void 0 ? _b : null }) }) : folder;
            }));
            showFilesToast("Could not update folder icon.", "error");
            throw new Error("Could not update folder icon.");
        }
    }, [canWrite, liveFolders]);
    const patchFolderDescription = useCallback(async (folderId, description) => {
        var _a, _b;
        if (!canWrite)
            return;
        const previousDescriptionById = new Map(liveFolders.map((folder) => { var _a, _b; return [folder.id, (_b = (_a = folder.metadata) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : null]; }));
        setLiveFolders((prev) => prev.map((folder) => {
            var _a;
            return folder.id === folderId
                ? Object.assign(Object.assign({}, folder), { metadata: Object.assign(Object.assign({}, ((_a = folder.metadata) !== null && _a !== void 0 ? _a : {})), { description: description !== null && description !== void 0 ? description : null }) }) : folder;
        }));
        try {
            const res = await updateFolderDescriptionAction(folderId, description);
            if (!res.ok)
                throw new Error(res.error);
            const serverDescription = (_b = (_a = res.data.metadata) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : null;
            setLiveFolders((prev) => prev.map((folder) => {
                var _a;
                return folder.id === folderId
                    ? Object.assign(Object.assign({}, folder), { metadata: Object.assign(Object.assign({}, ((_a = folder.metadata) !== null && _a !== void 0 ? _a : {})), { description: serverDescription }) }) : folder;
            }));
            showFilesToast("Folder description updated.", "success");
        }
        catch (_c) {
            setLiveFolders((prev) => prev.map((folder) => {
                var _a, _b;
                return folder.id === folderId
                    ? Object.assign(Object.assign({}, folder), { metadata: Object.assign(Object.assign({}, ((_a = folder.metadata) !== null && _a !== void 0 ? _a : {})), { description: (_b = previousDescriptionById.get(folderId)) !== null && _b !== void 0 ? _b : null }) }) : folder;
            }));
            showFilesToast("Could not update folder description.", "error");
            throw new Error("Could not update folder description.");
        }
    }, [canWrite, liveFolders]);
    const onFolderNavigate = useCallback((folderId) => {
        startTransition(() => {
            setSelectedFolderId(folderId);
            router.push(`/files/explorer?folderId=${encodeURIComponent(folderId)}`);
        });
    }, [router]);
    const selectedFolder = useMemo(() => { var _a; return selectedFolderId ? (_a = liveFolders.find((folder) => folder.id === selectedFolderId)) !== null && _a !== void 0 ? _a : null : null; }, [liveFolders, selectedFolderId]);
    const shareLinksFolder = useMemo(() => {
        var _a;
        return shareLinksFolderId
            ? (_a = liveFolders.find((folder) => folder.id === shareLinksFolderId)) !== null && _a !== void 0 ? _a : null
            : null;
    }, [liveFolders, shareLinksFolderId]);
    const crumbs = useMemo(() => {
        const base = [
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
    const onRowSelect = useCallback((file, index, e) => {
        e.preventDefault();
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (e.shiftKey && anchorIndex.current !== null) {
                const lo = Math.min(anchorIndex.current, index);
                const hi = Math.max(anchorIndex.current, index);
                for (let i = lo; i <= hi; i++) {
                    const row = filtered[i];
                    if (row)
                        next.add(row.id);
                }
            }
            else if (e.ctrlKey || e.metaKey) {
                if (next.has(file.id))
                    next.delete(file.id);
                else
                    next.add(file.id);
            }
            else {
                next.clear();
                next.add(file.id);
            }
            return next;
        });
        if (!e.shiftKey)
            anchorIndex.current = index;
    }, [filtered]);
    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
        anchorIndex.current = null;
    }, []);
    const bulkDelete = useCallback(async () => {
        if (!canWrite || selectedIds.size === 0)
            return;
        if (!window.confirm(`Delete ${selectedIds.size} file(s)?`))
            return;
        const res = await fetch("/api/files/batch", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "delete", fileIds: [...selectedIds] }),
        });
        if (res.ok) {
            clearSelection();
            showFilesToast("Files deleted.", "success");
            router.refresh();
        }
        else {
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
        const onKey = (ev) => {
            if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement)
                return;
            const ids = selectedIdsRef.current;
            if (ev.key === "Escape")
                clearSelection();
            if ((ev.key === "r" || ev.key === "R") && canWrite && ids.size === 1) {
                ev.preventDefault();
                setRenameRequestId([...ids][0]);
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
    const doMove = async (folderId) => {
        setMoveOpen(false);
        if (selectedIds.size === 0)
            return;
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
        }
        else {
            showFilesToast("Move failed.", "error");
        }
    };
    const onRename = async (id, name) => {
        const res = await fetch(`/api/files/${id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name }),
        });
        if (res.ok) {
            showFilesToast("Renamed.", "success");
            router.refresh();
        }
        else {
            showFilesToast("Rename failed.", "error");
        }
    };
    const onDragOverMain = (e) => {
        if (!canWrite)
            return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setDropOver(true);
    };
    const onDragLeaveMain = (e) => {
        if (e.currentTarget.contains(e.relatedTarget))
            return;
        setDropOver(false);
    };
    const onDropMain = useCallback((e) => {
        var _a, _b, _c;
        e.preventDefault();
        setDropOver(false);
        if (!canWrite) {
            showFilesToast("You do not have permission to upload here.", "error");
            return;
        }
        const f = (_c = (_b = (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.files) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : null;
        if (f) {
            setDroppedFile(f);
            setUploadOpen(true);
        }
    }, [canWrite]);
    return (_jsxs("div", { className: "space-y-5", children: [_jsx(FilesBreadcrumbs, { items: crumbs }), _jsxs("header", { className: "flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Files & Documents" }), _jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "File explorer" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search files\u2026", className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-1.5 text-sm text-[var(--z-fg)]", "aria-busy": debouncedQuery !== query }), _jsxs("button", { type: "button", onClick: () => setShowFolders((v) => !v), className: "rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]", children: [showFolders ? "Hide" : "Manage", " folders"] }), canWrite ? (_jsx("button", { type: "button", onClick: () => {
                                    setDroppedFile(null);
                                    setUploadOpen(true);
                                }, className: "rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90", children: "Upload" })) : null] })] }), canWrite && selectedIds.size > 0 ? (_jsxs("div", { className: "flex flex-wrap items-center gap-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-xs text-[var(--z-fg)]", children: [_jsxs("span", { children: [selectedIds.size, " selected"] }), _jsx("button", { type: "button", className: "rounded border border-[var(--z-border)] px-2 py-1 hover:bg-white/[0.04]", onClick: () => setMoveOpen(true), children: "Move to\u2026" }), _jsx("button", { type: "button", className: "rounded border border-red-500/40 px-2 py-1 text-red-400 hover:bg-red-500/10", onClick: () => void bulkDelete(), children: "Delete" }), _jsx("button", { type: "button", className: "text-[var(--z-muted)] hover:text-[var(--z-fg)]", onClick: clearSelection, children: "Clear" })] })) : null, _jsxs("div", { className: "grid gap-4 md:grid-cols-[260px,1fr]", children: [_jsxs("div", { children: [_jsx(FolderTree, { folders: liveFolders, selectedId: selectedFolderId, canWrite: canWrite, onFoldersReordered: () => router.refresh(), onFolderColorChange: canWrite ? patchFolderColor : undefined, onFolderIconChange: canWrite ? patchFolderIcon : undefined, onFolderDescriptionChange: canWrite ? patchFolderDescription : undefined, onOpenShareLinks: (folder) => {
                                    setAccessLogsLinkId(null);
                                    setShareLinksFolderId(folder.id);
                                }, onSelect: (f) => {
                                    var _a;
                                    const id = (_a = f === null || f === void 0 ? void 0 : f.id) !== null && _a !== void 0 ? _a : null;
                                    startTransition(() => {
                                        setSelectedFolderId(id);
                                        const qs = new URLSearchParams();
                                        if (id)
                                            qs.set("folderId", id);
                                        router.push(`/files/explorer${qs.toString() ? `?${qs}` : ""}`);
                                    });
                                } }, liveFolders.map((x) => x.updatedAt).join("|")), _jsx(FolderInspector, { folder: selectedFolder, canWrite: canWrite, onSaveDescription: canWrite ? patchFolderDescription : undefined, onOpenShareLinks: canWrite
                                    ? (folder) => {
                                        setAccessLogsLinkId(null);
                                        setShareLinksFolderId(folder.id);
                                    }
                                    : undefined })] }), _jsxs("div", { className: `relative space-y-4 rounded-lg transition-colors ${dropOver && canWrite
                            ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_94%)] ring-2 ring-[var(--z-accent)]/40"
                            : ""}`, onDragEnter: onDragOverMain, onDragOver: onDragOverMain, onDragLeave: onDragLeaveMain, onDrop: onDropMain, children: [dropOver && canWrite ? (_jsx("div", { className: "pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-[var(--z-accent)] bg-black/20 text-sm font-medium text-[var(--z-fg)]", children: "Drop file to upload" })) : null, showFolders ? (_jsx(FolderManager, { folders: liveFolders, canWrite: canWrite })) : null, _jsx(FileList, { files: filtered, folderRows: childFolders, emptyLabel: query
                                    ? "No files match your search."
                                    : selectedFolderId
                                        ? "This folder is empty."
                                        : "No files yet — upload your first document.", canWrite: canWrite, selectedIds: selectedIds, onRowSelect: canWrite ? onRowSelect : undefined, onRename: canWrite ? onRename : undefined, renameRequestId: renameRequestId, onRenameRequestConsumed: () => setRenameRequestId(null), onFolderNavigate: onFolderNavigate, onFolderColorChange: canWrite ? patchFolderColor : undefined, onFolderIconChange: canWrite ? patchFolderIcon : undefined, onFolderDescriptionChange: canWrite ? patchFolderDescription : undefined, onOpenShareLinks: (folder) => {
                                    setAccessLogsLinkId(null);
                                    setShareLinksFolderId(folder.id);
                                }, filesEmptyHint: query.trim()
                                    ? "No files match your search."
                                    : selectedFolderId
                                        ? "No files in this folder."
                                        : "No files yet — upload your first document." })] })] }), _jsx(FileUploadModal, { open: uploadOpen, onClose: () => {
                    setUploadOpen(false);
                    setDroppedFile(null);
                }, folderId: selectedFolderId, initialFile: droppedFile }), _jsx(MoveToFolderModal, { open: moveOpen, folders: liveFolders, onClose: () => setMoveOpen(false), onConfirm: (folderId) => void doMove(folderId) }), _jsx(FolderShareLinksPanel, { open: shareLinksFolderId != null, folderId: (_a = shareLinksFolder === null || shareLinksFolder === void 0 ? void 0 : shareLinksFolder.id) !== null && _a !== void 0 ? _a : null, folderName: (_b = shareLinksFolder === null || shareLinksFolder === void 0 ? void 0 : shareLinksFolder.name) !== null && _b !== void 0 ? _b : null, canShare: canWrite, accessLogsLinkId: accessLogsLinkId, onAccessLogsLinkIdChange: setAccessLogsLinkId, onClose: () => {
                    setAccessLogsLinkId(null);
                    setShareLinksFolderId(null);
                } })] }));
}
