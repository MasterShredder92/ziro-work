import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "content_collections";

export type ContentCollectionVisibility = "tenant" | "teachers" | "public";

export type ContentCollectionRow = {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  visibility: ContentCollectionVisibility;
  cover_url: string | null;
  tags: string[];
  item_ids: string[];
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_content_collections_store?: Map<string, ContentCollectionRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, ContentCollectionRow> {
  if (!g.__ziro_content_collections_store) {
    g.__ziro_content_collections_store = new Map();
  }
  return g.__ziro_content_collections_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `ccol_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeRow(
  input: Partial<ContentCollectionRow>,
): ContentCollectionRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    title: String(input.title ?? "Untitled collection"),
    description: input.description ?? null,
    visibility: (input.visibility ?? "tenant") as ContentCollectionVisibility,
    cover_url: input.cover_url ?? null,
    tags: Array.isArray(input.tags) ? input.tags : [],
    item_ids: Array.isArray(input.item_ids) ? input.item_ids : [],
    author_id: input.author_id ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export async function listContentCollections(
  tenantId: string,
  opts?: ListOptions,
): Promise<ContentCollectionRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "updated_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return (data ?? []) as ContentCollectionRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.tenant_id === tenantId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getContentCollection(
  collectionId: string,
  tenantId?: string,
): Promise<ContentCollectionRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", collectionId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as ContentCollectionRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(collectionId) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertContentCollection(
  tenantId: string,
  input: Partial<ContentCollectionRow> & { title?: string },
): Promise<ContentCollectionRow> {
  const existing = input.id ? store().get(input.id) ?? null : null;
  const row = normalizeRow({
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
      if (!error && data) return data as ContentCollectionRow;
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
