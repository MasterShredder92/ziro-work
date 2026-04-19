import { clientFor, serviceClient } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing } from "./_missingTable";

export type FileShareLinkRow = {
  id: string;
  tenant_id: string;
  file_id: string | null;
  folder_id: string | null;
  token: string;
  status: "active" | "revoked" | "expired";
  password_hash: string | null;
  expires_at: string | null;
  max_views: number | null;
  view_count: number;
  allow_download: boolean;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const TABLE = "file_share_links";

type GlobalStore = typeof globalThis & {
  __ziro_file_share_links?: Map<string, FileShareLinkRow>;
};

function store(): Map<string, FileShareLinkRow> {
  const g = globalThis as GlobalStore;
  if (!g.__ziro_file_share_links) g.__ziro_file_share_links = new Map();
  return g.__ziro_file_share_links;
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `share_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function listShareLinks(
  tenantId: string,
  filter?: { fileId?: string; folderId?: string; status?: FileShareLinkRow["status"] },
): Promise<FileShareLinkRow[]> {
  if (tableMissing(TABLE)) {
    const out: FileShareLinkRow[] = [];
    for (const row of store().values()) {
      if (row.tenant_id !== tenantId) continue;
      if (filter?.fileId && row.file_id !== filter.fileId) continue;
      if (filter?.folderId && row.folder_id !== filter.folderId) continue;
      if (filter?.status && row.status !== filter.status) continue;
      out.push(row);
    }
    return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  try {
    const supabase = clientFor(tenantId);
    let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
    if (filter?.fileId) query = query.eq("file_id", filter.fileId);
    if (filter?.folderId) query = query.eq("folder_id", filter.folderId);
    if (filter?.status) query = query.eq("status", filter.status);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as FileShareLinkRow[];
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return listShareLinks(tenantId, filter);
    }
    throw err;
  }
}

export async function getShareLink(
  id: string,
  tenantId: string,
): Promise<FileShareLinkRow | null> {
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
    return (data ?? null) as unknown as FileShareLinkRow | null;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return getShareLink(id, tenantId);
    }
    throw err;
  }
}

export async function getShareLinkByToken(
  token: string,
): Promise<FileShareLinkRow | null> {
  if (tableMissing(TABLE)) {
    for (const row of store().values()) {
      if (row.token === token) return row;
    }
    return null;
  }
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as FileShareLinkRow | null;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return getShareLinkByToken(token);
    }
    throw err;
  }
}

export type UpsertShareLinkInput = Partial<Omit<FileShareLinkRow, "tenant_id">> & {
  id?: string;
  token?: string;
  metadata?: Record<string, unknown> | null;
};

function merge(
  existing: FileShareLinkRow | undefined,
  tenantId: string,
  input: UpsertShareLinkInput,
): FileShareLinkRow {
  const now = nowIso();
  const id = input.id ?? existing?.id ?? uuid();
  const token = input.token ?? existing?.token ?? uuid().replace(/[^a-z0-9]/gi, "").slice(0, 32);
  return {
    id,
    tenant_id: tenantId,
    file_id: input.file_id ?? existing?.file_id ?? null,
    folder_id: input.folder_id ?? existing?.folder_id ?? null,
    token,
    status: input.status ?? existing?.status ?? "active",
    password_hash: input.password_hash ?? existing?.password_hash ?? null,
    expires_at: input.expires_at ?? existing?.expires_at ?? null,
    max_views: input.max_views ?? existing?.max_views ?? null,
    view_count: input.view_count ?? existing?.view_count ?? 0,
    allow_download:
      input.allow_download ?? existing?.allow_download ?? true,
    metadata:
      input.metadata !== undefined
        ? (input.metadata ?? {})
        : (existing?.metadata ?? {}),
    created_by: input.created_by ?? existing?.created_by ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

export async function upsertShareLink(
  tenantId: string,
  input: UpsertShareLinkInput,
): Promise<FileShareLinkRow> {
  const existing = input.id ? await getShareLink(input.id, tenantId) : null;
  const next = merge(existing ?? undefined, tenantId, input);
  if (tableMissing(TABLE)) {
    store().set(next.id, next);
    return next;
  }
  try {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(next, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as FileShareLinkRow;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      store().set(next.id, next);
      return next;
    }
    throw err;
  }
}

export async function incrementShareLinkViewCount(
  id: string,
  tenantId: string,
): Promise<FileShareLinkRow | null> {
  const existing = await getShareLink(id, tenantId);
  if (!existing) return null;
  return upsertShareLink(tenantId, {
    id,
    view_count: existing.view_count + 1,
  });
}

export async function revokeShareLink(
  id: string,
  tenantId: string,
): Promise<void> {
  await upsertShareLink(tenantId, { id, status: "revoked" });
}

export async function deleteShareLink(
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
      return deleteShareLink(id, tenantId);
    }
    throw err;
  }
}
