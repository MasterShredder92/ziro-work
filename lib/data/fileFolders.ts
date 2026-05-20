import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing } from "./_missingTable";

export type FileFolderRow = {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  path: string;
  owner_id: string | null;
  visibility: "private" | "tenant" | "shared" | "public";
  acl: Array<Record<string, unknown>>;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

const TABLE = "file_folders";

type GlobalStore = typeof globalThis & {
  __ziro_file_folders?: Map<string, FileFolderRow>;
};

function store(): Map<string, FileFolderRow> {
  const g = globalThis as GlobalStore;
  if (!g.__ziro_file_folders) g.__ziro_file_folders = new Map();
  return g.__ziro_file_folders;
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `folder_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function listFromStore(tenantId: string, parentId?: string | null): FileFolderRow[] {
  const out: FileFolderRow[] = [];
  for (const row of store().values()) {
    if (row.tenant_id !== tenantId) continue;
    if (parentId !== undefined && (row.parent_id ?? null) !== (parentId ?? null))
      continue;
    out.push(row);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listFolders(
  tenantId: string,
  parentId?: string | null,
): Promise<FileFolderRow[]> {
  if (tableMissing(TABLE)) return listFromStore(tenantId, parentId);
  try {
    const supabase = await clientFor(tenantId);
    let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
    if (parentId !== undefined) {
      if (parentId === null) query = query.is("parent_id", null);
      else query = query.eq("parent_id", parentId);
    }
    const { data, error } = await query.order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as FileFolderRow[];
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return listFromStore(tenantId, parentId);
    }
    throw err;
  }
}

export async function getFolder(
  id: string,
  tenantId: string,
): Promise<FileFolderRow | null> {
  if (tableMissing(TABLE)) {
    const row = store().get(id);
    if (!row || row.tenant_id !== tenantId) return null;
    return row;
  }
  try {
    const supabase = await clientFor(tenantId);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as FileFolderRow | null;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return getFolder(id, tenantId);
    }
    throw err;
  }
}

export type UpsertFolderInput = Partial<Omit<FileFolderRow, "tenant_id">> & {
  id?: string;
  name?: string;
};

function merge(
  existing: FileFolderRow | undefined,
  tenantId: string,
  input: UpsertFolderInput,
): FileFolderRow {
  const now = nowIso();
  const id = input.id ?? existing?.id ?? uuid();
  const name = input.name ?? existing?.name ?? "Untitled folder";
  const parentId = input.parent_id ?? existing?.parent_id ?? null;
  const path = input.path ?? existing?.path ?? name;
  return {
    id,
    tenant_id: tenantId,
    parent_id: parentId,
    name,
    description: input.description ?? existing?.description ?? null,
    path,
    owner_id: input.owner_id ?? existing?.owner_id ?? null,
    visibility: input.visibility ?? existing?.visibility ?? "tenant",
    acl: input.acl ?? existing?.acl ?? [],
    metadata: input.metadata ?? existing?.metadata ?? {},
    created_at: existing?.created_at ?? now,
    updated_at: now,
    created_by: input.created_by ?? existing?.created_by ?? null,
    updated_by:
      input.updated_by ??
      input.created_by ??
      existing?.updated_by ??
      existing?.created_by ??
      null,
  };
}

export async function upsertFolder(
  tenantId: string,
  input: UpsertFolderInput,
): Promise<FileFolderRow> {
  const existing = input.id ? await getFolder(input.id, tenantId) : null;
  const next = merge(existing ?? undefined, tenantId, input);
  if (tableMissing(TABLE)) {
    store().set(next.id, next);
    return next;
  }
  try {
    const supabase = await clientFor(tenantId);
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(next, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as FileFolderRow;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      store().set(next.id, next);
      return next;
    }
    throw err;
  }
}

export async function deleteFolder(
  id: string,
  tenantId: string,
): Promise<void> {
  if (tableMissing(TABLE)) {
    const row = store().get(id);
    if (row && row.tenant_id === tenantId) store().delete(id);
    return;
  }
  try {
    const supabase = await clientFor(tenantId);
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id);
    if (error) throw error;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return deleteFolder(id, tenantId);
    }
    throw err;
  }
}
