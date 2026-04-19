import { clientFor } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "content_embeddings";

export type ContentEmbeddingRow = {
  id: string;
  tenant_id: string;
  item_id: string;
  model: string;
  dimensions: number;
  vector: number[];
  content_hash: string | null;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_content_embeddings_store?: Map<string, ContentEmbeddingRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, ContentEmbeddingRow> {
  if (!g.__ziro_content_embeddings_store) {
    g.__ziro_content_embeddings_store = new Map();
  }
  return g.__ziro_content_embeddings_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `cembed_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeRow(
  input: Partial<ContentEmbeddingRow>,
): ContentEmbeddingRow {
  const id = input.id ?? newId();
  const vector = Array.isArray(input.vector) ? input.vector : [];
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    item_id: String(input.item_id ?? ""),
    model: String(input.model ?? "text-embedding-3-small"),
    dimensions:
      typeof input.dimensions === "number" ? input.dimensions : vector.length,
    vector,
    content_hash: input.content_hash ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export async function listContentEmbeddings(
  tenantId: string,
): Promise<ContentEmbeddingRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId);
      if (!error) return (data ?? []) as ContentEmbeddingRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values()).filter((r) => r.tenant_id === tenantId);
}

export async function getContentEmbedding(
  itemId: string,
  tenantId?: string,
): Promise<ContentEmbeddingRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("item_id", itemId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as ContentEmbeddingRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  for (const row of store().values()) {
    if (row.item_id === itemId) {
      if (tenantId && row.tenant_id !== tenantId) continue;
      return row;
    }
  }
  return null;
}

export async function upsertContentEmbedding(
  tenantId: string,
  input: Partial<ContentEmbeddingRow> & { item_id: string; vector: number[] },
): Promise<ContentEmbeddingRow> {
  const row = normalizeRow({
    ...input,
    tenant_id: tenantId,
    updated_at: nowIso(),
  });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "item_id" })
        .select("*")
        .single();
      if (!error && data) return data as ContentEmbeddingRow;
      if (error && isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else if (error) throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  for (const existing of store().values()) {
    if (existing.item_id === row.item_id && existing.tenant_id === tenantId) {
      store().delete(existing.id);
    }
  }
  store().set(row.id, row);
  return row;
}
