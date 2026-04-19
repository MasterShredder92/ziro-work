"use server";

import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { buildContextFromSession, updateFolder } from "@/lib/files/service";
import type { FileFolder } from "@/lib/files/types";

export type UpdateFolderColorActionResult =
  | { ok: true; data: FileFolder }
  | { ok: false; error: string };

export async function updateFolderColorAction(
  id: string,
  colorTag: string | null,
): Promise<UpdateFolderColorActionResult> {
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
      id,
      tenantId,
      {
        metadata: { colorTag },
      },
      ctx,
    );
    return { ok: true, data: folder };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
