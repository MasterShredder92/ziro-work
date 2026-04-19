import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import {
  listContentAssets as listContentAssetsData,
  getContentAsset as getContentAssetData,
  upsertContentAsset,
  deleteContentAsset as deleteContentAssetData,
  type ContentAssetFilter,
  type ContentAssetRow,
} from "@data/contentAssets";
import {
  getContentItem as getContentItemData,
  upsertContentItem,
} from "@data/contentItems";

export type ContentAsset = ContentAssetRow;

export async function listAssets(
  tenantId: string,
  filter?: ContentAssetFilter,
): Promise<ContentAssetRow[]> {
  await assertTenantAccess(tenantId);
  return listContentAssetsData(tenantId, filter);
}

export async function getAsset(
  assetId: string,
  tenantId: string,
): Promise<ContentAssetRow | null> {
  await assertTenantAccess(tenantId);
  return getContentAssetData(assetId, tenantId);
}

export async function uploadAsset(
  tenantId: string,
  input: Partial<ContentAssetRow> & { name: string; url: string },
): Promise<ContentAssetRow> {
  await assertTenantAccess(tenantId);
  const asset = await upsertContentAsset(tenantId, input);

  // If asset is attached to an item, mirror it into the item's asset_ids for
  // quick server-side rendering.
  if (asset.item_id) {
    const item = await getContentItemData(asset.item_id, tenantId);
    if (item && !item.asset_ids.includes(asset.id)) {
      await upsertContentItem(tenantId, {
        ...item,
        id: item.id,
        asset_ids: [...item.asset_ids, asset.id],
      });
    }
  }

  return asset;
}

export async function updateAsset(
  assetId: string,
  tenantId: string,
  patch: Partial<ContentAssetRow>,
): Promise<ContentAssetRow> {
  await assertTenantAccess(tenantId);
  const existing = await getContentAssetData(assetId, tenantId);
  if (!existing) throw new Error("NOT_FOUND");
  return upsertContentAsset(tenantId, {
    ...existing,
    ...patch,
    id: assetId,
    name: patch.name ?? existing.name,
    url: patch.url ?? existing.url,
  });
}

export async function deleteAsset(
  assetId: string,
  tenantId: string,
): Promise<void> {
  await assertTenantAccess(tenantId);
  const asset = await getContentAssetData(assetId, tenantId);
  if (!asset) return;
  await deleteContentAssetData(assetId, tenantId);
  if (asset.item_id) {
    const item = await getContentItemData(asset.item_id, tenantId);
    if (item && item.asset_ids.includes(assetId)) {
      await upsertContentItem(tenantId, {
        ...item,
        id: item.id,
        asset_ids: item.asset_ids.filter((id) => id !== assetId),
      });
    }
  }
}
