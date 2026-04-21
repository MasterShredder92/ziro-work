"use server";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { buildContextFromSession, updateFolder } from "@/lib/files/service";
/** Core rename using the Files service (`updateFolder`). */
export async function renameFolder(folderId, name) {
    var _a;
    const trimmed = name.trim();
    if (!trimmed) {
        return { ok: false, error: "Folder name is required" };
    }
    try {
        const session = await requirePermission("files.write")();
        const tenantId = ((_a = session.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
        await assertTenantAccess(tenantId);
        const ctx = buildContextFromSession({
            role: session.role,
            userId: session.userId,
            tenantId,
        });
        const folder = await updateFolder(folderId, tenantId, { name: trimmed }, ctx);
        return { ok: true, data: folder };
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, error: msg };
    }
}
/** Server action entry for client components. */
export async function renameFolderAction(folderId, name) {
    return renameFolder(folderId, name);
}
