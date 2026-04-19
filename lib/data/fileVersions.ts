import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing } from "./_missingTable";

export type FileVersionRow = {
  id: string;
  tenant_id: string;
  file_id: string;
  version: number;
  storage_key: string;
  storage_bucket: string | null;
  size: number;
  mime_type: string;
  checksum: string | null;
  uploaded_by: string | null;
  notes: string | null;
  created_at: string;
};

const TABLE = "file_versions";

type GlobalStore = typeof globalThis & {
  __ziro_file_versions?: Map<string, FileVersionRow>;
};

function store(): Map<string, FileVersionRow> {
  const g = globalThis as GlobalStore;
  if (!g.__ziro_file_versions) g.__ziro_file_versions = new Map();
  return g.__ziro_file_versions;
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `fver_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function listFromStore(fileId: string, tenantId: string): FileVersionRow[] {
  const out: FileVersionRow[] = [];
  for (const row of store().values()) {
    if (row.tenant_id === tenantId && row.file_id === fileId) out.push(row);
  }
  return out.sort((a, b) => b.version - a.version);
}

export async function listFileVersions(
  fileId: string,
  tenantId: string,
): Promise<FileVersionRow[]> {
  if (tableMissing(TABLE)) return listFromStore(fileId, tenantId);
  try {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("file_id", fileId)
      .order("version", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as FileVersionRow[];
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return listFromStore(fileId, tenantId);
    }
    throw err;
  }
}

export async function getFileVersion(
  id: string,
  tenantId: string,
): Promise<FileVersionRow | null> {
  if (tableMissing(TABLE)) {
    const row = store().get(id);
    if (!row || row.tenant_id !== tenantId) return null;
    return row;
  }
  try {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as FileVersionRow | null;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return getFileVersion(id, tenantId);
    }
    throw err;
  }
}

export type CreateFileVersionInput = {
  id?: string;
  file_id: string;
  version?: number;
  storage_key: string;
  storage_bucket?: string | null;
  size: number;
  mime_type: string;
  checksum?: string | null;
  uploaded_by?: string | null;
  notes?: string | null;
};

export async function createFileVersion(
  tenantId: string,
  input: CreateFileVersionInput,
): Promise<FileVersionRow> {
  const existing = await listFileVersions(input.file_id, tenantId);
  const nextVersion =
    input.version ??
    (existing.length > 0 ? Math.max(...existing.map((r) => r.version)) + 1 : 1);
  const next: FileVersionRow = {
    id: input.id ?? uuid(),
    tenant_id: tenantId,
    file_id: input.file_id,
    version: nextVersion,
    storage_key: input.storage_key,
    storage_bucket: input.storage_bucket ?? null,
    size: input.size,
    mime_type: input.mime_type,
    checksum: input.checksum ?? null,
    uploaded_by: input.uploaded_by ?? null,
    notes: input.notes ?? null,
    created_at: nowIso(),
  };
  if (tableMissing(TABLE)) {
    store().set(next.id, next);
    return next;
  }
  try {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from(TABLE)
      .insert(next)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as FileVersionRow;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      store().set(next.id, next);
      return next;
    }
    throw err;
  }
}

export async function deleteFileVersion(
  id: string,
  tenantId: string,
): Promise<void> {
  if (tableMissing(TABLE)) {
    const row = store().get(id);
    if (row && row.tenant_id === tenantId) store().delete(id);
    return;
  }
  try {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id);
    if (error) throw error;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return deleteFileVersion(id, tenantId);
    }
    throw err;
  }
}
