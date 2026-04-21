import "server-only";
import { listContentItems as listContentItemsData, getContentItem as getContentItemData, upsertContentItem, deleteContentItem as deleteContentItemData, } from "@data/contentItems";
import { listContentTags as listContentTagsData, upsertContentTag, } from "@data/contentTags";
import { listContentCollections as listContentCollectionsData, getContentCollection as getContentCollectionData, upsertContentCollection, } from "@data/contentCollections";
import { upsertContentEmbedding, getContentEmbedding as getContentEmbeddingData, } from "@data/contentEmbeddings";
export async function listContentItems(tenantId, filters) {
    return listContentItemsData(tenantId, filters);
}
export async function getContentItem(itemId, tenantId) {
    return getContentItemData(itemId, tenantId);
}
export async function listTags(tenantId) {
    return listContentTagsData(tenantId);
}
export async function listCollections(tenantId) {
    return listContentCollectionsData(tenantId);
}
export async function getCollection(collectionId, tenantId) {
    return getContentCollectionData(collectionId, tenantId);
}
export async function createContentItem(data) {
    return upsertContentItem(data.tenant_id, data);
}
export async function updateContentItem(itemId, data) {
    return upsertContentItem(data.tenant_id, Object.assign(Object.assign({}, data), { id: itemId }));
}
export async function deleteContentItem(itemId, tenantId) {
    await deleteContentItemData(itemId, tenantId);
}
export async function addTagToItem(itemId, tag, tenantId) {
    const current = await getContentItemData(itemId, tenantId);
    if (!current)
        throw new Error("NOT_FOUND");
    if (current.tags.includes(tag))
        return current;
    return upsertContentItem(current.tenant_id, Object.assign(Object.assign({}, current), { tags: [...current.tags, tag] }));
}
export async function removeTagFromItem(itemId, tag, tenantId) {
    const current = await getContentItemData(itemId, tenantId);
    if (!current)
        throw new Error("NOT_FOUND");
    if (!current.tags.includes(tag))
        return current;
    return upsertContentItem(current.tenant_id, Object.assign(Object.assign({}, current), { tags: current.tags.filter((t) => t !== tag) }));
}
export async function addItemToCollection(itemId, collectionId, tenantId) {
    const item = await getContentItemData(itemId, tenantId);
    if (!item)
        throw new Error("ITEM_NOT_FOUND");
    const collection = await getContentCollectionData(collectionId, tenantId);
    if (!collection)
        throw new Error("COLLECTION_NOT_FOUND");
    const nextCollectionIds = item.collection_ids.includes(collectionId)
        ? item.collection_ids
        : [...item.collection_ids, collectionId];
    const nextItemIds = collection.item_ids.includes(itemId)
        ? collection.item_ids
        : [...collection.item_ids, itemId];
    const [updatedItem, updatedCollection] = await Promise.all([
        upsertContentItem(item.tenant_id, Object.assign(Object.assign({}, item), { collection_ids: nextCollectionIds })),
        upsertContentCollection(collection.tenant_id, Object.assign(Object.assign({}, collection), { item_ids: nextItemIds })),
    ]);
    return { item: updatedItem, collection: updatedCollection };
}
export async function removeItemFromCollection(itemId, collectionId, tenantId) {
    const item = await getContentItemData(itemId, tenantId);
    if (!item)
        throw new Error("ITEM_NOT_FOUND");
    const collection = await getContentCollectionData(collectionId, tenantId);
    if (!collection)
        throw new Error("COLLECTION_NOT_FOUND");
    const [updatedItem, updatedCollection] = await Promise.all([
        upsertContentItem(item.tenant_id, Object.assign(Object.assign({}, item), { collection_ids: item.collection_ids.filter((c) => c !== collectionId) })),
        upsertContentCollection(collection.tenant_id, Object.assign(Object.assign({}, collection), { item_ids: collection.item_ids.filter((i) => i !== itemId) })),
    ]);
    return { item: updatedItem, collection: updatedCollection };
}
export async function saveEmbedding(itemId, vector, options) {
    var _a, _b;
    const tenantId = options === null || options === void 0 ? void 0 : options.tenantId;
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
        const item = await getContentItemData(itemId);
        resolvedTenantId = item === null || item === void 0 ? void 0 : item.tenant_id;
    }
    if (!resolvedTenantId)
        throw new Error("TENANT_REQUIRED");
    return upsertContentEmbedding(resolvedTenantId, {
        item_id: itemId,
        vector,
        dimensions: vector.length,
        model: (_a = options === null || options === void 0 ? void 0 : options.model) !== null && _a !== void 0 ? _a : "text-embedding-3-small",
        content_hash: (_b = options === null || options === void 0 ? void 0 : options.contentHash) !== null && _b !== void 0 ? _b : null,
    });
}
export async function getEmbedding(itemId, tenantId) {
    return getContentEmbeddingData(itemId, tenantId);
}
export async function createTag(tenantId, input) {
    return upsertContentTag(tenantId, input);
}
export async function createCollection(tenantId, input) {
    return upsertContentCollection(tenantId, input);
}
