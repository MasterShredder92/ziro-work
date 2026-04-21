import "server-only";
import { deleteFeatureFlag as dbDeleteFeatureFlag, getFeatureFlag, getFeatureFlagByKey, listFeatureFlags, upsertFeatureFlag, } from "@data/featureFlags";
import { assertTenantAccess } from "@/lib/auth/guards";
import { recordAudit, diffObjects } from "./audit";
export async function listFlags(tenantId) {
    await assertTenantAccess(tenantId);
    return listFeatureFlags(tenantId);
}
export async function getFlag(tenantId, id) {
    await assertTenantAccess(tenantId);
    return getFeatureFlag(id, tenantId);
}
export async function setFlag(tenantId, input) {
    var _a, _b, _c;
    const session = await assertTenantAccess(tenantId);
    const key = input.key.trim();
    if (!key)
        throw new Error("flag.key required");
    const existing = (_a = (input.id ? await getFeatureFlag(input.id, tenantId) : null)) !== null && _a !== void 0 ? _a : (await getFeatureFlagByKey(key, tenantId));
    const updated = await upsertFeatureFlag(tenantId, Object.assign(Object.assign({}, input), { id: (_b = existing === null || existing === void 0 ? void 0 : existing.id) !== null && _b !== void 0 ? _b : input.id, created_by: (_c = existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _c !== void 0 ? _c : session.userId, updated_by: session.userId }));
    await recordAudit({
        tenantId,
        event: existing ? "admin.feature_flag.updated" : "admin.feature_flag.created",
        category: "admin",
        targetType: "feature_flag",
        targetId: updated.id,
        before: (existing !== null && existing !== void 0 ? existing : null),
        after: updated,
        payload: {
            diff: existing
                ? diffObjects(existing, updated)
                : null,
        },
    });
    return updated;
}
export async function toggleFlag(tenantId, id, enabled) {
    const existing = await getFlag(tenantId, id);
    if (!existing)
        throw new Error("flag.not_found");
    return setFlag(tenantId, {
        id: existing.id,
        key: existing.key,
        enabled,
    });
}
export async function removeFlag(tenantId, id) {
    await assertTenantAccess(tenantId);
    const existing = await getFeatureFlag(id, tenantId);
    if (!existing)
        return;
    await dbDeleteFeatureFlag(id, tenantId);
    await recordAudit({
        tenantId,
        event: "admin.feature_flag.deleted",
        category: "admin",
        targetType: "feature_flag",
        targetId: id,
        before: existing,
    });
}
export function isFlagEnabledForRole(flag, role) {
    if (!flag.enabled)
        return false;
    if (flag.target_roles.length === 0)
        return true;
    if (!role)
        return false;
    return flag.target_roles.includes(role);
}
