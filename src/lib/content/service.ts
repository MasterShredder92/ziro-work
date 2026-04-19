import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { listContentEmbeddings } from "@data/contentEmbeddings";
import {
  addItemToCollection as addItemToCollectionQuery,
  addTagToItem as addTagToItemQuery,
  createCollection,
  createContentItem,
  createTag,
  getCollection,
  getContentItem,
  getEmbedding,
  listCollections,
  listContentItems,
  listTags,
  removeItemFromCollection as removeItemFromCollectionQuery,
  removeTagFromItem as removeTagFromItemQuery,
  saveEmbedding,
  updateContentItem,
} from "./queries";
import type {
  ContentCollection,
  ContentCollectionSurface,
  ContentDashboardData,
  ContentFile,
  ContentItem,
  ContentItemKind,
  ContentKpis,
  ContentSearchResponse,
  ContentSearchResult,
  ContentSurface,
  ContentTag,
  UploadFilePayload,
  UploadMetadata,
  UploadResult,
} from "./types";

const KIND_KEYS: ContentItemKind[] = [
  "file",
  "document",
  "video",
  "audio",
  "image",
  "link",
  "note",
];

function emptyKindCounts(): Record<ContentItemKind, number> {
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

function computeKpis(
  items: ContentItem[],
  tags: ContentTag[],
  collections: ContentCollection[],
  itemsWithEmbeddings: number,
): ContentKpis {
  const itemsByKind = emptyKindCounts();
  const tagUsage = new Map<string, number>();
  for (const item of items) {
    itemsByKind[item.kind] = (itemsByKind[item.kind] ?? 0) + 1;
    for (const tag of item.tags) {
      tagUsage.set(tag, (tagUsage.get(tag) ?? 0) + 1);
    }
  }

  const tagBySlug = new Map(tags.map((t) => [t.slug, t]));
  const mostUsedTags = Array.from(tagUsage.entries())
    .map(([slug, usageCount]) => {
      const tag = tagBySlug.get(slug);
      return {
        slug,
        label: tag?.label ?? slug,
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
  const embeddingCoveragePct =
    total > 0 ? Math.round((itemsWithEmbeddings / total) * 100) : 0;

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

function toContentFile(item: ContentItem): ContentFile | null {
  if (!item.file_url && !item.source_url) return null;
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

function inferKindFromMime(
  mime: string | null | undefined,
  fallback: ContentItemKind = "file",
): ContentItemKind {
  if (!mime) return fallback;
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m === "application/pdf" || m.startsWith("text/")) return "document";
  return fallback;
}

export async function getContentDashboard(
  tenantId: string,
): Promise<ContentDashboardData> {
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

export async function getContentSurface(
  itemId: string,
  tenantId?: string,
): Promise<ContentSurface | null> {
  const item = await getContentItem(itemId, tenantId);
  if (!item) return null;
  const resolvedTenantId = tenantId ?? item.tenant_id;
  await assertTenantAccess(resolvedTenantId);

  const [allTags, allCollections, embedding] = await Promise.all([
    listTags(resolvedTenantId),
    listCollections(resolvedTenantId),
    getEmbedding(itemId, resolvedTenantId),
  ]);

  const itemTags = allTags.filter((t) => item.tags.includes(t.slug));
  const itemCollections = allCollections.filter((c) =>
    item.collection_ids.includes(c.id),
  );

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

async function listRelated(
  item: ContentItem,
  tenantId: string,
): Promise<ContentItem[]> {
  if (item.tags.length === 0 && item.collection_ids.length === 0) return [];
  const items = await listContentItems(tenantId);
  return items
    .filter((r) => r.id !== item.id)
    .map((r) => {
      const sharedTags = r.tags.filter((t) => item.tags.includes(t)).length;
      const sharedCollections = r.collection_ids.filter((c) =>
        item.collection_ids.includes(c),
      ).length;
      return { r, score: sharedTags * 2 + sharedCollections };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.r);
}

export async function getContentCollectionSurface(
  collectionId: string,
  tenantId?: string,
): Promise<ContentCollectionSurface | null> {
  const collection = await getCollection(collectionId, tenantId);
  if (!collection) return null;
  const resolvedTenantId = tenantId ?? collection.tenant_id;
  await assertTenantAccess(resolvedTenantId);

  const [allItems, allTags] = await Promise.all([
    listContentItems(resolvedTenantId),
    listTags(resolvedTenantId),
  ]);
  const items = allItems.filter((i) => collection.item_ids.includes(i.id));
  const tagSlugs = new Set<string>(collection.tags);
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

export async function uploadContentFile(
  file: UploadFilePayload,
  metadata: UploadMetadata & { tenantId: string },
): Promise<UploadResult> {
  await assertTenantAccess(metadata.tenantId);

  const kind: ContentItemKind =
    metadata.kind ?? inferKindFromMime(file.mimeType ?? null, "file");

  const item = await createContentItem({
    tenant_id: metadata.tenantId,
    title: metadata.title,
    description: metadata.description ?? null,
    kind,
    visibility: metadata.visibility ?? "tenant",
    mime_type: file.mimeType ?? null,
    file_url: file.fileUrl ?? null,
    file_name: file.fileName,
    file_size_bytes: file.sizeBytes ?? null,
    thumbnail_url: file.thumbnailUrl ?? null,
    source_url: file.sourceUrl ?? null,
    tags: metadata.tags ?? [],
    collection_ids: metadata.collectionIds ?? [],
    program_id: metadata.programId ?? null,
    level_id: metadata.levelId ?? null,
    lesson_id: metadata.lessonId ?? null,
    author_id: metadata.authorId ?? null,
    metadata: metadata.extra ?? {},
  });

  if (metadata.tags && metadata.tags.length > 0) {
    await Promise.all(
      metadata.tags.map((label) =>
        createTag(metadata.tenantId, { label }).catch(() => null),
      ),
    );
  }

  const surface = await getContentSurface(item.id, metadata.tenantId);
  if (!surface) throw new Error("SURFACE_UNAVAILABLE");

  return { item, surface };
}

export async function updateContentMetadata(
  itemId: string,
  metadata: Partial<UploadMetadata> & { tenantId: string },
): Promise<ContentSurface> {
  await assertTenantAccess(metadata.tenantId);
  const current = await getContentItem(itemId, metadata.tenantId);
  if (!current) throw new Error("NOT_FOUND");

  await updateContentItem(itemId, {
    tenant_id: metadata.tenantId,
    title: metadata.title ?? current.title,
    description:
      metadata.description === undefined
        ? current.description
        : metadata.description,
    kind: metadata.kind ?? current.kind,
    visibility: metadata.visibility ?? current.visibility,
    tags: metadata.tags ?? current.tags,
    collection_ids: metadata.collectionIds ?? current.collection_ids,
    program_id:
      metadata.programId === undefined
        ? current.program_id
        : metadata.programId,
    level_id:
      metadata.levelId === undefined ? current.level_id : metadata.levelId,
    lesson_id:
      metadata.lessonId === undefined ? current.lesson_id : metadata.lessonId,
    author_id:
      metadata.authorId === undefined ? current.author_id : metadata.authorId,
    metadata: metadata.extra ?? current.metadata,
  });

  const surface = await getContentSurface(itemId, metadata.tenantId);
  if (!surface) throw new Error("SURFACE_UNAVAILABLE");
  return surface;
}

function scoreItem(
  item: ContentItem,
  tokens: string[],
  tagBySlug: Map<string, ContentTag>,
): { score: number; matchedTags: string[]; snippet: string | null } {
  if (tokens.length === 0) {
    return { score: 0, matchedTags: [], snippet: null };
  }
  const haystack = [
    item.title,
    item.description ?? "",
    item.file_name ?? "",
    item.tags.map((t) => tagBySlug.get(t)?.label ?? t).join(" "),
  ]
    .join(" \n ")
    .toLowerCase();

  let score = 0;
  const matchedTags: string[] = [];
  for (const token of tokens) {
    if (!token) continue;
    if (item.title.toLowerCase().includes(token)) score += 5;
    if ((item.description ?? "").toLowerCase().includes(token)) score += 2;
    if ((item.file_name ?? "").toLowerCase().includes(token)) score += 1;
    for (const tagSlug of item.tags) {
      const tag = tagBySlug.get(tagSlug);
      const label = (tag?.label ?? tagSlug).toLowerCase();
      if (label.includes(token) || tagSlug.includes(token)) {
        score += 3;
        if (!matchedTags.includes(tagSlug)) matchedTags.push(tagSlug);
      }
    }
    if (!haystack.includes(token)) score -= 0;
  }

  score += Math.min(item.access_count, 50) / 25;

  const snippet =
    item.description && item.description.length > 0
      ? item.description.slice(0, 160)
      : null;

  return { score, matchedTags, snippet };
}

export async function searchContent(
  tenantId: string,
  query: string,
): Promise<ContentSearchResponse> {
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

  const scored: ContentSearchResult[] = items
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

export async function recordContentAccess(
  itemId: string,
  tenantId: string,
): Promise<void> {
  await assertTenantAccess(tenantId);
  const item = await getContentItem(itemId, tenantId);
  if (!item) return;
  await updateContentItem(itemId, {
    tenant_id: tenantId,
    access_count: item.access_count + 1,
    last_accessed_at: new Date().toISOString(),
  });
}

export async function addTagToItem(
  itemId: string,
  tag: string,
  tenantId: string,
): Promise<ContentItem> {
  await assertTenantAccess(tenantId);
  await createTag(tenantId, { label: tag }).catch(() => null);
  return addTagToItemQuery(itemId, tag, tenantId);
}

export async function removeTagFromItem(
  itemId: string,
  tag: string,
  tenantId: string,
): Promise<ContentItem> {
  await assertTenantAccess(tenantId);
  return removeTagFromItemQuery(itemId, tag, tenantId);
}

export async function addItemToCollection(
  itemId: string,
  collectionId: string,
  tenantId: string,
): Promise<{ item: ContentItem; collection: ContentCollection }> {
  await assertTenantAccess(tenantId);
  return addItemToCollectionQuery(itemId, collectionId, tenantId);
}

export async function removeItemFromCollection(
  itemId: string,
  collectionId: string,
  tenantId: string,
): Promise<{ item: ContentItem; collection: ContentCollection }> {
  await assertTenantAccess(tenantId);
  return removeItemFromCollectionQuery(itemId, collectionId, tenantId);
}

export async function storeContentEmbedding(
  itemId: string,
  vector: number[],
  tenantId: string,
  options?: { model?: string; contentHash?: string | null },
) {
  await assertTenantAccess(tenantId);
  return saveEmbedding(itemId, vector, {
    tenantId,
    model: options?.model,
    contentHash: options?.contentHash,
  });
}

export async function createContentCollection(
  tenantId: string,
  input: { title: string; description?: string | null; tags?: string[] },
): Promise<ContentCollection> {
  await assertTenantAccess(tenantId);
  return createCollection(tenantId, {
    title: input.title,
    description: input.description ?? null,
    tags: input.tags ?? [],
  });
}

export const _internal = { computeKpis, KIND_KEYS };
