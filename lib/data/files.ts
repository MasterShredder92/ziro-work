import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing } from "./_missingTable";

export type FileObjectRow = {
  id: string;
  tenant_id: string;
  folder_id: string | null;
  owner_id: string | null;
  name: string;
  description: string | null;
  mime_type: string;
  size: number;
  extension: string | null;
  storage_key: string | null;
  storage_bucket: string | null;
  checksum: string | null;
  visibility: "private" | "tenant" | "shared" | "public";
  status: "active" | "archived" | "deleted";
  current_version_id: string | null;
  thumbnail_key: string | null;
  virus_scan_status: "pending" | "clean" | "infected" | "skipped";
  signature_status: string | null;
  tags: string[];
  acl: Array<Record<string, unknown>>;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type FileListFilter = {
  folderId?: string | null;
  ownerId?: string;
  mimeType?: string;
  status?: FileObjectRow["status"];
  signatureStatus?: string;
  search?: string;
  limit?: number;
};

const FILES_TABLE = "files";

type GlobalWithStore = typeof globalThis & {
  __ziro_files_store?: Map<string, FileObjectRow>;
};

function store(): Map<string, FileObjectRow> {
  const g = globalThis as GlobalWithStore;
  if (!g.__ziro_files_store) g.__ziro_files_store = new Map();
  return g.__ziro_files_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `file_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function matchFilter(row: FileObjectRow, f?: FileListFilter): boolean {
  if (!f) return true;
  if (f.folderId !== undefined) {
    if ((row.folder_id ?? null) !== (f.folderId ?? null)) return false;
  }
  if (f.ownerId && row.owner_id !== f.ownerId) return false;
  if (f.mimeType && !row.mime_type.startsWith(f.mimeType)) return false;
  if (f.status && row.status !== f.status) return false;
  if (f.signatureStatus && row.signature_status !== f.signatureStatus) return false;
  if (f.search && f.search.trim().length > 0) {
    const s = f.search.trim().toLowerCase();
    const hit =
      row.name.toLowerCase().includes(s) ||
      (row.description?.toLowerCase().includes(s) ?? false);
    if (!hit) return false;
  }
  return true;
}

function listFromStore(tenantId: string, f?: FileListFilter): FileObjectRow[] {
  const out: FileObjectRow[] = [];
  for (const row of store().values()) {
    if (row.tenant_id !== tenantId) continue;
    if (row.status === "deleted") continue;
    if (!matchFilter(row, f)) continue;
    out.push(row);
  }
  out.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return f?.limit ? out.slice(0, f.limit) : out;
}

export async function listFiles(
  tenantId: string,
  filter?: FileListFilter,
): Promise<FileObjectRow[]> {
  if (tableMissing(FILES_TABLE)) return listFromStore(tenantId, filter);
  try {
    const supabase = await clientFor(tenantId);
    let query = supabase.from(FILES_TABLE).select("*").eq("tenant_id", tenantId);
    if (filter?.folderId !== undefined) {
      if (filter.folderId === null) query = query.is("folder_id", null);
      else query = query.eq("folder_id", filter.folderId);
    }
    if (filter?.ownerId) query = query.eq("owner_id", filter.ownerId);
    if (filter?.status) query = query.eq("status", filter.status);
    else query = query.neq("status", "deleted");
    if (filter?.signatureStatus)
      query = query.eq("signature_status", filter.signatureStatus);
    const { data, error } = await query.order("updated_at", { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as unknown as FileObjectRow[];
    return filter?.limit ? rows.slice(0, filter.limit) : rows;
  } catch (err) {
    if (isMissingTableError(err, FILES_TABLE)) {
      markTableMissing(FILES_TABLE);
      return listFromStore(tenantId, filter);
    }
    throw err;
  }
}

/**
 * Find an active file in a folder (or root when folderId is null) by exact name.
 */
export async function findFileByFolderAndName(
  tenantId: string,
  folderId: string | null,
  name: string,
): Promise<FileObjectRow | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (tableMissing(FILES_TABLE)) {
    for (const row of store().values()) {
      if (row.tenant_id !== tenantId) continue;
      if (row.status === "deleted") continue;
      if ((row.folder_id ?? null) !== (folderId ?? null)) continue;
      if (row.name === trimmed) return row;
    }
    return null;
  }
  try {
    const supabase = await clientFor(tenantId);
    let query = supabase
      .from(FILES_TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("name", trimmed)
      .neq("status", "deleted");
    if (folderId === null) query = query.is("folder_id", null);
    else query = query.eq("folder_id", folderId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as FileObjectRow | null;
  } catch (err) {
    if (isMissingTableError(err, FILES_TABLE)) {
      markTableMissing(FILES_TABLE);
      return findFileByFolderAndName(tenantId, folderId, name);
    }
    throw err;
  }
}

export async function getFile(
  id: string,
  tenantId: string,
): Promise<FileObjectRow | null> {
  if (tableMissing(FILES_TABLE)) {
    const row = store().get(id);
    if (!row || row.tenant_id !== tenantId) return null;
    return row;
  }
  try {
    const supabase = await clientFor(tenantId);
    const { data, error } = await supabase
      .from(FILES_TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as FileObjectRow | null;
  } catch (err) {
    if (isMissingTableError(err, FILES_TABLE)) {
      markTableMissing(FILES_TABLE);
      return getFile(id, tenantId);
    }
    throw err;
  }
}

export type UpsertFileInput = Partial<Omit<FileObjectRow, "tenant_id">> & {
  id?: string;
  name?: string;
};

function merge(
  existing: FileObjectRow | undefined,
  tenantId: string,
  input: UpsertFileInput,
): FileObjectRow {
  const now = nowIso();
  const id = input.id ?? existing?.id ?? uuid();
  return {
    id,
    tenant_id: tenantId,
    folder_id: input.folder_id ?? existing?.folder_id ?? null,
    owner_id: input.owner_id ?? existing?.owner_id ?? null,
    name: input.name ?? existing?.name ?? "Untitled file",
    description: input.description ?? existing?.description ?? null,
    mime_type: input.mime_type ?? existing?.mime_type ?? "application/octet-stream",
    size: input.size ?? existing?.size ?? 0,
    extension: input.extension ?? existing?.extension ?? null,
    storage_key: input.storage_key ?? existing?.storage_key ?? null,
    storage_bucket: input.storage_bucket ?? existing?.storage_bucket ?? null,
    checksum: input.checksum ?? existing?.checksum ?? null,
    visibility: input.visibility ?? existing?.visibility ?? "tenant",
    status: input.status ?? existing?.status ?? "active",
    current_version_id:
      input.current_version_id ?? existing?.current_version_id ?? null,
    thumbnail_key: input.thumbnail_key ?? existing?.thumbnail_key ?? null,
    virus_scan_status:
      input.virus_scan_status ?? existing?.virus_scan_status ?? "skipped",
    signature_status: input.signature_status ?? existing?.signature_status ?? null,
    tags: input.tags ?? existing?.tags ?? [],
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

export async function upsertFile(
  tenantId: string,
  input: UpsertFileInput,
): Promise<FileObjectRow> {
  const existing = input.id ? await getFile(input.id, tenantId) : null;
  const next = merge(existing ?? undefined, tenantId, input);
  if (tableMissing(FILES_TABLE)) {
    store().set(next.id, next);
    return next;
  }
  try {
    const supabase = await clientFor(tenantId);
    const { data, error } = await supabase
      .from(FILES_TABLE)
      .upsert(next, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as FileObjectRow;
  } catch (err) {
    if (isMissingTableError(err, FILES_TABLE)) {
      markTableMissing(FILES_TABLE);
      store().set(next.id, next);
      return next;
    }
    throw err;
  }
}

export async function deleteFile(id: string, tenantId: string): Promise<void> {
  if (tableMissing(FILES_TABLE)) {
    const row = store().get(id);
    if (row && row.tenant_id === tenantId) {
      store().set(id, { ...row, status: "deleted", updated_at: nowIso() });
    }
    return;
  }
  try {
    const supabase = await clientFor(tenantId);
    const { error } = await supabase
      .from(FILES_TABLE)
      .update({ status: "deleted", updated_at: nowIso() })
      .eq("tenant_id", tenantId)
      .eq("id", id);
    if (error) throw error;
  } catch (err) {
    if (isMissingTableError(err, FILES_TABLE)) {
      markTableMissing(FILES_TABLE);
      return deleteFile(id, tenantId);
    }
    throw err;
  }
}

export async function hardDeleteFile(
  id: string,
  tenantId: string,
): Promise<void> {
  if (tableMissing(FILES_TABLE)) {
    const row = store().get(id);
    if (row && row.tenant_id === tenantId) store().delete(id);
    return;
  }
  try {
    const supabase = await clientFor(tenantId);
    const { error } = await supabase
      .from(FILES_TABLE)
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id);
    if (error) throw error;
  } catch (err) {
    if (isMissingTableError(err, FILES_TABLE)) {
      markTableMissing(FILES_TABLE);
      return hardDeleteFile(id, tenantId);
    }
    throw err;
  }
}
