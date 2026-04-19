"use server";

import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { buildContextFromSession, updateFolder } from "@/lib/files/service";
import type { FileFolder } from "@/lib/files/types";

export type MoveFolderActionResult =
  | { ok: true; data: FileFolder }
  | { ok: false; error: string };

export async function moveFolderAction(
  folderId: string,
  opts: { parentId: string | null },
): Promise<MoveFolderActionResult> {
  try {
    const session = await requirePermission("files.write")();
    const tenantId = session.tenantId?.trim() || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    const ctx = buildContextFromSession({
      role: session.role,
      userId: session.userId,
      tenantId,
    });
    const folder = await updateFolder(
      folderId,
      tenantId,
      { parentId: opts.parentId },
      ctx,
    );
    return { ok: true, data: folder };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
