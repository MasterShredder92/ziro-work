import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import {
  listContentFolders as listContentFoldersData,
  getContentFolder as getContentFolderData,
  upsertContentFolder,
  deleteContentFolder as deleteContentFolderData,
  type ContentFolderRow,
} from "@data/contentFolders";
import {
  getContentItem as getContentItemData,
  upsertContentItem,
  type ContentItemRow,
} from "@data/contentItems";

export type ContentFolder = ContentFolderRow;

export async function listFolders(
  tenantId: string,
): Promise<ContentFolderRow[]> {
  await assertTenantAccess(tenantId);
  return listContentFoldersData(tenantId);
}

export async function getFolder(
  folderId: string,
  tenantId: string,
): Promise<ContentFolderRow | null> {
  await assertTenantAccess(tenantId);
  return getContentFolderData(folderId, tenantId);
}

export async function createFolder(
  tenantId: string,
  input: Partial<ContentFolderRow> & { name: string },
): Promise<ContentFolderRow> {
  await assertTenantAccess(tenantId);
  return upsertContentFolder(tenantId, input);
}

export async function updateFolder(
  folderId: string,
  tenantId: string,
  patch: Partial<ContentFolderRow>,
): Promise<ContentFolderRow> {
  await assertTenantAccess(tenantId);
  const existing = await getContentFolderData(folderId, tenantId);
  if (!existing) throw new Error("NOT_FOUND");
  return upsertContentFolder(tenantId, {
    ...existing,
    ...patch,
    id: folderId,
    name: patch.name ?? existing.name,
  });
}

export async function deleteFolder(
  folderId: string,
  tenantId: string,
): Promise<void> {
  await assertTenantAccess(tenantId);
  await deleteContentFolderData(folderId, tenantId);
}

export async function moveItem(
  itemId: string,
  folderId: string | null,
  tenantId: string,
): Promise<ContentItemRow> {
  await assertTenantAccess(tenantId);
  const item = await getContentItemData(itemId, tenantId);
  if (!item) throw new Error("NOT_FOUND");
  return upsertContentItem(tenantId, {
    ...item,
    id: itemId,
    folder_id: folderId,
  });
}

export async function reorderFolder(
  folderId: string,
  tenantId: string,
  sortOrder: number,
): Promise<ContentFolderRow> {
  await assertTenantAccess(tenantId);
  const existing = await getContentFolderData(folderId, tenantId);
  if (!existing) throw new Error("NOT_FOUND");
  return upsertContentFolder(tenantId, {
    ...existing,
    id: folderId,
    sort_order: sortOrder,
  });
}
