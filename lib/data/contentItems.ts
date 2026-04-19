import { clientFor } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "content_items";

export type ContentItemKind =
  | "file"
  | "document"
  | "video"
  | "audio"
  | "image"
  | "link"
  | "note";

export type ContentBodyType =
  | "markdown"
  | "rich_text"
  | "page"
  | "snippet"
  | "note"
  | "plain";

export type ContentItemVisibility = "tenant" | "teachers" | "public";

export type ContentItemRow = {
  id: string;
  tenant_id: string;

  // folder / library model
  folder_id: string | null;
  title: string;
  slug: string | null;
  description: string | null;
  excerpt: string | null;
  body: string;

  // classification
  kind: ContentItemKind;
  content_type: ContentBodyType | string;
  visibility: ContentItemVisibility;

  // taxonomy
  tags: string[];
  collection_ids: string[];
  asset_ids: string[];

  // versioning / lifecycle
  current_version: number;
  is_published: boolean;
  is_archived: boolean;
  pinned: boolean;

  // file / media fields (legacy)
  file_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  thumbnail_url: string | null;
  source_url: string | null;

  // curriculum links
  program_id: string | null;
  level_id: string | null;
  lesson_id: string | null;

  // ownership / metadata
  author_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  metadata: Record<string, unknown>;

  // stats
  access_count: number;
  last_accessed_at: string | null;

  // timestamps
  created_at: string;
  updated_at: string;
};

export type ContentItemFilter = {
  folderId?: string | null;
  tagId?: string;
  tagSlug?: string;
  kind?: string;
  contentType?: string;
  visibility?: ContentItemVisibility | string;
  includeArchived?: boolean;
  publishedOnly?: boolean;
  search?: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_content_items_store?: Map<string, ContentItemRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, ContentItemRow> {
  if (!g.__ziro_content_items_store) g.__ziro_content_items_store = new Map();
  return g.__ziro_content_items_store;
}

function newId(): string {
  return `ci_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalize(input: Partial<ContentItemRow>): ContentItemRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    folder_id: input.folder_id ?? null,
    title: String(input.title ?? "Untitled"),
    slug: input.slug ?? null,
    description: input.description ?? null,
    excerpt: input.excerpt ?? null,
    body: typeof input.body === "string" ? input.body : "",
    kind: (input.kind as ContentItemKind) ?? "note",
    content_type:
      typeof input.content_type === "string" && input.content_type.length > 0
        ? input.content_type
        : "markdown",
    visibility: (input.visibility as ContentItemVisibility) ?? "tenant",
    tags: Array.isArray(input.tags) ? input.tags : [],
    collection_ids: Array.isArray(input.collection_ids)
      ? input.collection_ids
      : [],
    asset_ids: Array.isArray(input.asset_ids) ? input.asset_ids : [],
    current_version:
      typeof input.current_version === "number" && input.current_version > 0
        ? input.current_version
        : 1,
    is_published: input.is_published === true,
    is_archived: input.is_archived === true,
    pinned: input.pinned === true,
    file_url: input.file_url ?? null,
    file_name: input.file_name ?? null,
    mime_type: input.mime_type ?? null,
    file_size_bytes:
      typeof input.file_size_bytes === "number" ? input.file_size_bytes : null,
    thumbnail_url: input.thumbnail_url ?? null,
    source_url: input.source_url ?? null,
    program_id: input.program_id ?? null,
    level_id: input.level_id ?? null,
    lesson_id: input.lesson_id ?? null,
    author_id: input.author_id ?? null,
    created_by: input.created_by ?? null,
    updated_by: input.updated_by ?? null,
    metadata:
      (input.metadata as Record<string, unknown>) ??
      ({} as Record<string, unknown>),
    access_count:
      typeof input.access_count === "number" ? input.access_count : 0,
    last_accessed_at: input.last_accessed_at ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export async function listContentItems(
  tenantId: string,
  filter?: ContentItemFilter,
): Promise<ContentItemRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.folderId === null) query = query.is("folder_id", null);
      else if (filter?.folderId) query = query.eq("folder_id", filter.folderId);
      if (filter?.kind) query = query.eq("kind", filter.kind);
      if (filter?.contentType)
        query = query.eq("content_type", filter.contentType);
      if (filter?.visibility)
        query = query.eq("visibility", filter.visibility);
      if (filter?.tagId) query = query.contains("tags", [filter.tagId]);
      else if (filter?.tagSlug) query = query.contains("tags", [filter.tagSlug]);
      if (!filter?.includeArchived) query = query.eq("is_archived", false);
      if (filter?.publishedOnly) query = query.eq("is_published", true);
      const { data, error } = await query.order("updated_at", {
        ascending: false,
      });
      if (!error) {
        let rows = (data ?? []) as ContentItemRow[];
        const needle = filter?.search?.trim().toLowerCase();
        if (needle) {
          rows = rows.filter(
            (r) =>
              r.title.toLowerCase().includes(needle) ||
              (r.body ?? "").toLowerCase().includes(needle) ||
              (r.excerpt ?? "").toLowerCase().includes(needle) ||
              (r.description ?? "").toLowerCase().includes(needle),
          );
        }
        return rows;
      }
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  let rows = Array.from(store().values()).filter(
    (r) => r.tenant_id === tenantId,
  );
  if (filter?.folderId === null) rows = rows.filter((r) => !r.folder_id);
  else if (filter?.folderId)
    rows = rows.filter((r) => r.folder_id === filter.folderId);
  if (filter?.kind) rows = rows.filter((r) => r.kind === filter.kind);
  if (filter?.contentType)
    rows = rows.filter((r) => r.content_type === filter.contentType);
  if (filter?.visibility)
    rows = rows.filter((r) => r.visibility === filter.visibility);
  if (filter?.tagId) rows = rows.filter((r) => r.tags.includes(filter.tagId!));
  else if (filter?.tagSlug)
    rows = rows.filter((r) => r.tags.includes(filter.tagSlug!));
  if (!filter?.includeArchived) rows = rows.filter((r) => !r.is_archived);
  if (filter?.publishedOnly) rows = rows.filter((r) => r.is_published);
  const needle = filter?.search?.trim().toLowerCase();
  if (needle) {
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        (r.body ?? "").toLowerCase().includes(needle) ||
        (r.excerpt ?? "").toLowerCase().includes(needle) ||
        (r.description ?? "").toLowerCase().includes(needle),
    );
  }
  return rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getContentItem(
  itemId: string,
  tenantId?: string,
): Promise<ContentItemRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", itemId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as ContentItemRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(itemId) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertContentItem(
  tenantId: string,
  input: Partial<ContentItemRow> & { title?: string },
): Promise<ContentItemRow> {
  const existing = input.id ? store().get(input.id) ?? null : null;
  const row = normalize({
    ...(existing ?? {}),
    ...input,
    tenant_id: tenantId,
    updated_at: nowIso(),
  });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as ContentItemRow;
      if (error && isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else if (error) throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  store().set(row.id, row);
  return row;
}

export async function deleteContentItem(
  itemId: string,
  tenantId?: string,
): Promise<void> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).delete().eq("id", itemId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { error } = await query;
      if (!error) return;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(itemId);
  if (row && (!tenantId || row.tenant_id === tenantId)) store().delete(itemId);
}
