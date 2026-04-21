import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { listContentEmbeddings } from "@data/contentEmbeddings";
import { addItemToCollection as addItemToCollectionQuery, addTagToItem as addTagToItemQuery, createCollection, createContentItem, createTag, getCollection, getContentItem, getEmbedding, listCollections, listContentItems, listTags, removeItemFromCollection as removeItemFromCollectionQuery, removeTagFromItem as removeTagFromItemQuery, saveEmbedding, updateContentItem, } from "./queries";
const KIND_KEYS = [
    "file",
    "document",
    "video",
    "audio",
    "image",
    "link",
    "note",
];
function emptyKindCounts() {
    return {
        file: 0,
        document: 0,
        video: 0,
        audio: 0,
        image: 0,
        link: 0,
        note: 0,
    };
}
function computeKpis(items, tags, collections, itemsWithEmbeddings) {
    var _a, _b;
    const itemsByKind = emptyKindCounts();
    const tagUsage = new Map();
    for (const item of items) {
        itemsByKind[item.kind] = ((_a = itemsByKind[item.kind]) !== null && _a !== void 0 ? _a : 0) + 1;
        for (const tag of item.tags) {
            tagUsage.set(tag, ((_b = tagUsage.get(tag)) !== null && _b !== void 0 ? _b : 0) + 1);
        }
    }
    const tagBySlug = new Map(tags.map((t) => [t.slug, t]));
    const mostUsedTags = Array.from(tagUsage.entries())
        .map(([slug, usageCount]) => {
        var _a;
        const tag = tagBySlug.get(slug);
        return {
            slug,
            label: (_a = tag === null || tag === void 0 ? void 0 : tag.label) !== null && _a !== void 0 ? _a : slug,
            usageCount,
        };
    })
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 8);
    const mostAccessedItems = [...items]
        .sort((a, b) => b.access_count - a.access_count)
        .slice(0, 8)
        .map((item) => ({
        id: item.id,
        title: item.title,
        kind: item.kind,
        accessCount: item.access_count,
    }));
    const total = items.length;
    const embeddingCoveragePct = total > 0 ? Math.round((itemsWithEmbeddings / total) * 100) : 0;
    return {
        totalItems: total,
        itemsByKind,
        totalTags: tags.length,
        totalCollections: collections.length,
        mostUsedTags,
        mostAccessedItems,
        embeddingCoveragePct,
        itemsWithEmbeddings,
    };
}
function toContentFile(item) {
    if (!item.file_url && !item.source_url)
        return null;
    return {
        itemId: item.id,
        fileUrl: item.file_url,
        fileName: item.file_name,
        mimeType: item.mime_type,
        sizeBytes: item.file_size_bytes,
        thumbnailUrl: item.thumbnail_url,
        sourceUrl: item.source_url,
    };
}
function inferKindFromMime(mime, fallback = "file") {
    if (!mime)
        return fallback;
    const m = mime.toLowerCase();
    if (m.startsWith("image/"))
        return "image";
    if (m.startsWith("video/"))
        return "video";
    if (m.startsWith("audio/"))
        return "audio";
    if (m === "application/pdf" || m.startsWith("text/"))
        return "document";
    return fallback;
}
export async function getContentDashboard(tenantId) {
    await assertTenantAccess(tenantId);
    const [items, tags, collections, embeddings] = await Promise.all([
        listContentItems(tenantId),
        listTags(tenantId),
        listCollections(tenantId),
        listContentEmbeddings(tenantId),
    ]);
    const itemsWithEmbeddings = new Set(embeddings.map((e) => e.item_id)).size;
    const kpis = computeKpis(items, tags, collections, itemsWithEmbeddings);
    return {
        tenantId,
        generatedAt: new Date().toISOString(),
        items,
        tags,
        collections,
        kpis,
    };
}
export async function getContentSurface(itemId, tenantId) {
    const item = await getContentItem(itemId, tenantId);
    if (!item)
        return null;
    const resolvedTenantId = tenantId !== null && tenantId !== void 0 ? tenantId : item.tenant_id;
    await assertTenantAccess(resolvedTenantId);
    const [allTags, allCollections, embedding] = await Promise.all([
        listTags(resolvedTenantId),
        listCollections(resolvedTenantId),
        getEmbedding(itemId, resolvedTenantId),
    ]);
    const itemTags = allTags.filter((t) => item.tags.includes(t.slug));
    const itemCollections = allCollections.filter((c) => item.collection_ids.includes(c.id));
    const related = await listRelated(item, resolvedTenantId);
    return {
        tenantId: resolvedTenantId,
        item,
        file: toContentFile(item),
        tags: itemTags,
        collections: itemCollections,
        embedding,
        related,
        generatedAt: new Date().toISOString(),
    };
}
async function listRelated(item, tenantId) {
    if (item.tags.length === 0 && item.collection_ids.length === 0)
        return [];
    const items = await listContentItems(tenantId);
    return items
        .filter((r) => r.id !== item.id)
        .map((r) => {
        const sharedTags = r.tags.filter((t) => item.tags.includes(t)).length;
        const sharedCollections = r.collection_ids.filter((c) => item.collection_ids.includes(c)).length;
        return { r, score: sharedTags * 2 + sharedCollections };
    })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((x) => x.r);
}
export async function getContentCollectionSurface(collectionId, tenantId) {
    const collection = await getCollection(collectionId, tenantId);
    if (!collection)
        return null;
    const resolvedTenantId = tenantId !== null && tenantId !== void 0 ? tenantId : collection.tenant_id;
    await assertTenantAccess(resolvedTenantId);
    const [allItems, allTags] = await Promise.all([
        listContentItems(resolvedTenantId),
        listTags(resolvedTenantId),
    ]);
    const items = allItems.filter((i) => collection.item_ids.includes(i.id));
    const tagSlugs = new Set(collection.tags);
    items.forEach((i) => i.tags.forEach((t) => tagSlugs.add(t)));
    const tags = allTags.filter((t) => tagSlugs.has(t.slug));
    return {
        tenantId: resolvedTenantId,
        collection,
        items,
        tags,
        generatedAt: new Date().toISOString(),
    };
}
export async function uploadContentFile(file, metadata) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    await assertTenantAccess(metadata.tenantId);
    const kind = (_a = metadata.kind) !== null && _a !== void 0 ? _a : inferKindFromMime((_b = file.mimeType) !== null && _b !== void 0 ? _b : null, "file");
    const item = await createContentItem({
        tenant_id: metadata.tenantId,
        title: metadata.title,
        description: (_c = metadata.description) !== null && _c !== void 0 ? _c : null,
        kind,
        visibility: (_d = metadata.visibility) !== null && _d !== void 0 ? _d : "tenant",
        mime_type: (_e = file.mimeType) !== null && _e !== void 0 ? _e : null,
        file_url: (_f = file.fileUrl) !== null && _f !== void 0 ? _f : null,
        file_name: file.fileName,
        file_size_bytes: (_g = file.sizeBytes) !== null && _g !== void 0 ? _g : null,
        thumbnail_url: (_h = file.thumbnailUrl) !== null && _h !== void 0 ? _h : null,
        source_url: (_j = file.sourceUrl) !== null && _j !== void 0 ? _j : null,
        tags: (_k = metadata.tags) !== null && _k !== void 0 ? _k : [],
        collection_ids: (_l = metadata.collectionIds) !== null && _l !== void 0 ? _l : [],
        program_id: (_m = metadata.programId) !== null && _m !== void 0 ? _m : null,
        level_id: (_o = metadata.levelId) !== null && _o !== void 0 ? _o : null,
        lesson_id: (_p = metadata.lessonId) !== null && _p !== void 0 ? _p : null,
        author_id: (_q = metadata.authorId) !== null && _q !== void 0 ? _q : null,
        metadata: (_r = metadata.extra) !== null && _r !== void 0 ? _r : {},
    });
    if (metadata.tags && metadata.tags.length > 0) {
        await Promise.all(metadata.tags.map((label) => createTag(metadata.tenantId, { label }).catch(() => null)));
    }
    const surface = await getContentSurface(item.id, metadata.tenantId);
    if (!surface)
        throw new Error("SURFACE_UNAVAILABLE");
    return { item, surface };
}
export async function updateContentMetadata(itemId, metadata) {
    var _a, _b, _c, _d, _e, _f;
    await assertTenantAccess(metadata.tenantId);
    const current = await getContentItem(itemId, metadata.tenantId);
    if (!current)
        throw new Error("NOT_FOUND");
    await updateContentItem(itemId, {
        tenant_id: metadata.tenantId,
        title: (_a = metadata.title) !== null && _a !== void 0 ? _a : current.title,
        description: metadata.description === undefined
            ? current.description
            : metadata.description,
        kind: (_b = metadata.kind) !== null && _b !== void 0 ? _b : current.kind,
        visibility: (_c = metadata.visibility) !== null && _c !== void 0 ? _c : current.visibility,
        tags: (_d = metadata.tags) !== null && _d !== void 0 ? _d : current.tags,
        collection_ids: (_e = metadata.collectionIds) !== null && _e !== void 0 ? _e : current.collection_ids,
        program_id: metadata.programId === undefined
            ? current.program_id
            : metadata.programId,
        level_id: metadata.levelId === undefined ? current.level_id : metadata.levelId,
        lesson_id: metadata.lessonId === undefined ? current.lesson_id : metadata.lessonId,
        author_id: metadata.authorId === undefined ? current.author_id : metadata.authorId,
        metadata: (_f = metadata.extra) !== null && _f !== void 0 ? _f : current.metadata,
    });
    const surface = await getContentSurface(itemId, metadata.tenantId);
    if (!surface)
        throw new Error("SURFACE_UNAVAILABLE");
    return surface;
}
function scoreItem(item, tokens, tagBySlug) {
    var _a, _b, _c, _d, _e;
    if (tokens.length === 0) {
        return { score: 0, matchedTags: [], snippet: null };
    }
    const haystack = [
        item.title,
        (_a = item.description) !== null && _a !== void 0 ? _a : "",
        (_b = item.file_name) !== null && _b !== void 0 ? _b : "",
        item.tags.map((t) => { var _a, _b; return (_b = (_a = tagBySlug.get(t)) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : t; }).join(" "),
    ]
        .join(" \n ")
        .toLowerCase();
    let score = 0;
    const matchedTags = [];
    for (const token of tokens) {
        if (!token)
            continue;
        if (item.title.toLowerCase().includes(token))
            score += 5;
        if (((_c = item.description) !== null && _c !== void 0 ? _c : "").toLowerCase().includes(token))
            score += 2;
        if (((_d = item.file_name) !== null && _d !== void 0 ? _d : "").toLowerCase().includes(token))
            score += 1;
        for (const tagSlug of item.tags) {
            const tag = tagBySlug.get(tagSlug);
            const label = ((_e = tag === null || tag === void 0 ? void 0 : tag.label) !== null && _e !== void 0 ? _e : tagSlug).toLowerCase();
            if (label.includes(token) || tagSlug.includes(token)) {
                score += 3;
                if (!matchedTags.includes(tagSlug))
                    matchedTags.push(tagSlug);
            }
        }
        if (!haystack.includes(token))
            score -= 0;
    }
    score += Math.min(item.access_count, 50) / 25;
    const snippet = item.description && item.description.length > 0
        ? item.description.slice(0, 160)
        : null;
    return { score, matchedTags, snippet };
}
export async function searchContent(tenantId, query) {
    await assertTenantAccess(tenantId);
    const [items, tags] = await Promise.all([
        listContentItems(tenantId),
        listTags(tenantId),
    ]);
    const tagBySlug = new Map(tags.map((t) => [t.slug, t]));
    const tokens = query
        .toLowerCase()
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean);
    const scored = items
        .map((item) => {
        const { score, matchedTags, snippet } = scoreItem(item, tokens, tagBySlug);
        return { item, score, matchedTags, snippet };
    })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);
    return {
        tenantId,
        query,
        results: scored,
        generatedAt: new Date().toISOString(),
    };
}
export async function recordContentAccess(itemId, tenantId) {
    await assertTenantAccess(tenantId);
    const item = await getContentItem(itemId, tenantId);
    if (!item)
        return;
    await updateContentItem(itemId, {
        tenant_id: tenantId,
        access_count: item.access_count + 1,
        last_accessed_at: new Date().toISOString(),
    });
}
export async function addTagToItem(itemId, tag, tenantId) {
    await assertTenantAccess(tenantId);
    await createTag(tenantId, { label: tag }).catch(() => null);
    return addTagToItemQuery(itemId, tag, tenantId);
}
export async function removeTagFromItem(itemId, tag, tenantId) {
    await assertTenantAccess(tenantId);
    return removeTagFromItemQuery(itemId, tag, tenantId);
}
export async function addItemToCollection(itemId, collectionId, tenantId) {
    await assertTenantAccess(tenantId);
    return addItemToCollectionQuery(itemId, collectionId, tenantId);
}
export async function removeItemFromCollection(itemId, collectionId, tenantId) {
    await assertTenantAccess(tenantId);
    return removeItemFromCollectionQuery(itemId, collectionId, tenantId);
}
export async function storeContentEmbedding(itemId, vector, tenantId, options) {
    await assertTenantAccess(tenantId);
    return saveEmbedding(itemId, vector, {
        tenantId,
        model: options === null || options === void 0 ? void 0 : options.model,
        contentHash: options === null || options === void 0 ? void 0 : options.contentHash,
    });
}
export async function createContentCollection(tenantId, input) {
    var _a, _b;
    await assertTenantAccess(tenantId);
    return createCollection(tenantId, {
        title: input.title,
        description: (_a = input.description) !== null && _a !== void 0 ? _a : null,
        tags: (_b = input.tags) !== null && _b !== void 0 ? _b : [],
    });
}
export const _internal = { computeKpis, KIND_KEYS };
