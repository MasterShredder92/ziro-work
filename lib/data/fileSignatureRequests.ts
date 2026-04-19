import { clientFor, serviceClient } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing } from "./_missingTable";

export type FileSignatureRequestRow = {
  id: string;
  tenant_id: string;
  file_id: string;
  title: string;
  message: string | null;
  status:
    | "pending"
    | "viewed"
    | "signed"
    | "completed"
    | "declined"
    | "expired";
  signers: Array<Record<string, unknown>>;
  fields: Array<Record<string, unknown>>;
  audit: Array<Record<string, unknown>>;
  certificate_key: string | null;
  completed_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const TABLE = "file_signature_requests";

type GlobalStore = typeof globalThis & {
  __ziro_file_signature_requests?: Map<string, FileSignatureRequestRow>;
};

function store(): Map<string, FileSignatureRequestRow> {
  const g = globalThis as GlobalStore;
  if (!g.__ziro_file_signature_requests)
    g.__ziro_file_signature_requests = new Map();
  return g.__ziro_file_signature_requests;
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `sig_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function listSignatureRequests(
  tenantId: string,
  filter?: { fileId?: string; status?: FileSignatureRequestRow["status"] },
): Promise<FileSignatureRequestRow[]> {
  if (tableMissing(TABLE)) {
    const out: FileSignatureRequestRow[] = [];
    for (const row of store().values()) {
      if (row.tenant_id !== tenantId) continue;
      if (filter?.fileId && row.file_id !== filter.fileId) continue;
      if (filter?.status && row.status !== filter.status) continue;
      out.push(row);
    }
    return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  try {
    const supabase = clientFor(tenantId);
    let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
    if (filter?.fileId) query = query.eq("file_id", filter.fileId);
    if (filter?.status) query = query.eq("status", filter.status);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as FileSignatureRequestRow[];
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return listSignatureRequests(tenantId, filter);
    }
    throw err;
  }
}

export async function getSignatureRequest(
  id: string,
  tenantId: string,
): Promise<FileSignatureRequestRow | null> {
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
    return (data ?? null) as unknown as FileSignatureRequestRow | null;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return getSignatureRequest(id, tenantId);
    }
    throw err;
  }
}

export async function getSignatureRequestBySignerToken(
  token: string,
): Promise<FileSignatureRequestRow | null> {
  if (tableMissing(TABLE)) {
    for (const row of store().values()) {
      const signers = row.signers as Array<{ token?: string }>;
      if (signers.some((s) => s?.token === token)) return row;
    }
    return null;
  }
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .contains("signers", JSON.stringify([{ token }]));
    if (error) throw error;
    const rows = (data ?? []) as unknown as FileSignatureRequestRow[];
    return rows[0] ?? null;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return getSignatureRequestBySignerToken(token);
    }
    throw err;
  }
}

export type UpsertSignatureRequestInput = Partial<
  Omit<FileSignatureRequestRow, "tenant_id">
> & { id?: string; file_id?: string; title?: string };

function merge(
  existing: FileSignatureRequestRow | undefined,
  tenantId: string,
  input: UpsertSignatureRequestInput,
): FileSignatureRequestRow {
  const now = nowIso();
  const id = input.id ?? existing?.id ?? uuid();
  return {
    id,
    tenant_id: tenantId,
    file_id: input.file_id ?? existing?.file_id ?? "",
    title: input.title ?? existing?.title ?? "Signature request",
    message: input.message ?? existing?.message ?? null,
    status: input.status ?? existing?.status ?? "pending",
    signers: input.signers ?? existing?.signers ?? [],
    fields: input.fields ?? existing?.fields ?? [],
    audit: input.audit ?? existing?.audit ?? [],
    certificate_key: input.certificate_key ?? existing?.certificate_key ?? null,
    completed_at: input.completed_at ?? existing?.completed_at ?? null,
    expires_at: input.expires_at ?? existing?.expires_at ?? null,
    created_by: input.created_by ?? existing?.created_by ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

export async function upsertSignatureRequest(
  tenantId: string,
  input: UpsertSignatureRequestInput,
): Promise<FileSignatureRequestRow> {
  const existing = input.id ? await getSignatureRequest(input.id, tenantId) : null;
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
    return data as unknown as FileSignatureRequestRow;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      store().set(next.id, next);
      return next;
    }
    throw err;
  }
}

export async function deleteSignatureRequest(
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
      return deleteSignatureRequest(id, tenantId);
    }
    throw err;
  }
}
