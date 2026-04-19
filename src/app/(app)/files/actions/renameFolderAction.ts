"use server";

import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { buildContextFromSession, updateFolder } from "@/lib/files/service";
import type { FileFolder } from "@/lib/files/types";

export type RenameFolderActionResult =
  | { ok: true; data: FileFolder }
  | { ok: false; error: string };

/** Core rename using the Files service (`updateFolder`). */
export async function renameFolder(
  folderId: string,
  name: string,
): Promise<RenameFolderActionResult> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Folder name is required" };
  }
  try {
    const session = await requirePermission("files.write")();
    const tenantId = session.tenantId?.trim() || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    const ctx = buildContextFromSession({
      role: session.role,
      userId: session.userId,
      tenantId,
    });
    const folder = await updateFolder(folderId, tenantId, { name: trimmed }, ctx);
    return { ok: true, data: folder };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Server action entry for client components. */
export async function renameFolderAction(
  folderId: string,
  name: string,
): Promise<RenameFolderActionResult> {
  return renameFolder(folderId, name);
}
