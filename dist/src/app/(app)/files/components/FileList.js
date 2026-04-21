"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeAccessTimestamp } from "@/lib/files/formatters";
import { moveFolderAction } from "@/app/(app)/files/actions/moveFolderAction";
import { renameFolderAction } from "@/app/(app)/files/actions/renameFolderAction";
import { useFilesExplorerRuntimeOptional } from "../context/FilesExplorerRuntimeContext";
import { FilesLoading } from "./FilesStates";
import { showFilesToast } from "./filesToast";
import { FolderColorDot, FolderColorPicker, folderColorTooltip, isFolderColorTag, } from "./FolderColorPicker";
import { FolderIconGlyph, FolderIconPicker, folderIconTooltip, isFolderIconTag, } from "./FolderIconPicker";
import { FolderDescriptionEditor, folderDescriptionPreview, normalizeFolderDescription, } from "./FolderDescriptionEditor";
import { MoveFolderModal } from "./MoveFolderModal";
import { INLINE_RENAME_INPUT_CLASS, useInlineRename } from "./useInlineRename";
import { applyOptimisticFolderParent, folderWritableAsMoveDestination, validateFolderMove, } from "./useMoveFolder";
function formatBytes(n) {
    if (!n)
        return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let idx = 0;
    let v = n;
    while (v >= 1024 && idx < units.length - 1) {
        v /= 1024;
        idx += 1;
    }
    return `${v.toFixed(v >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}
function formatDate(iso) {
    try {
        return new Date(iso).toLocaleDateString();
    }
    catch (_a) {
        return iso.slice(0, 10);
    }
}
function renderAccessOrUpdated(metadata, fallbackIso) {
    const normalized = normalizeAccessTimestamp(metadata);
    if (normalized.iso) {
        return { label: normalized.relative, title: new Date(normalized.iso).toLocaleString() };
    }
    if (fallbackIso)
        return { label: formatDate(fallbackIso) };
    return { label: "—" };
}
const COL_COUNT_WITH_SELECT = 7;
const COL_COUNT_NO_SELECT = 6;
function folderSortIndex(f) {
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
}
function sortChildFolderRows(rows) {
    return [...rows].sort((a, b) => {
        const ai = folderSortIndex(a);
        const bi = folderSortIndex(b);
        if (ai !== bi)
            return ai - bi;
        return a.name.localeCompare(b.name);
    });
}
export function FileList({ files, folderRows = [], emptyLabel = "No files yet.", loading, canWrite = false, selectedIds, onRowSelect, onRename, renameRequestId, onRenameRequestConsumed, onFolderNavigate, onFolderColorChange, onFolderIconChange, onFolderDescriptionChange, onOpenShareLinks, filesEmptyHint = "No files in this folder.", }) {
    var _a, _b, _c, _d, _e, _f;
    const router = useRouter();
    const interactive = Boolean(canWrite && selectedIds && onRowSelect);
    const [renameId, setRenameId] = useState(null);
    const [renameVal, setRenameVal] = useState("");
    const renameRef = useRef(null);
    const [folderNameOverride, setFolderNameOverride] = useState({});
    const [folderRenamingId, setFolderRenamingId] = useState(null);
    const [folderRenameSaving, setFolderRenameSaving] = useState(false);
    const explorerRuntime = useFilesExplorerRuntimeOptional();
    const fullFolders = useMemo(() => { var _a; return (_a = explorerRuntime === null || explorerRuntime === void 0 ? void 0 : explorerRuntime.folders) !== null && _a !== void 0 ? _a : []; }, [explorerRuntime]);
    const listParentKey = useMemo(() => {
        var _a;
        if (folderRows.length === 0)
            return null;
        return (_a = folderRows[0].parentId) !== null && _a !== void 0 ? _a : null;
    }, [folderRows]);
    const [movedOutIds, setMovedOutIds] = useState([]);
    const [movedInById, setMovedInById] = useState({});
    const [folderMenuOpenId, setFolderMenuOpenId] = useState(null);
    const [folderColorPickerForId, setFolderColorPickerForId] = useState(null);
    const [folderIconPickerForId, setFolderIconPickerForId] = useState(null);
    const [folderDescriptionPickerForId, setFolderDescriptionPickerForId] = useState(null);
    const [folderDescriptionDraft, setFolderDescriptionDraft] = useState(null);
    const [moveModalFolderId, setMoveModalFolderId] = useState(null);
    const [folderColorOverride, setFolderColorOverride] = useState({});
    const [folderIconOverride, setFolderIconOverride] = useState({});
    const [folderDescriptionOverride, setFolderDescriptionOverride] = useState({});
    const folderRowsSig = useMemo(() => folderRows.map((f) => { var _a; return `${f.id}:${(_a = f.parentId) !== null && _a !== void 0 ? _a : ""}`; }).join("|"), [folderRows]);
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
        const extras = Object.values(movedInById).filter((f) => { var _a; return ((_a = f.parentId) !== null && _a !== void 0 ? _a : null) === (listParentKey !== null && listParentKey !== void 0 ? listParentKey : null); });
        const map = new Map();
        for (const f of base)
            map.set(f.id, f);
        for (const f of extras)
            map.set(f.id, f);
        return sortChildFolderRows([...map.values()]);
    }, [folderRows, movedOutIds, movedInById, listParentKey]);
    const resolvedFolderRows = useMemo(() => displayFolderRows.map((f) => {
        var _a, _b;
        const colorOverride = folderColorOverride[f.id];
        const iconOverride = folderIconOverride[f.id];
        const descriptionOverride = folderDescriptionOverride[f.id];
        return Object.assign(Object.assign({}, f), { name: (_a = folderNameOverride[f.id]) !== null && _a !== void 0 ? _a : f.name, metadata: Object.assign(Object.assign(Object.assign(Object.assign({}, ((_b = f.metadata) !== null && _b !== void 0 ? _b : {})), (colorOverride === undefined ? {} : { colorTag: colorOverride })), (iconOverride === undefined ? {} : { icon: iconOverride })), (descriptionOverride === undefined ? {} : { description: descriptionOverride })) });
    }), [
        displayFolderRows,
        folderNameOverride,
        folderColorOverride,
        folderIconOverride,
        folderDescriptionOverride,
    ]);
    const folderRenameOriginal = folderRenamingId != null
        ? ((_c = (_a = folderNameOverride[folderRenamingId]) !== null && _a !== void 0 ? _a : (_b = displayFolderRows.find((f) => f.id === folderRenamingId)) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : "")
        : "";
    const { draft: folderRenameDraft, setDraft: setFolderRenameDraft, inputRef: folderRenameInputRef, skipBlurSaveRef: folderSkipBlurRef, cancelWithoutBlurSave: cancelFolderDraft, } = useInlineRename({
        originalName: folderRenameOriginal,
        isEditing: folderRenamingId != null,
    });
    const cancelFolderListRename = useCallback(() => {
        var _a, _b;
        const id = folderRenamingId;
        const revert = id ? ((_b = (_a = folderRows.find((f) => f.id === id)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "") : "";
        cancelFolderDraft(revert);
        setFolderRenamingId(null);
    }, [folderRenamingId, folderRows, cancelFolderDraft]);
    const commitFolderListRename = useCallback(async () => {
        var _a, _b;
        const id = folderRenamingId;
        if (!id || !canWrite || folderRenameSaving)
            return;
        const trimmed = folderRenameDraft.trim();
        const baseline = (_b = (_a = folderRows.find((f) => f.id === id)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "";
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
        setFolderNameOverride((prev) => (Object.assign(Object.assign({}, prev), { [id]: trimmed })));
        const res = await renameFolderAction(id, trimmed);
        if (!res.ok) {
            setFolderNameOverride((prev) => {
                const next = Object.assign({}, prev);
                delete next[id];
                return next;
            });
            showFilesToast(res.error, "error");
        }
        else {
            showFilesToast("Folder renamed.", "success");
            setFolderNameOverride((prev) => (Object.assign(Object.assign({}, prev), { [id]: res.data.name })));
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
    const beginRename = useCallback((f) => {
        if (!onRename)
            return;
        setRenameId(f.id);
        setRenameVal(f.name);
        requestAnimationFrame(() => { var _a; return (_a = renameRef.current) === null || _a === void 0 ? void 0 : _a.focus(); });
    }, [onRename]);
    useEffect(() => {
        if (!renameRequestId || !onRename)
            return;
        const f = files.find((x) => x.id === renameRequestId);
        queueMicrotask(() => {
            if (f)
                beginRename(f);
            onRenameRequestConsumed === null || onRenameRequestConsumed === void 0 ? void 0 : onRenameRequestConsumed();
        });
    }, [renameRequestId, files, onRename, beginRename, onRenameRequestConsumed]);
    useEffect(() => {
        if (!canWrite)
            return;
        const onKey = (e) => {
            var _a;
            if (e.key !== "F2")
                return;
            if (moveModalFolderId)
                return;
            if (folderColorPickerForId || folderIconPickerForId || folderDescriptionPickerForId)
                return;
            const t = e.target;
            const row = (_a = t === null || t === void 0 ? void 0 : t.closest) === null || _a === void 0 ? void 0 : _a.call(t, "tr[data-folder-row]");
            if (!row)
                return;
            const id = row.getAttribute("data-folder-id");
            if (!id || folderRenamingId)
                return;
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
        if (!renameId || !onRename)
            return;
        const name = renameVal.trim();
        if (name)
            await onRename(renameId, name);
        setRenameId(null);
    }, [onRename, renameId, renameVal]);
    const openMoveFolderModal = useCallback((folderId) => {
        if (!fullFolders.length) {
            showFilesToast("Folder tree is not available here.", "error");
            return;
        }
        setFolderMenuOpenId(null);
        setFolderColorPickerForId(null);
        setFolderIconPickerForId(null);
        setFolderDescriptionPickerForId(null);
        setMoveModalFolderId(folderId);
    }, [fullFolders.length]);
    const commitFolderMove = useCallback(async (folderId, newParentId) => {
        var _a, _b;
        if (!canWrite)
            return;
        const list = fullFolders;
        if (!list.length)
            return;
        const err = validateFolderMove(list, folderId, newParentId);
        if (err) {
            showFilesToast(err, "error");
            return;
        }
        if (!folderWritableAsMoveDestination(list, newParentId, (_a = explorerRuntime === null || explorerRuntime === void 0 ? void 0 : explorerRuntime.permissionContext) !== null && _a !== void 0 ? _a : null)) {
            showFilesToast("You cannot move a folder into that location.", "error");
            return;
        }
        const selfRow = folderRows.find((f) => f.id === folderId);
        const wasUnderList = !!selfRow && ((_b = selfRow.parentId) !== null && _b !== void 0 ? _b : null) === (listParentKey !== null && listParentKey !== void 0 ? listParentKey : null);
        const stillUnderList = (newParentId !== null && newParentId !== void 0 ? newParentId : null) === (listParentKey !== null && listParentKey !== void 0 ? listParentKey : null);
        const prevOut = movedOutIds;
        const prevIn = Object.assign({}, movedInById);
        const optimisticRow = applyOptimisticFolderParent(list, folderId, newParentId).find((f) => f.id === folderId);
        if (wasUnderList && !stillUnderList) {
            setMovedOutIds((prev) => (prev.includes(folderId) ? prev : [...prev, folderId]));
            setMovedInById((prev) => {
                const next = Object.assign({}, prev);
                delete next[folderId];
                return next;
            });
        }
        else if (!wasUnderList && stillUnderList && optimisticRow) {
            setMovedInById((prev) => (Object.assign(Object.assign({}, prev), { [folderId]: optimisticRow })));
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
    }, [
        canWrite,
        fullFolders,
        explorerRuntime,
        folderRows,
        listParentKey,
        movedOutIds,
        movedInById,
        router,
    ]);
    useEffect(() => {
        if (!folderMenuOpenId)
            return;
        let remove;
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
            remove === null || remove === void 0 ? void 0 : remove();
        };
    }, [folderMenuOpenId]);
    useEffect(() => {
        if (!folderColorPickerForId)
            return;
        const onKeyDown = (event) => {
            if (event.key !== "Escape")
                return;
            setFolderColorPickerForId(null);
            setFolderMenuOpenId(null);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [folderColorPickerForId]);
    useEffect(() => {
        if (!folderIconPickerForId)
            return;
        const onKeyDown = (event) => {
            if (event.key !== "Escape")
                return;
            setFolderIconPickerForId(null);
            setFolderMenuOpenId(null);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [folderIconPickerForId]);
    useEffect(() => {
        if (!folderDescriptionPickerForId)
            return;
        const onKeyDown = (event) => {
            if (event.key !== "Escape")
                return;
            setFolderDescriptionPickerForId(null);
            setFolderMenuOpenId(null);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [folderDescriptionPickerForId]);
    const handleFolderColorChange = useCallback(async (folderId, colorTag) => {
        var _a, _b;
        if (!onFolderColorChange)
            return;
        const previousRaw = (_b = (_a = resolvedFolderRows.find((folder) => folder.id === folderId)) === null || _a === void 0 ? void 0 : _a.metadata) === null || _b === void 0 ? void 0 : _b.colorTag;
        const previousColor = isFolderColorTag(previousRaw) ? previousRaw : null;
        setFolderColorOverride((prev) => (Object.assign(Object.assign({}, prev), { [folderId]: colorTag !== null && colorTag !== void 0 ? colorTag : null })));
        try {
            await onFolderColorChange(folderId, colorTag);
        }
        catch (_c) {
            setFolderColorOverride((prev) => (Object.assign(Object.assign({}, prev), { [folderId]: previousColor })));
        }
    }, [onFolderColorChange, resolvedFolderRows]);
    const handleFolderIconChange = useCallback(async (folderId, icon) => {
        var _a, _b;
        if (!onFolderIconChange)
            return;
        const previousRaw = (_b = (_a = resolvedFolderRows.find((folder) => folder.id === folderId)) === null || _a === void 0 ? void 0 : _a.metadata) === null || _b === void 0 ? void 0 : _b.icon;
        const previousIcon = isFolderIconTag(previousRaw) ? previousRaw : null;
        setFolderIconOverride((prev) => (Object.assign(Object.assign({}, prev), { [folderId]: icon !== null && icon !== void 0 ? icon : null })));
        try {
            await onFolderIconChange(folderId, icon);
        }
        catch (_c) {
            setFolderIconOverride((prev) => (Object.assign(Object.assign({}, prev), { [folderId]: previousIcon })));
        }
    }, [onFolderIconChange, resolvedFolderRows]);
    const handleFolderDescriptionChange = useCallback(async (folderId, description) => {
        var _a, _b;
        if (!onFolderDescriptionChange)
            return;
        const previousRaw = (_b = (_a = resolvedFolderRows.find((folder) => folder.id === folderId)) === null || _a === void 0 ? void 0 : _a.metadata) === null || _b === void 0 ? void 0 : _b.description;
        const previousDescription = typeof previousRaw === "string" ? normalizeFolderDescription(previousRaw) : null;
        setFolderDescriptionOverride((prev) => (Object.assign(Object.assign({}, prev), { [folderId]: description !== null && description !== void 0 ? description : null })));
        try {
            await onFolderDescriptionChange(folderId, description);
        }
        catch (_c) {
            setFolderDescriptionOverride((prev) => (Object.assign(Object.assign({}, prev), { [folderId]: previousDescription })));
        }
    }, [onFolderDescriptionChange, resolvedFolderRows]);
    const colCount = interactive ? COL_COUNT_WITH_SELECT : COL_COUNT_NO_SELECT;
    if (loading) {
        return (_jsxs("div", { className: "overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsx("div", { className: "animate-pulse space-y-0 divide-y divide-[var(--z-border)] p-4", children: [1, 2, 3, 4, 5].map((i) => (_jsxs("div", { className: "flex gap-4 py-3", children: [_jsx("div", { className: "h-4 flex-1 rounded bg-white/[0.06]" }), _jsx("div", { className: "h-4 w-24 rounded bg-white/[0.06]" }), _jsx("div", { className: "h-4 w-16 rounded bg-white/[0.06]" })] }, i))) }), _jsx("div", { className: "border-t border-[var(--z-border)] px-4 py-3", children: _jsx(FilesLoading, { label: "Loading files..." }) })] }));
    }
    if (files.length === 0 && displayFolderRows.length === 0) {
        return (_jsx("div", { className: "rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface)]/40 p-10 text-center text-sm text-[var(--z-muted)]", children: emptyLabel }));
    }
    const folderNavigate = (folderId, e) => {
        e.preventDefault();
        onFolderNavigate === null || onFolderNavigate === void 0 ? void 0 : onFolderNavigate(folderId);
    };
    return (_jsxs("div", { className: "max-h-[min(70vh,720px)] overflow-auto rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] transition-shadow duration-200", children: [_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "sticky top-0 z-10 bg-[var(--z-surface)] text-left text-xs uppercase tracking-wider text-[var(--z-muted)] shadow-[0_1px_0_var(--z-border)]", children: _jsxs("tr", { children: [interactive ? (_jsx("th", { className: "w-10 px-2 py-3 font-medium", children: _jsx("span", { className: "sr-only", children: "Select" }) })) : null, _jsx("th", { className: "px-4 py-3 font-medium", children: "Name" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Type" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Size" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Visibility" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Signature" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Updated" })] }) }), _jsxs("tbody", { className: "divide-y divide-[var(--z-border)]", children: [resolvedFolderRows.map((folder) => {
                                var _a, _b, _c, _d, _e;
                                const colorTag = isFolderColorTag((_a = folder.metadata) === null || _a === void 0 ? void 0 : _a.colorTag)
                                    ? (_b = folder.metadata) === null || _b === void 0 ? void 0 : _b.colorTag
                                    : null;
                                const iconTag = isFolderIconTag((_c = folder.metadata) === null || _c === void 0 ? void 0 : _c.icon) ? (_d = folder.metadata) === null || _d === void 0 ? void 0 : _d.icon : null;
                                const descriptionRaw = typeof ((_e = folder.metadata) === null || _e === void 0 ? void 0 : _e.description) === "string" ? folder.metadata.description : null;
                                const description = normalizeFolderDescription(descriptionRaw);
                                const descriptionPreview = folderDescriptionPreview(description, 60);
                                const isFolderRenaming = folderRenamingId === folder.id;
                                const menuOpen = folderMenuOpenId === folder.id;
                                return (_jsxs("tr", { "data-folder-row": true, "data-folder-id": folder.id, className: "group relative bg-white/[0.02] outline-none hover:bg-white/[0.04] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--z-accent)]", onDoubleClick: () => {
                                        if (onFolderNavigate)
                                            onFolderNavigate(folder.id);
                                    }, onContextMenu: (e) => {
                                        if (!canWrite || !fullFolders.length || isFolderRenaming)
                                            return;
                                        e.preventDefault();
                                        setFolderMenuOpenId(folder.id);
                                        setFolderColorPickerForId(null);
                                        setFolderIconPickerForId(null);
                                        setFolderDescriptionPickerForId(null);
                                    }, children: [interactive ? (_jsxs("td", { className: "px-2 py-3 text-[var(--z-muted)]", "aria-label": "Folders", children: [_jsx("span", { className: "sr-only", children: "Not applicable" }), _jsx("span", { className: "text-[10px] text-[var(--z-muted)]", children: "\u2014" })] })) : null, _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsx("span", { title: folderIconTooltip(iconTag), "aria-label": folderIconTooltip(iconTag), children: _jsx(FolderIconGlyph, { icon: iconTag, className: "text-[var(--z-fg)]/80" }) }), colorTag ? (_jsx("span", { title: folderColorTooltip(colorTag), "aria-label": folderColorTooltip(colorTag), children: _jsx(FolderColorDot, { colorTag: colorTag }) })) : null, _jsxs("div", { className: "flex min-w-0 flex-1 items-center gap-2", children: [isFolderRenaming ? (_jsx("input", { ref: folderRenameInputRef, disabled: folderRenameSaving, value: folderRenameDraft, onChange: (e) => setFolderRenameDraft(e.target.value), onKeyDown: (e) => {
                                                                    e.stopPropagation();
                                                                    if (e.key === "Enter") {
                                                                        e.preventDefault();
                                                                        void commitFolderListRename();
                                                                    }
                                                                    else if (e.key === "Escape") {
                                                                        e.preventDefault();
                                                                        cancelFolderListRename();
                                                                    }
                                                                }, onBlur: () => {
                                                                    if (folderSkipBlurRef.current)
                                                                        return;
                                                                    void commitFolderListRename();
                                                                }, onClick: (e) => e.stopPropagation(), "aria-label": `Rename folder ${folder.name}`, className: `${INLINE_RENAME_INPUT_CLASS} min-w-0 flex-1 outline-none` })) : canWrite ? (_jsx("button", { type: "button", onClick: () => setFolderRenamingId(folder.id), className: "min-w-0 truncate text-left font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]", children: folder.name })) : onFolderNavigate ? (_jsx("button", { type: "button", onClick: (e) => folderNavigate(folder.id, e), className: "min-w-0 truncate text-left font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]", children: folder.name })) : (_jsx(Link, { href: `/files/explorer?folderId=${encodeURIComponent(folder.id)}`, className: "min-w-0 truncate font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]", children: folder.name })), !isFolderRenaming && descriptionPreview ? (_jsx("span", { className: "truncate text-[11px] text-[var(--z-muted)]", title: description !== null && description !== void 0 ? description : undefined, children: descriptionPreview })) : null, onFolderNavigate && !isFolderRenaming ? (_jsx("button", { type: "button", onClick: (e) => folderNavigate(folder.id, e), className: "shrink-0 rounded border border-[var(--z-border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)] hover:border-[var(--z-accent)] hover:text-[var(--z-accent)]", children: "Open" })) : null, canWrite && fullFolders.length > 0 && !isFolderRenaming ? (_jsxs("div", { className: "relative shrink-0", children: [_jsx("button", { type: "button", "aria-haspopup": "menu", "aria-expanded": menuOpen, onClick: (e) => {
                                                                            e.stopPropagation();
                                                                            setFolderMenuOpenId((cur) => (cur === folder.id ? null : folder.id));
                                                                            setFolderColorPickerForId(null);
                                                                            setFolderIconPickerForId(null);
                                                                            setFolderDescriptionPickerForId(null);
                                                                        }, className: "rounded border border-[var(--z-border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)] hover:border-[var(--z-accent)] hover:text-[var(--z-accent)]", children: "\u00E2\u2039\u00AF" }), menuOpen ? (_jsxs("div", { role: "menu", className: "absolute right-0 z-20 mt-1 min-w-[9rem] rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] py-1 text-xs shadow-lg", onClick: (e) => e.stopPropagation(), children: [_jsx("button", { type: "button", role: "menuitem", className: "block w-full px-3 py-2 text-left text-[var(--z-fg)] hover:bg-white/[0.05]", onClick: () => openMoveFolderModal(folder.id), children: "Move to..." }), onFolderColorChange ? (_jsx("button", { type: "button", role: "menuitem", className: "block w-full px-3 py-2 text-left text-[var(--z-fg)] hover:bg-white/[0.05]", onClick: () => {
                                                                                    setFolderColorPickerForId((current) => current === folder.id ? null : folder.id);
                                                                                    setFolderIconPickerForId(null);
                                                                                }, children: "Set Color" })) : null, onFolderIconChange ? (_jsx("button", { type: "button", role: "menuitem", className: "block w-full px-3 py-2 text-left text-[var(--z-fg)] hover:bg-white/[0.05]", onClick: () => {
                                                                                    setFolderIconPickerForId((current) => current === folder.id ? null : folder.id);
                                                                                    setFolderColorPickerForId(null);
                                                                                    setFolderDescriptionPickerForId(null);
                                                                                }, children: "Set Icon" })) : null, onFolderDescriptionChange ? (_jsx("button", { type: "button", role: "menuitem", className: "block w-full px-3 py-2 text-left text-[var(--z-fg)] hover:bg-white/[0.05]", onClick: () => {
                                                                                    setFolderDescriptionDraft(description);
                                                                                    setFolderDescriptionPickerForId((current) => current === folder.id ? null : folder.id);
                                                                                    setFolderColorPickerForId(null);
                                                                                    setFolderIconPickerForId(null);
                                                                                }, children: "Set Description" })) : null, onOpenShareLinks ? (_jsx("button", { type: "button", role: "menuitem", className: "block w-full px-3 py-2 text-left text-[var(--z-fg)] hover:bg-white/[0.05]", onClick: () => {
                                                                                    onOpenShareLinks(folder);
                                                                                    setFolderDescriptionPickerForId(null);
                                                                                    setFolderColorPickerForId(null);
                                                                                    setFolderIconPickerForId(null);
                                                                                    setFolderMenuOpenId(null);
                                                                                }, children: "Share links" })) : null, folderColorPickerForId === folder.id && onFolderColorChange ? (_jsx("div", { className: "px-2 pb-2 pt-1", children: _jsx(FolderColorPicker, { value: colorTag, onChange: (nextColorTag) => {
                                                                                        void handleFolderColorChange(folder.id, nextColorTag).finally(() => {
                                                                                            setFolderColorPickerForId(null);
                                                                                            setFolderIconPickerForId(null);
                                                                                            setFolderDescriptionPickerForId(null);
                                                                                            setFolderMenuOpenId(null);
                                                                                        });
                                                                                    } }) })) : null, folderIconPickerForId === folder.id && onFolderIconChange ? (_jsx("div", { className: "px-2 pb-2 pt-1", children: _jsx(FolderIconPicker, { value: iconTag, onChange: (nextIcon) => {
                                                                                        void handleFolderIconChange(folder.id, nextIcon).finally(() => {
                                                                                            setFolderIconPickerForId(null);
                                                                                            setFolderColorPickerForId(null);
                                                                                            setFolderDescriptionPickerForId(null);
                                                                                            setFolderMenuOpenId(null);
                                                                                        });
                                                                                    } }) })) : null, folderDescriptionPickerForId === folder.id &&
                                                                                onFolderDescriptionChange ? (_jsx("div", { className: "px-2 pb-2 pt-1", children: _jsx(FolderDescriptionEditor, { value: folderDescriptionDraft, onChange: setFolderDescriptionDraft, onCancel: () => {
                                                                                        setFolderDescriptionDraft(description);
                                                                                        setFolderDescriptionPickerForId(null);
                                                                                        setFolderMenuOpenId(null);
                                                                                    }, onSave: () => {
                                                                                        const nextDescription = normalizeFolderDescription(folderDescriptionDraft);
                                                                                        void handleFolderDescriptionChange(folder.id, nextDescription).finally(() => {
                                                                                            setFolderDescriptionPickerForId(null);
                                                                                            setFolderColorPickerForId(null);
                                                                                            setFolderIconPickerForId(null);
                                                                                            setFolderMenuOpenId(null);
                                                                                        });
                                                                                    } }) })) : null] })) : null] })) : null] })] }) }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: "Folder" }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: "\u2014" }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "inline-flex items-center rounded-full border border-[var(--z-border)] px-2 py-0.5 text-xs text-[var(--z-muted)]", children: folder.visibility }) }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: "\u2014" }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: (() => {
                                                const access = renderAccessOrUpdated(folder.metadata, folder.updatedAt);
                                                return _jsx("span", { title: access.title, children: access.label });
                                            })() })] }, `folder-${folder.id}`));
                            }), files.map((f, index) => {
                                var _a, _b;
                                return (_jsxs("tr", { className: `hover:bg-white/[0.02] ${(selectedIds === null || selectedIds === void 0 ? void 0 : selectedIds.has(f.id)) ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)]" : ""}`, children: [interactive ? (_jsx("td", { className: "px-2 py-3", children: _jsx("input", { type: "checkbox", checked: (_a = selectedIds === null || selectedIds === void 0 ? void 0 : selectedIds.has(f.id)) !== null && _a !== void 0 ? _a : false, onClick: (e) => onRowSelect === null || onRowSelect === void 0 ? void 0 : onRowSelect(f, index, e), readOnly: true, className: "accent-[var(--z-accent)]", "aria-label": `Select ${f.name}` }) })) : null, _jsx("td", { className: "px-4 py-3", children: renameId === f.id ? (_jsx("input", { ref: renameRef, value: renameVal, onChange: (e) => setRenameVal(e.target.value), onBlur: () => void commitRename(), onKeyDown: (e) => {
                                                    if (e.key === "Enter")
                                                        void commitRename();
                                                    if (e.key === "Escape")
                                                        setRenameId(null);
                                                }, className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-sm" })) : (_jsxs(_Fragment, { children: [_jsx(Link, { href: `/files/${f.id}`, className: "font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]", children: f.name }), canWrite && onRename ? (_jsx("button", { type: "button", onClick: () => beginRename(f), className: "ml-2 text-[10px] uppercase tracking-wide text-[var(--z-muted)] hover:text-[var(--z-accent)]", children: "Rename" })) : null, f.description ? (_jsx("div", { className: "mt-0.5 line-clamp-1 text-xs text-[var(--z-muted)]", children: f.description })) : null] })) }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: f.mimeType || "—" }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: formatBytes(f.size) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "inline-flex items-center rounded-full border border-[var(--z-border)] px-2 py-0.5 text-xs text-[var(--z-muted)]", children: f.visibility }) }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: (_b = f.signatureStatus) !== null && _b !== void 0 ? _b : "—" }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: (() => {
                                                const access = renderAccessOrUpdated(f.metadata, f.updatedAt);
                                                return _jsx("span", { title: access.title, children: access.label });
                                            })() })] }, f.id));
                            }), files.length === 0 && displayFolderRows.length > 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: colCount, className: "px-4 py-6 text-center text-sm text-[var(--z-muted)]", children: filesEmptyHint }) })) : null] })] }), moveModalFolderId && fullFolders.length > 0 ? (_jsx(MoveFolderModal, { open: true, folders: fullFolders, movingFolderId: moveModalFolderId, defaultDestinationParentId: (_e = (_d = fullFolders.find((f) => f.id === moveModalFolderId)) === null || _d === void 0 ? void 0 : _d.parentId) !== null && _e !== void 0 ? _e : null, permissionContext: (_f = explorerRuntime === null || explorerRuntime === void 0 ? void 0 : explorerRuntime.permissionContext) !== null && _f !== void 0 ? _f : null, onClose: () => setMoveModalFolderId(null), onConfirm: (newParentId) => void commitFolderMove(moveModalFolderId, newParentId) })) : null] }));
}
