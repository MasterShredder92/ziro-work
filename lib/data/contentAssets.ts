import { clientFor } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "content_assets";

export type ContentAssetKind = "image" | "document" | "video" | "audio" | "link" | "file";

export type ContentAssetRow = {
  id: string;
  tenant_id: string;
  item_id: string | null;
  folder_id: string | null;
  kind: ContentAssetKind | string;
  name: string;
  url: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string | null;
  thumbnail_url: string | null;
  alt_text: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

type GlobalStore = typeof globalThis & {
  __ziro_content_assets_store?: Map<string, ContentAssetRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, ContentAssetRow> {
  if (!g.__ziro_content_assets_store)
    g.__ziro_content_assets_store = new Map();
  return g.__ziro_content_assets_store;
}

function newId(): string {
  return `ca_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalize(input: Partial<ContentAssetRow>): ContentAssetRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    item_id: input.item_id ?? null,
    folder_id: input.folder_id ?? null,
    kind: input.kind ?? "file",
    name: String(input.name ?? "untitled"),
    url: String(input.url ?? ""),
    mime_type: input.mime_type ?? null,
    size_bytes:
      typeof input.size_bytes === "number" ? input.size_bytes : null,
    storage_path: input.storage_path ?? null,
    thumbnail_url: input.thumbnail_url ?? null,
    alt_text: input.alt_text ?? null,
    metadata:
      (input.metadata as Record<string, unknown>) ??
      ({} as Record<string, unknown>),
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
    created_by: input.created_by ?? null,
  };
}

export type ContentAssetFilter = {
  itemId?: string | null;
  folderId?: string | null;
  kind?: string;
};

export async function listContentAssets(
  tenantId: string,
  filter?: ContentAssetFilter,
): Promise<ContentAssetRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.itemId === null) query = query.is("item_id", null);
      else if (filter?.itemId) query = query.eq("item_id", filter.itemId);
      if (filter?.folderId === null) query = query.is("folder_id", null);
      else if (filter?.folderId) query = query.eq("folder_id", filter.folderId);
      if (filter?.kind) query = query.eq("kind", filter.kind);
      const { data, error } = await query.order("updated_at", {
        ascending: false,
      });
      if (!error) return (data ?? []) as ContentAssetRow[];
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
  if (filter?.itemId === null) rows = rows.filter((r) => !r.item_id);
  else if (filter?.itemId)
    rows = rows.filter((r) => r.item_id === filter.itemId);
  if (filter?.folderId === null) rows = rows.filter((r) => !r.folder_id);
  else if (filter?.folderId)
    rows = rows.filter((r) => r.folder_id === filter.folderId);
  if (filter?.kind) rows = rows.filter((r) => r.kind === filter.kind);
  return rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getContentAsset(
  assetId: string,
  tenantId: string,
): Promise<ContentAssetRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", assetId)
        .maybeSingle();
      if (!error) return (data ?? null) as ContentAssetRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(assetId);
  if (!row) return null;
  if (row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertContentAsset(
  tenantId: string,
  input: Partial<ContentAssetRow> & { name: string; url: string },
): Promise<ContentAssetRow> {
  const row = normalize({
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
      if (!error && data) return data as ContentAssetRow;
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

export async function deleteContentAsset(
  assetId: string,
  tenantId: string,
): Promise<void> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", assetId);
      if (!error) return;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(assetId);
  if (row && row.tenant_id === tenantId) store().delete(assetId);
}
