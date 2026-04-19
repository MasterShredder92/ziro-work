import { clientFor } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "content_tags";

export type ContentTagRow = {
  id: string;
  tenant_id: string;
  label: string;
  slug: string;
  color: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

type GlobalStore = typeof globalThis & {
  __ziro_content_tags_store?: Map<string, ContentTagRow>;
};

const g = globalThis as GlobalStore;

function store(): Map<string, ContentTagRow> {
  if (!g.__ziro_content_tags_store) g.__ziro_content_tags_store = new Map();
  return g.__ziro_content_tags_store;
}

function newId(): string {
  return `ct_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "tag";
}

function normalize(input: Partial<ContentTagRow>): ContentTagRow {
  const id = input.id ?? newId();
  const now = nowIso();
  const label = String(input.label ?? "Tag");
  const slug =
    typeof input.slug === "string" && input.slug.length > 0
      ? input.slug
      : toSlug(label);
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    label,
    slug,
    color: input.color ?? null,
    description: input.description ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
    created_by: input.created_by ?? null,
  };
}

export async function listContentTags(
  tenantId: string,
): Promise<ContentTagRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .order("label", { ascending: true });
      if (!error) return (data ?? []) as ContentTagRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.tenant_id === tenantId)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function getContentTag(
  tagId: string,
  tenantId?: string,
): Promise<ContentTagRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", tagId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as ContentTagRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(tagId) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}

export async function getContentTagBySlug(
  slug: string,
  tenantId: string,
): Promise<ContentTagRow | null> {
  const all = await listContentTags(tenantId);
  return all.find((t) => t.slug === slug) ?? null;
}

export async function upsertContentTag(
  tenantId: string,
  input: Partial<ContentTagRow> & { label: string },
): Promise<ContentTagRow> {
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
      if (!error && data) return data as ContentTagRow;
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

export async function deleteContentTag(
  tagId: string,
  tenantId?: string,
): Promise<void> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).delete().eq("id", tagId);
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

  const row = store().get(tagId);
  if (row && (!tenantId || row.tenant_id === tenantId)) store().delete(tagId);
}
