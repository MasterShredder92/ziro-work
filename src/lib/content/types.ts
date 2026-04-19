import type {
  ContentItemRow,
  ContentItemKind,
  ContentItemVisibility,
  ContentItemFilter,
} from "@data/contentItems";
import type { ContentTagRow } from "@data/contentTags";
import type {
  ContentCollectionRow,
  ContentCollectionVisibility,
} from "@data/contentCollections";
import type { ContentEmbeddingRow } from "@data/contentEmbeddings";

export type ContentItem = ContentItemRow;
export type ContentTag = ContentTagRow;
export type ContentCollection = ContentCollectionRow;
export type ContentEmbedding = ContentEmbeddingRow;

export type {
  ContentItemKind,
  ContentItemVisibility,
  ContentCollectionVisibility,
  ContentItemFilter,
};

/**
 * A ContentFile is the file-specific projection of a ContentItem — the subset
 * of fields relevant when the item represents a stored binary or hosted asset.
 */
export type ContentFile = {
  itemId: string;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  thumbnailUrl: string | null;
  sourceUrl: string | null;
};

export type ContentKpis = {
  totalItems: number;
  itemsByKind: Record<ContentItemKind, number>;
  totalTags: number;
  totalCollections: number;
  mostUsedTags: Array<{ slug: string; label: string; usageCount: number }>;
  mostAccessedItems: Array<{
    id: string;
    title: string;
    kind: ContentItemKind;
    accessCount: number;
  }>;
  embeddingCoveragePct: number;
  itemsWithEmbeddings: number;
};

export type ContentDashboardData = {
  tenantId: string;
  generatedAt: string;
  items: ContentItem[];
  tags: ContentTag[];
  collections: ContentCollection[];
  kpis: ContentKpis;
};

export type ContentSurface = {
  tenantId: string;
  item: ContentItem;
  file: ContentFile | null;
  tags: ContentTag[];
  collections: ContentCollection[];
  embedding: ContentEmbedding | null;
  related: ContentItem[];
  generatedAt: string;
};

export type ContentCollectionSurface = {
  tenantId: string;
  collection: ContentCollection;
  items: ContentItem[];
  tags: ContentTag[];
  generatedAt: string;
};

export type UploadResult = {
  item: ContentItem;
  surface: ContentSurface;
};

export type ContentSearchResult = {
  item: ContentItem;
  score: number;
  snippet: string | null;
  matchedTags: string[];
};

export type ContentSearchResponse = {
  tenantId: string;
  query: string;
  results: ContentSearchResult[];
  generatedAt: string;
};

export type UploadMetadata = {
  title: string;
  description?: string | null;
  kind?: ContentItemKind;
  visibility?: ContentItemVisibility;
  tags?: string[];
  collectionIds?: string[];
  programId?: string | null;
  levelId?: string | null;
  lessonId?: string | null;
  authorId?: string | null;
  extra?: Record<string, unknown>;
};

export type UploadFilePayload = {
  fileName: string;
  mimeType?: string | null;
  fileUrl?: string | null;
  sizeBytes?: number | null;
  thumbnailUrl?: string | null;
  sourceUrl?: string | null;
};
