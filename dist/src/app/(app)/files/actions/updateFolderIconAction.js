"use server";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { buildContextFromSession, updateFolder } from "@/lib/files/service";
export async function updateFolderIconAction(id, icon) {
    var _a;
    try {
        const session = await requirePermission("files.write")();
        const tenantId = ((_a = session.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
        await assertTenantAccess(tenantId);
        const ctx = buildContextFromSession({
            role: session.role,
            userId: session.userId,
            tenantId,
        });
        const folder = await updateFolder(id, tenantId, {
            metadata: { icon },
        }, ctx);
        return { ok: true, data: folder };
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, error: msg };
    }
}
