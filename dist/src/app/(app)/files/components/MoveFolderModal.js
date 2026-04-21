"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, } from "react";
import { useAutoHeightTransition } from "./useAutoHeightTransition";
import { buildVisibleTreeItems, getEffectiveExpanded, indexById, } from "./useTreeKeyboardNavigation";
import { folderWritableAsMoveDestination, validateFolderMove, isFolderUnderAncestor, } from "./useMoveFolder";
import { FolderColorDot, folderColorTooltip, isFolderColorTag } from "./FolderColorPicker";
import { FolderIconGlyph, folderIconTooltip, isFolderIconTag } from "./FolderIconPicker";
import { folderDescriptionPreview, normalizeFolderDescription } from "./FolderDescriptionEditor";
function getFolderSortIndex(folder) {
    var _a;
    const raw = (_a = folder.metadata) === null || _a === void 0 ? void 0 : _a.sortIndex;
    if (typeof raw === "number" && Number.isFinite(raw))
        return raw;
    if (typeof raw === "string") {
        const n = Number(raw);
        if (Number.isFinite(n))
            return n;
    }
    return 1000000;
}
function buildTree(folders) {
    const map = new Map();
    for (const f of folders)
        map.set(f.id, Object.assign(Object.assign({}, f), { children: [] }));
    const roots = [];
    for (const node of map.values()) {
        if (node.parentId && map.has(node.parentId)) {
            map.get(node.parentId).children.push(node);
        }
        else {
            roots.push(node);
        }
    }
    const sortNodes = (nodes) => {
        nodes.sort((a, b) => {
            const ai = getFolderSortIndex(a);
            const bi = getFolderSortIndex(b);
            if (ai !== bi)
                return ai - bi;
            return a.name.localeCompare(b.name);
        });
        for (const n of nodes)
            sortNodes(n.children);
    };
    sortNodes(roots);
    return roots;
}
function PickerRow({ node, depth, expanded, onToggle, movingFolderId, folders, selectedParentId, onSelectParent, permissionContext, }) {
    var _a, _b, _c, _d, _e;
    const isOpen = getEffectiveExpanded(node.id, depth, expanded);
    const hasChildren = node.children.length > 0;
    const childSig = node.children.length === 0 ? "" : node.children.map((c) => c.id).join("|");
    const branchOpen = hasChildren && isOpen;
    const { innerRef, outerStyle, onTransitionEnd } = useAutoHeightTransition(branchOpen, childSig);
    const isMovingSelf = node.id === movingFolderId;
    const isUnderMoved = isFolderUnderAncestor(folders, movingFolderId, node.id);
    const writable = folderWritableAsMoveDestination(folders, node.id, permissionContext);
    const moveOk = validateFolderMove(folders, movingFolderId, node.id) === null;
    const selectable = !isMovingSelf && !isUnderMoved && writable && moveOk;
    const isSelected = selectedParentId === node.id;
    const colorTag = isFolderColorTag((_a = node.metadata) === null || _a === void 0 ? void 0 : _a.colorTag)
        ? (_b = node.metadata) === null || _b === void 0 ? void 0 : _b.colorTag
        : null;
    const iconTag = isFolderIconTag((_c = node.metadata) === null || _c === void 0 ? void 0 : _c.icon) ? (_d = node.metadata) === null || _d === void 0 ? void 0 : _d.icon : null;
    const descriptionRaw = typeof ((_e = node.metadata) === null || _e === void 0 ? void 0 : _e.description) === "string" ? node.metadata.description : null;
    const description = normalizeFolderDescription(descriptionRaw);
    const descriptionPreview = folderDescriptionPreview(description, 60);
    return (_jsxs("div", { className: "relative", children: [_jsxs("div", { role: "treeitem", "aria-expanded": hasChildren ? isOpen : undefined, "aria-level": depth + 1, "aria-selected": isSelected, className: `flex w-full items-stretch rounded text-sm outline-none ${isSelected
                    ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_82%)] text-[var(--z-accent)] ring-1 ring-[var(--z-accent)]/35"
                    : selectable
                        ? "text-[var(--z-fg)]/90 hover:bg-white/[0.04]"
                        : "cursor-not-allowed text-[var(--z-fg)]/35"}`, style: { paddingLeft: 8 + depth * 14 }, children: [_jsx("button", { type: "button", tabIndex: -1, className: "inline-flex w-6 shrink-0 items-center justify-center text-[var(--z-muted)] hover:text-[var(--z-fg)]", "aria-hidden": hasChildren ? undefined : true, onClick: (e) => {
                            e.stopPropagation();
                            if (hasChildren)
                                onToggle(node.id, depth);
                        }, "aria-label": hasChildren ? (isOpen ? "Collapse" : "Expand") : undefined, children: hasChildren ? (isOpen ? "▾" : "▸") : "·" }), _jsxs("button", { type: "button", disabled: !selectable, onClick: () => selectable && onSelectParent(node.id), className: "flex min-w-0 flex-1 items-center gap-1.5 truncate py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] disabled:pointer-events-none", children: [_jsx("span", { title: folderIconTooltip(iconTag), "aria-label": folderIconTooltip(iconTag), children: _jsx(FolderIconGlyph, { icon: iconTag, className: "text-[var(--z-fg)]/80" }) }), colorTag ? (_jsx("span", { title: folderColorTooltip(colorTag), "aria-label": folderColorTooltip(colorTag), children: _jsx(FolderColorDot, { colorTag: colorTag }) })) : null, _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate", children: node.name }), descriptionPreview ? (_jsx("span", { className: "block truncate text-[10px] text-[var(--z-muted)]", title: description !== null && description !== void 0 ? description : undefined, children: descriptionPreview })) : null] }), isMovingSelf ? (_jsx("span", { className: "ml-1 text-[10px] text-[var(--z-muted)]", children: "(this folder)" })) : null, isUnderMoved && !isMovingSelf ? (_jsx("span", { className: "ml-1 text-[10px] text-[var(--z-muted)]", children: "(inside selection)" })) : null] })] }), hasChildren ? (_jsx("div", { role: "group", className: "overflow-hidden", style: outerStyle, onTransitionEnd: onTransitionEnd, children: _jsx("div", { ref: innerRef, children: node.children.map((c) => (_jsx(PickerRow, { node: c, depth: depth + 1, expanded: expanded, onToggle: onToggle, movingFolderId: movingFolderId, folders: folders, selectedParentId: selectedParentId, onSelectParent: onSelectParent, permissionContext: permissionContext }, c.id))) }) })) : null] }));
}
export function MoveFolderModal({ open, onClose, folders, movingFolderId, defaultDestinationParentId, permissionContext, onConfirm, }) {
    const dialogRef = useRef(null);
    const baseId = useId();
    const treeId = `mfm-${baseId}`;
    const [expanded, setExpanded] = useState({});
    const [selectedParentId, setSelectedParentId] = useState(null);
    const tree = useMemo(() => buildTree(folders), [folders]);
    const visibleItems = useMemo(() => buildVisibleTreeItems(tree, expanded), [tree, expanded]);
    const idToIndex = useMemo(() => indexById(visibleItems), [visibleItems]);
    const rootSelectable = useMemo(() => {
        const w = folderWritableAsMoveDestination(folders, null, permissionContext);
        const v = validateFolderMove(folders, movingFolderId, null) === null;
        return w && v;
    }, [folders, movingFolderId, permissionContext]);
    const isFolderRowSelectable = useCallback((folderId) => {
        if (folderId === movingFolderId)
            return false;
        if (isFolderUnderAncestor(folders, movingFolderId, folderId))
            return false;
        if (!folderWritableAsMoveDestination(folders, folderId, permissionContext))
            return false;
        return validateFolderMove(folders, movingFolderId, folderId) === null;
    }, [folders, movingFolderId, permissionContext]);
    const firstSelectableFolderId = useMemo(() => {
        for (const it of visibleItems) {
            if (isFolderRowSelectable(it.id))
                return it.id;
        }
        return null;
    }, [visibleItems, isFolderRowSelectable]);
    useEffect(() => {
        if (!open)
            return;
        queueMicrotask(() => {
            const preferred = defaultDestinationParentId;
            const canUsePreferred = preferred === null
                ? rootSelectable
                : isFolderRowSelectable(preferred);
            const initial = canUsePreferred
                ? preferred
                : rootSelectable
                    ? null
                    : (firstSelectableFolderId !== null && firstSelectableFolderId !== void 0 ? firstSelectableFolderId : null);
            setSelectedParentId(initial);
            const nextExp = {};
            if (initial) {
                let cur = folders.find((f) => f.id === initial);
                while (cur === null || cur === void 0 ? void 0 : cur.parentId) {
                    nextExp[cur.parentId] = true;
                    cur = folders.find((f) => f.id === cur.parentId);
                }
            }
            setExpanded((prev) => (Object.assign(Object.assign({}, prev), nextExp)));
        });
    }, [
        open,
        defaultDestinationParentId,
        folders,
        rootSelectable,
        firstSelectableFolderId,
        isFolderRowSelectable,
    ]);
    const toggle = useCallback((id, depth) => {
        setExpanded((prev) => {
            const cur = getEffectiveExpanded(id, depth, prev);
            return Object.assign(Object.assign({}, prev), { [id]: !cur });
        });
    }, []);
    useLayoutEffect(() => {
        if (!open)
            return;
        queueMicrotask(() => { var _a; return (_a = dialogRef.current) === null || _a === void 0 ? void 0 : _a.focus(); });
    }, [open]);
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
                return;
            }
            if (e.key !== "Tab")
                return;
            const root = dialogRef.current;
            if (!root)
                return;
            const focusables = root.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
            const els = [...focusables].filter((el) => el.offsetParent !== null || el === root);
            if (els.length === 0)
                return;
            const first = els[0];
            const last = els[els.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                last.focus();
                e.preventDefault();
            }
            else if (!e.shiftKey && document.activeElement === last) {
                first.focus();
                e.preventDefault();
            }
        };
        document.addEventListener("keydown", onKey, true);
        return () => document.removeEventListener("keydown", onKey, true);
    }, [open, onClose]);
    const onModalKeyDown = (e) => {
        var _a;
        if (e.target !== dialogRef.current && !((_a = dialogRef.current) === null || _a === void 0 ? void 0 : _a.contains(e.target))) {
            return;
        }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            const flat = [];
            if (rootSelectable)
                flat.push({ kind: "root", id: null });
            for (const it of visibleItems)
                flat.push({ kind: "folder", id: it.id });
            const curIdx = flat.findIndex((x) => x.kind === "root" ? selectedParentId === null : x.id === selectedParentId);
            const delta = e.key === "ArrowDown" ? 1 : -1;
            let idx = curIdx < 0 ? 0 : curIdx;
            for (let step = 0; step < flat.length + 1; step++) {
                idx = (idx + delta + flat.length) % flat.length;
                const item = flat[idx];
                if (item.kind === "root" && rootSelectable) {
                    e.preventDefault();
                    setSelectedParentId(null);
                    return;
                }
                if (item.kind === "folder" && item.id && isFolderRowSelectable(item.id)) {
                    e.preventDefault();
                    setSelectedParentId(item.id);
                    return;
                }
            }
        }
        if (e.key === "ArrowRight") {
            const idx = selectedParentId
                ? idToIndex.get(selectedParentId)
                : undefined;
            if (idx === undefined && selectedParentId)
                return;
            const item = idx !== undefined ? visibleItems[idx] : null;
            const id = selectedParentId;
            if (!id || !(item === null || item === void 0 ? void 0 : item.hasChildren))
                return;
            if (!item.isExpanded) {
                e.preventDefault();
                toggle(id, item.depth);
            }
        }
        if (e.key === "ArrowLeft") {
            const idx = selectedParentId ? idToIndex.get(selectedParentId) : undefined;
            if (idx === undefined && selectedParentId)
                return;
            const item = idx !== undefined ? visibleItems[idx] : null;
            const id = selectedParentId;
            if (!id || !item)
                return;
            if (item.hasChildren && item.isExpanded) {
                e.preventDefault();
                toggle(id, item.depth);
            }
            else if (item.parentId) {
                e.preventDefault();
                setSelectedParentId(item.parentId);
            }
        }
        if (e.key === "Enter") {
            const err = selectedParentId === null
                ? validateFolderMove(folders, movingFolderId, null)
                : selectedParentId
                    ? validateFolderMove(folders, movingFolderId, selectedParentId)
                    : "Select a destination";
            if (err)
                return;
            e.preventDefault();
            onConfirm(selectedParentId);
        }
    };
    const confirmDisabled = selectedParentId === null
        ? !rootSelectable || validateFolderMove(folders, movingFolderId, null) !== null
        : !selectedParentId ||
            !isFolderRowSelectable(selectedParentId) ||
            validateFolderMove(folders, movingFolderId, selectedParentId) !== null;
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4", role: "presentation", onMouseDown: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { ref: dialogRef, role: "dialog", "aria-modal": true, "aria-labelledby": `${treeId}-title`, tabIndex: -1, onKeyDown: onModalKeyDown, className: "flex max-h-[85vh] w-full max-w-md flex-col rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 shadow-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between gap-2", children: [_jsx("h2", { id: `${treeId}-title`, className: "text-base font-semibold text-[var(--z-fg)]", children: "Move folder" }), _jsx("button", { type: "button", onClick: onClose, className: "rounded p-1 text-[var(--z-muted)] hover:bg-white/[0.05]", "aria-label": "Close", children: "\u2715" })] }), _jsx("p", { className: "mb-2 text-xs leading-snug text-[var(--z-muted)]", children: "Choose a destination folder. Only locations you can write to are available. Press Escape to cancel." }), _jsx("div", { className: "min-h-0 flex-1 overflow-y-auto rounded border border-[var(--z-border)] p-2", children: _jsxs("div", { role: "tree", "aria-label": "Folder destinations", className: "space-y-0.5", children: [_jsx("div", { role: "treeitem", "aria-level": 1, "aria-selected": selectedParentId === null, className: `rounded px-2 py-2 text-sm outline-none focus-within:ring-2 focus-within:ring-[var(--z-accent)] ${selectedParentId === null
                                    ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_82%)] text-[var(--z-accent)] ring-1 ring-[var(--z-accent)]/35"
                                    : rootSelectable
                                        ? "text-[var(--z-fg)]/90 hover:bg-white/[0.04]"
                                        : "cursor-not-allowed text-[var(--z-fg)]/35"}`, children: _jsx("button", { type: "button", disabled: !rootSelectable, onClick: () => rootSelectable && setSelectedParentId(null), className: "w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] disabled:pointer-events-none", children: "Root (top level)" }) }), tree.map((n) => (_jsx(PickerRow, { node: n, depth: 0, expanded: expanded, onToggle: toggle, movingFolderId: movingFolderId, folders: folders, selectedParentId: selectedParentId, onSelectParent: setSelectedParentId, permissionContext: permissionContext }, n.id)))] }) }), _jsxs("div", { className: "mt-3 flex justify-end gap-2 border-t border-[var(--z-border)] pt-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "rounded-md border border-[var(--z-border)] px-3 py-1.5 text-sm text-[var(--z-fg)] hover:bg-white/[0.04]", children: "Cancel" }), _jsx("button", { type: "button", disabled: confirmDisabled, onClick: () => onConfirm(selectedParentId), className: "rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-sm font-semibold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40", children: "Move here" })] })] }) }));
}
