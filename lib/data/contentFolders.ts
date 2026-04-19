import { clientFor } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "content_folders";

export type ContentFolderRow = {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  sort_order: number;
  pinned: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

type GlobalStore = typeof globalThis & {
  __ziro_content_folders_store?: Map<string, ContentFolderRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, ContentFolderRow> {
  if (!g.__ziro_content_folders_store)
    g.__ziro_content_folders_store = new Map();
  return g.__ziro_content_folders_store;
}

function newId(): string {
  return `cf_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalize(input: Partial<ContentFolderRow>): ContentFolderRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    parent_id: input.parent_id ?? null,
    name: String(input.name ?? "Untitled folder"),
    slug: input.slug ?? null,
    description: input.description ?? null,
    sort_order:
      typeof input.sort_order === "number" ? input.sort_order : 0,
    pinned: input.pinned === true,
    color: input.color ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
    created_by: input.created_by ?? null,
  };
}

export async function listContentFolders(
  tenantId: string,
): Promise<ContentFolderRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (!error) return (data ?? []) as ContentFolderRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.tenant_id === tenantId)
    .sort((a, b) => {
      const so = a.sort_order - b.sort_order;
      if (so !== 0) return so;
      return a.name.localeCompare(b.name);
    });
}

export async function getContentFolder(
  folderId: string,
  tenantId: string,
): Promise<ContentFolderRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", folderId)
        .maybeSingle();
      if (!error) return (data ?? null) as ContentFolderRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(folderId);
  if (!row) return null;
  if (row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertContentFolder(
  tenantId: string,
  input: Partial<ContentFolderRow> & { name: string },
): Promise<ContentFolderRow> {
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
      if (!error && data) return data as ContentFolderRow;
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

export async function deleteContentFolder(
  folderId: string,
  tenantId: string,
): Promise<void> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", folderId);
      if (!error) return;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(folderId);
  if (row && row.tenant_id === tenantId) store().delete(folderId);
}
