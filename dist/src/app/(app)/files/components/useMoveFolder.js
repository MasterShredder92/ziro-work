import { hasPermission } from "@/lib/auth/permissions";
import { computeFolderAccessPermissions } from "@/lib/files/permissionsEngine";
/** Walk ancestors of `nodeId`; returns true if `ancestorId` is reached (i.e. `nodeId` is under `ancestorId`). */
export function isFolderUnderAncestor(folders, ancestorId, nodeId) {
    var _a;
    let walk = nodeId;
    const guard = new Set();
    while (walk) {
        if (walk === ancestorId)
            return true;
        if (guard.has(walk))
            break;
        guard.add(walk);
        const f = folders.find((x) => x.id === walk);
        walk = (_a = f === null || f === void 0 ? void 0 : f.parentId) !== null && _a !== void 0 ? _a : null;
    }
    return false;
}
export function folderNameConflictInParent(folders, folderId, newParentId, name) {
    const lower = name.toLowerCase();
    return folders.some((f) => {
        var _a;
        return f.id !== folderId &&
            ((_a = f.parentId) !== null && _a !== void 0 ? _a : null) === (newParentId !== null && newParentId !== void 0 ? newParentId : null) &&
            f.name.toLowerCase() === lower;
    });
}
export function validateFolderMove(folders, folderId, newParentId) {
    if (newParentId === folderId)
        return "Cannot move a folder into itself";
    if (newParentId && isFolderUnderAncestor(folders, folderId, newParentId)) {
        return "Cannot move a folder into its own subfolder";
    }
    const row = folders.find((f) => f.id === folderId);
    if (!row)
        return "Folder not found";
    if (folderNameConflictInParent(folders, folderId, newParentId, row.name)) {
        return "A folder with this name already exists in the destination";
    }
    return null;
}
function computePathForId(byId, id, memo, stack) {
    var _a, _b;
    if (memo.has(id))
        return memo.get(id);
    if (stack.has(id))
        return (_b = (_a = byId.get(id)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "";
    stack.add(id);
    const f = byId.get(id);
    if (!f) {
        stack.delete(id);
        return "";
    }
    const p = f.parentId && byId.has(f.parentId) ? f.parentId : null;
    const base = p ? computePathForId(byId, p, memo, stack) : "";
    stack.delete(id);
    const out = base ? `${base}/${f.name}` : f.name;
    memo.set(id, out);
    return out;
}
/** Returns a new list with `folderId` reparented and all `path` values recomputed. */
export function applyOptimisticFolderParent(folders, folderId, newParentId) {
    const list = folders.map((f) => (Object.assign({}, f)));
    const moved = list.find((f) => f.id === folderId);
    if (!moved)
        return list;
    moved.parentId = newParentId;
    const byId = new Map(list.map((f) => [f.id, f]));
    const memo = new Map();
    for (const f of list) {
        f.path = computePathForId(byId, f.id, memo, new Set());
    }
    return list;
}
export function folderWritableAsMoveDestination(folders, folderId, ctx) {
    var _a;
    if (!ctx)
        return true;
    const role = ctx.role;
    if (folderId === null) {
        return hasPermission(role, "files.write");
    }
    const folder = folders.find((f) => f.id === folderId);
    if (!folder)
        return false;
    const parent = folder.parentId
        ? ((_a = folders.find((f) => f.id === folder.parentId)) !== null && _a !== void 0 ? _a : null)
        : null;
    return computeFolderAccessPermissions({ folder, parent, context: ctx }).canWrite;
}
