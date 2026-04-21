import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { listContentVersions as listContentVersionsData, getContentVersion as getContentVersionData, upsertContentVersion, markVersionCurrent as markVersionCurrentData, } from "@data/contentVersions";
import { getContentItem as getContentItemData, upsertContentItem, } from "@data/contentItems";
export async function listVersions(itemId, tenantId) {
    await assertTenantAccess(tenantId);
    return listContentVersionsData(itemId, tenantId);
}
export async function getVersion(versionId, tenantId) {
    await assertTenantAccess(tenantId);
    return getContentVersionData(versionId, tenantId);
}
export async function createVersion(itemId, tenantId, options) {
    var _a, _b, _c;
    await assertTenantAccess(tenantId);
    const item = await getContentItemData(itemId, tenantId);
    if (!item)
        throw new Error("NOT_FOUND");
    const existingVersions = await listContentVersionsData(itemId, tenantId);
    const nextNumber = existingVersions.reduce((max, v) => Math.max(max, v.version), 0) + 1;
    const created = await upsertContentVersion(tenantId, {
        item_id: itemId,
        version: nextNumber,
        title: item.title,
        body: item.body,
        excerpt: item.excerpt,
        content_type: item.content_type,
        change_summary: (_a = options === null || options === void 0 ? void 0 : options.changeSummary) !== null && _a !== void 0 ? _a : null,
        is_current: true,
        metadata: item.metadata,
        created_by: (_c = (_b = options === null || options === void 0 ? void 0 : options.createdBy) !== null && _b !== void 0 ? _b : item.updated_by) !== null && _c !== void 0 ? _c : null,
    });
    await markVersionCurrentData(itemId, created.id, tenantId);
    await upsertContentItem(tenantId, Object.assign(Object.assign({}, item), { id: itemId, current_version: nextNumber }));
    return created;
}
export async function restoreVersion(itemId, versionId, tenantId, options) {
    var _a, _b, _c;
    await assertTenantAccess(tenantId);
    const [item, version] = await Promise.all([
        getContentItemData(itemId, tenantId),
        getContentVersionData(versionId, tenantId),
    ]);
    if (!item)
        throw new Error("ITEM_NOT_FOUND");
    if (!version || version.item_id !== itemId) {
        throw new Error("VERSION_NOT_FOUND");
    }
    const restoredItem = await upsertContentItem(tenantId, Object.assign(Object.assign({}, item), { id: itemId, title: version.title, body: version.body, excerpt: version.excerpt, content_type: version.content_type, metadata: version.metadata, updated_by: (_b = (_a = options === null || options === void 0 ? void 0 : options.createdBy) !== null && _a !== void 0 ? _a : item.updated_by) !== null && _b !== void 0 ? _b : null }));
    const newVersion = await createVersion(itemId, tenantId, {
        changeSummary: `Restored from version ${version.version}`,
        createdBy: (_c = options === null || options === void 0 ? void 0 : options.createdBy) !== null && _c !== void 0 ? _c : null,
    });
    return { item: restoredItem, version: newVersion };
}
