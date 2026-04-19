import { clientFor } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "content_versions";

export type ContentVersionRow = {
  id: string;
  tenant_id: string;
  item_id: string;
  version: number;
  title: string;
  body: string;
  excerpt: string | null;
  content_type: string;
  change_summary: string | null;
  is_current: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
};

type GlobalStore = typeof globalThis & {
  __ziro_content_versions_store?: Map<string, ContentVersionRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, ContentVersionRow> {
  if (!g.__ziro_content_versions_store)
    g.__ziro_content_versions_store = new Map();
  return g.__ziro_content_versions_store;
}

function newId(): string {
  return `cv_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalize(input: Partial<ContentVersionRow>): ContentVersionRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    item_id: String(input.item_id ?? ""),
    version: typeof input.version === "number" ? input.version : 1,
    title: String(input.title ?? ""),
    body: String(input.body ?? ""),
    excerpt: input.excerpt ?? null,
    content_type: input.content_type ?? "markdown",
    change_summary: input.change_summary ?? null,
    is_current: input.is_current === true,
    metadata:
      (input.metadata as Record<string, unknown>) ??
      ({} as Record<string, unknown>),
    created_at: input.created_at ?? now,
    created_by: input.created_by ?? null,
  };
}

export async function listContentVersions(
  itemId: string,
  tenantId: string,
): Promise<ContentVersionRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("item_id", itemId)
        .order("version", { ascending: false });
      if (!error) return (data ?? []) as ContentVersionRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const rows = Array.from(store().values()).filter(
    (r) => r.tenant_id === tenantId && r.item_id === itemId,
  );
  return rows.sort((a, b) => b.version - a.version);
}

export async function getContentVersion(
  versionId: string,
  tenantId: string,
): Promise<ContentVersionRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", versionId)
        .maybeSingle();
      if (!error) return (data ?? null) as ContentVersionRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(versionId);
  if (!row) return null;
  if (row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertContentVersion(
  tenantId: string,
  input: Partial<ContentVersionRow> & { item_id: string; title: string; body: string },
): Promise<ContentVersionRow> {
  const row = normalize({ ...input, tenant_id: tenantId });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as ContentVersionRow;
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

export async function markVersionCurrent(
  itemId: string,
  versionId: string,
  tenantId: string,
): Promise<void> {
  const versions = await listContentVersions(itemId, tenantId);
  for (const v of versions) {
    const shouldBeCurrent = v.id === versionId;
    if (v.is_current !== shouldBeCurrent) {
      await upsertContentVersion(tenantId, {
        ...v,
        is_current: shouldBeCurrent,
      });
    }
  }
}

export async function deleteContentVersionsForItem(
  itemId: string,
  tenantId: string,
): Promise<void> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("item_id", itemId);
      if (!error) return;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const toRemove: string[] = [];
  for (const [id, row] of store()) {
    if (row.tenant_id === tenantId && row.item_id === itemId) toRemove.push(id);
  }
  for (const id of toRemove) store().delete(id);
}
