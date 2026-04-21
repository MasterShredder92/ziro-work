import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { listContentFolders as listContentFoldersData, getContentFolder as getContentFolderData, upsertContentFolder, deleteContentFolder as deleteContentFolderData, } from "@data/contentFolders";
import { getContentItem as getContentItemData, upsertContentItem, } from "@data/contentItems";
export async function listFolders(tenantId) {
    await assertTenantAccess(tenantId);
    return listContentFoldersData(tenantId);
}
export async function getFolder(folderId, tenantId) {
    await assertTenantAccess(tenantId);
    return getContentFolderData(folderId, tenantId);
}
export async function createFolder(tenantId, input) {
    await assertTenantAccess(tenantId);
    return upsertContentFolder(tenantId, input);
}
export async function updateFolder(folderId, tenantId, patch) {
    var _a;
    await assertTenantAccess(tenantId);
    const existing = await getContentFolderData(folderId, tenantId);
    if (!existing)
        throw new Error("NOT_FOUND");
    return upsertContentFolder(tenantId, Object.assign(Object.assign(Object.assign({}, existing), patch), { id: folderId, name: (_a = patch.name) !== null && _a !== void 0 ? _a : existing.name }));
}
export async function deleteFolder(folderId, tenantId) {
    await assertTenantAccess(tenantId);
    await deleteContentFolderData(folderId, tenantId);
}
export async function moveItem(itemId, folderId, tenantId) {
    await assertTenantAccess(tenantId);
    const item = await getContentItemData(itemId, tenantId);
    if (!item)
        throw new Error("NOT_FOUND");
    return upsertContentItem(tenantId, Object.assign(Object.assign({}, item), { id: itemId, folder_id: folderId }));
}
export async function reorderFolder(folderId, tenantId, sortOrder) {
    await assertTenantAccess(tenantId);
    const existing = await getContentFolderData(folderId, tenantId);
    if (!existing)
        throw new Error("NOT_FOUND");
    return upsertContentFolder(tenantId, Object.assign(Object.assign({}, existing), { id: folderId, sort_order: sortOrder }));
}
