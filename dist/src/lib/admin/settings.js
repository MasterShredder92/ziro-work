import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { getTenantSettings, updateTenantSettings, } from "@data/tenantSettings";
import { getTenant, listTenants, upsertTenant, } from "@data/tenants";
import { recordAudit, diffObjects } from "./audit";
export async function getTenantProfile(tenantId) {
    await assertTenantAccess(tenantId);
    return getTenant(tenantId);
}
export async function listAllTenants() {
    return listTenants();
}
export async function updateTenantProfile(tenantId, input) {
    await assertTenantAccess(tenantId);
    const before = await getTenant(tenantId);
    const updated = await upsertTenant(Object.assign(Object.assign({}, input), { id: tenantId }));
    await recordAudit({
        tenantId,
        event: "admin.tenant.updated",
        category: "admin",
        targetType: "tenant",
        targetId: tenantId,
        before: before,
        after: updated,
    });
    return updated;
}
export async function readSettings(tenantId) {
    await assertTenantAccess(tenantId);
    return getTenantSettings(tenantId);
}
export async function writeSettings(tenantId, patch) {
    const session = await assertTenantAccess(tenantId);
    const before = await getTenantSettings(tenantId);
    const updated = await updateTenantSettings(tenantId, Object.assign(Object.assign({}, patch), { updated_by: session.userId }));
    const diff = diffObjects(before, updated);
    await recordAudit({
        tenantId,
        event: "admin.settings.updated",
        category: "admin",
        targetType: "tenant_settings",
        targetId: tenantId,
        before: before,
        after: updated,
        payload: { diff },
    });
    return updated;
}
