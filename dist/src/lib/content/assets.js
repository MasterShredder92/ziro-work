import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { listContentAssets as listContentAssetsData, getContentAsset as getContentAssetData, upsertContentAsset, deleteContentAsset as deleteContentAssetData, } from "@data/contentAssets";
import { getContentItem as getContentItemData, upsertContentItem, } from "@data/contentItems";
export async function listAssets(tenantId, filter) {
    await assertTenantAccess(tenantId);
    return listContentAssetsData(tenantId, filter);
}
export async function getAsset(assetId, tenantId) {
    await assertTenantAccess(tenantId);
    return getContentAssetData(assetId, tenantId);
}
export async function uploadAsset(tenantId, input) {
    await assertTenantAccess(tenantId);
    const asset = await upsertContentAsset(tenantId, input);
    // If asset is attached to an item, mirror it into the item's asset_ids for
    // quick server-side rendering.
    if (asset.item_id) {
        const item = await getContentItemData(asset.item_id, tenantId);
        if (item && !item.asset_ids.includes(asset.id)) {
            await upsertContentItem(tenantId, Object.assign(Object.assign({}, item), { id: item.id, asset_ids: [...item.asset_ids, asset.id] }));
        }
    }
    return asset;
}
export async function updateAsset(assetId, tenantId, patch) {
    var _a, _b;
    await assertTenantAccess(tenantId);
    const existing = await getContentAssetData(assetId, tenantId);
    if (!existing)
        throw new Error("NOT_FOUND");
    return upsertContentAsset(tenantId, Object.assign(Object.assign(Object.assign({}, existing), patch), { id: assetId, name: (_a = patch.name) !== null && _a !== void 0 ? _a : existing.name, url: (_b = patch.url) !== null && _b !== void 0 ? _b : existing.url }));
}
export async function deleteAsset(assetId, tenantId) {
    await assertTenantAccess(tenantId);
    const asset = await getContentAssetData(assetId, tenantId);
    if (!asset)
        return;
    await deleteContentAssetData(assetId, tenantId);
    if (asset.item_id) {
        const item = await getContentItemData(asset.item_id, tenantId);
        if (item && item.asset_ids.includes(assetId)) {
            await upsertContentItem(tenantId, Object.assign(Object.assign({}, item), { id: item.id, asset_ids: item.asset_ids.filter((id) => id !== assetId) }));
        }
    }
}
