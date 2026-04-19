import { hasPermission } from "@/lib/auth/permissions";
import type { Role } from "@/lib/auth/roles";
import { computeFolderAccessPermissions } from "@/lib/files/permissionsEngine";
import type { FileFolder, FilePermissionContext } from "@/lib/files/types";

/** Walk ancestors of `nodeId`; returns true if `ancestorId` is reached (i.e. `nodeId` is under `ancestorId`). */
export function isFolderUnderAncestor(
  folders: readonly FileFolder[],
  ancestorId: string,
  nodeId: string,
): boolean {
  let walk: string | null = nodeId;
  const guard = new Set<string>();
  while (walk) {
    if (walk === ancestorId) return true;
    if (guard.has(walk)) break;
    guard.add(walk);
    const f = folders.find((x) => x.id === walk);
    walk = f?.parentId ?? null;
  }
  return false;
}

export function folderNameConflictInParent(
  folders: readonly FileFolder[],
  folderId: string,
  newParentId: string | null,
  name: string,
): boolean {
  const lower = name.toLowerCase();
  return folders.some(
    (f) =>
      f.id !== folderId &&
      (f.parentId ?? null) === (newParentId ?? null) &&
      f.name.toLowerCase() === lower,
  );
}

export function validateFolderMove(
  folders: readonly FileFolder[],
  folderId: string,
  newParentId: string | null,
): string | null {
  if (newParentId === folderId) return "Cannot move a folder into itself";
  if (newParentId && isFolderUnderAncestor(folders, folderId, newParentId)) {
    return "Cannot move a folder into its own subfolder";
  }
  const row = folders.find((f) => f.id === folderId);
  if (!row) return "Folder not found";
  if (folderNameConflictInParent(folders, folderId, newParentId, row.name)) {
    return "A folder with this name already exists in the destination";
  }
  return null;
}

function computePathForId(
  byId: Map<string, FileFolder>,
  id: string,
  memo: Map<string, string>,
  stack: Set<string>,
): string {
  if (memo.has(id)) return memo.get(id)!;
  if (stack.has(id)) return byId.get(id)?.name ?? "";
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
export function applyOptimisticFolderParent(
  folders: readonly FileFolder[],
  folderId: string,
  newParentId: string | null,
): FileFolder[] {
  const list = folders.map((f) => ({ ...f }));
  const moved = list.find((f) => f.id === folderId);
  if (!moved) return list;
  moved.parentId = newParentId;
  const byId = new Map(list.map((f) => [f.id, f]));
  const memo = new Map<string, string>();
  for (const f of list) {
    f.path = computePathForId(byId, f.id, memo, new Set());
  }
  return list;
}

export function folderWritableAsMoveDestination(
  folders: readonly FileFolder[],
  folderId: string | null,
  ctx: FilePermissionContext | null,
): boolean {
  if (!ctx) return true;
  const role = ctx.role as Role;
  if (folderId === null) {
    return hasPermission(role, "files.write");
  }
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return false;
  const parent = folder.parentId
    ? (folders.find((f) => f.id === folder.parentId) ?? null)
    : null;
  return computeFolderAccessPermissions({ folder, parent, context: ctx }).canWrite;
}
