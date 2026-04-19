import "server-only";
import {
  listContentItems as listContentItemsData,
  getContentItem as getContentItemData,
  upsertContentItem,
  deleteContentItem as deleteContentItemData,
  type ContentItemRow,
  type ContentItemFilter,
} from "@data/contentItems";
import {
  listContentTags as listContentTagsData,
  upsertContentTag,
  type ContentTagRow,
} from "@data/contentTags";
import {
  listContentCollections as listContentCollectionsData,
  getContentCollection as getContentCollectionData,
  upsertContentCollection,
  type ContentCollectionRow,
} from "@data/contentCollections";
import {
  upsertContentEmbedding,
  getContentEmbedding as getContentEmbeddingData,
  type ContentEmbeddingRow,
} from "@data/contentEmbeddings";

export async function listContentItems(
  tenantId: string,
  filters?: ContentItemFilter,
): Promise<ContentItemRow[]> {
  return listContentItemsData(tenantId, filters);
}

export async function getContentItem(
  itemId: string,
  tenantId?: string,
): Promise<ContentItemRow | null> {
  return getContentItemData(itemId, tenantId);
}

export async function listTags(tenantId: string): Promise<ContentTagRow[]> {
  return listContentTagsData(tenantId);
}

export async function listCollections(
  tenantId: string,
): Promise<ContentCollectionRow[]> {
  return listContentCollectionsData(tenantId);
}

export async function getCollection(
  collectionId: string,
  tenantId?: string,
): Promise<ContentCollectionRow | null> {
  return getContentCollectionData(collectionId, tenantId);
}

export async function createContentItem(
  data: Partial<ContentItemRow> & { tenant_id: string; title: string },
): Promise<ContentItemRow> {
  return upsertContentItem(data.tenant_id, data);
}

export async function updateContentItem(
  itemId: string,
  data: Partial<ContentItemRow> & { tenant_id: string },
): Promise<ContentItemRow> {
  return upsertContentItem(data.tenant_id, { ...data, id: itemId });
}

export async function deleteContentItem(
  itemId: string,
  tenantId?: string,
): Promise<void> {
  await deleteContentItemData(itemId, tenantId);
}

export async function addTagToItem(
  itemId: string,
  tag: string,
  tenantId?: string,
): Promise<ContentItemRow> {
  const current = await getContentItemData(itemId, tenantId);
  if (!current) throw new Error("NOT_FOUND");
  if (current.tags.includes(tag)) return current;
  return upsertContentItem(current.tenant_id, {
    ...current,
    tags: [...current.tags, tag],
  });
}

export async function removeTagFromItem(
  itemId: string,
  tag: string,
  tenantId?: string,
): Promise<ContentItemRow> {
  const current = await getContentItemData(itemId, tenantId);
  if (!current) throw new Error("NOT_FOUND");
  if (!current.tags.includes(tag)) return current;
  return upsertContentItem(current.tenant_id, {
    ...current,
    tags: current.tags.filter((t) => t !== tag),
  });
}

export async function addItemToCollection(
  itemId: string,
  collectionId: string,
  tenantId?: string,
): Promise<{ item: ContentItemRow; collection: ContentCollectionRow }> {
  const item = await getContentItemData(itemId, tenantId);
  if (!item) throw new Error("ITEM_NOT_FOUND");
  const collection = await getContentCollectionData(collectionId, tenantId);
  if (!collection) throw new Error("COLLECTION_NOT_FOUND");

  const nextCollectionIds = item.collection_ids.includes(collectionId)
    ? item.collection_ids
    : [...item.collection_ids, collectionId];
  const nextItemIds = collection.item_ids.includes(itemId)
    ? collection.item_ids
    : [...collection.item_ids, itemId];

  const [updatedItem, updatedCollection] = await Promise.all([
    upsertContentItem(item.tenant_id, {
      ...item,
      collection_ids: nextCollectionIds,
    }),
    upsertContentCollection(collection.tenant_id, {
      ...collection,
      item_ids: nextItemIds,
    }),
  ]);

  return { item: updatedItem, collection: updatedCollection };
}

export async function removeItemFromCollection(
  itemId: string,
  collectionId: string,
  tenantId?: string,
): Promise<{ item: ContentItemRow; collection: ContentCollectionRow }> {
  const item = await getContentItemData(itemId, tenantId);
  if (!item) throw new Error("ITEM_NOT_FOUND");
  const collection = await getContentCollectionData(collectionId, tenantId);
  if (!collection) throw new Error("COLLECTION_NOT_FOUND");

  const [updatedItem, updatedCollection] = await Promise.all([
    upsertContentItem(item.tenant_id, {
      ...item,
      collection_ids: item.collection_ids.filter((c) => c !== collectionId),
    }),
    upsertContentCollection(collection.tenant_id, {
      ...collection,
      item_ids: collection.item_ids.filter((i) => i !== itemId),
    }),
  ]);

  return { item: updatedItem, collection: updatedCollection };
}

export async function saveEmbedding(
  itemId: string,
  vector: number[],
  options?: { tenantId?: string; model?: string; contentHash?: string | null },
): Promise<ContentEmbeddingRow> {
  const tenantId = options?.tenantId;
  let resolvedTenantId = tenantId;
  if (!resolvedTenantId) {
    const item = await getContentItemData(itemId);
    resolvedTenantId = item?.tenant_id;
  }
  if (!resolvedTenantId) throw new Error("TENANT_REQUIRED");

  return upsertContentEmbedding(resolvedTenantId, {
    item_id: itemId,
    vector,
    dimensions: vector.length,
    model: options?.model ?? "text-embedding-3-small",
    content_hash: options?.contentHash ?? null,
  });
}

export async function getEmbedding(
  itemId: string,
  tenantId?: string,
): Promise<ContentEmbeddingRow | null> {
  return getContentEmbeddingData(itemId, tenantId);
}

export async function createTag(
  tenantId: string,
  input: { label: string; slug?: string; color?: string | null },
): Promise<ContentTagRow> {
  return upsertContentTag(tenantId, input);
}

export async function createCollection(
  tenantId: string,
  input: Partial<ContentCollectionRow> & { title: string },
): Promise<ContentCollectionRow> {
  return upsertContentCollection(tenantId, input);
}
