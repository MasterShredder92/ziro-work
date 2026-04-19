import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import {
  listContentVersions as listContentVersionsData,
  getContentVersion as getContentVersionData,
  upsertContentVersion,
  markVersionCurrent as markVersionCurrentData,
  type ContentVersionRow,
} from "@data/contentVersions";
import {
  getContentItem as getContentItemData,
  upsertContentItem,
  type ContentItemRow,
} from "@data/contentItems";

export type ContentVersion = ContentVersionRow;

export async function listVersions(
  itemId: string,
  tenantId: string,
): Promise<ContentVersionRow[]> {
  await assertTenantAccess(tenantId);
  return listContentVersionsData(itemId, tenantId);
}

export async function getVersion(
  versionId: string,
  tenantId: string,
): Promise<ContentVersionRow | null> {
  await assertTenantAccess(tenantId);
  return getContentVersionData(versionId, tenantId);
}

export async function createVersion(
  itemId: string,
  tenantId: string,
  options?: { changeSummary?: string | null; createdBy?: string | null },
): Promise<ContentVersionRow> {
  await assertTenantAccess(tenantId);
  const item = await getContentItemData(itemId, tenantId);
  if (!item) throw new Error("NOT_FOUND");

  const existingVersions = await listContentVersionsData(itemId, tenantId);
  const nextNumber =
    existingVersions.reduce((max, v) => Math.max(max, v.version), 0) + 1;

  const created = await upsertContentVersion(tenantId, {
    item_id: itemId,
    version: nextNumber,
    title: item.title,
    body: item.body,
    excerpt: item.excerpt,
    content_type: item.content_type,
    change_summary: options?.changeSummary ?? null,
    is_current: true,
    metadata: item.metadata,
    created_by: options?.createdBy ?? item.updated_by ?? null,
  });

  await markVersionCurrentData(itemId, created.id, tenantId);

  await upsertContentItem(tenantId, {
    ...item,
    id: itemId,
    current_version: nextNumber,
  });

  return created;
}

export async function restoreVersion(
  itemId: string,
  versionId: string,
  tenantId: string,
  options?: { createdBy?: string | null },
): Promise<{ item: ContentItemRow; version: ContentVersionRow }> {
  await assertTenantAccess(tenantId);
  const [item, version] = await Promise.all([
    getContentItemData(itemId, tenantId),
    getContentVersionData(versionId, tenantId),
  ]);
  if (!item) throw new Error("ITEM_NOT_FOUND");
  if (!version || version.item_id !== itemId) {
    throw new Error("VERSION_NOT_FOUND");
  }

  const restoredItem = await upsertContentItem(tenantId, {
    ...item,
    id: itemId,
    title: version.title,
    body: version.body,
    excerpt: version.excerpt,
    content_type: version.content_type,
    metadata: version.metadata,
    updated_by: options?.createdBy ?? item.updated_by ?? null,
  });

  const newVersion = await createVersion(itemId, tenantId, {
    changeSummary: `Restored from version ${version.version}`,
    createdBy: options?.createdBy ?? null,
  });

  return { item: restoredItem, version: newVersion };
}
