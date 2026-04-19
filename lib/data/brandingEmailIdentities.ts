import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "branding_email_identities";

export type EmailIdentityStatus =
  | "pending"
  | "verifying"
  | "verified"
  | "failed";

export type BrandingEmailIdentityRow = {
  id: string;
  tenant_id: string;
  from_name: string;
  from_email: string;
  reply_to_email: string | null;
  status: EmailIdentityStatus;
  verified_at: string | null;
  last_tested_at: string | null;
  failure_reason: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_branding_email_identities_store?: Map<string, BrandingEmailIdentityRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, BrandingEmailIdentityRow> {
  if (!g.__ziro_branding_email_identities_store)
    g.__ziro_branding_email_identities_store = new Map();
  return g.__ziro_branding_email_identities_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `eid_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function normalizeEmail(input: string): string {
  return String(input ?? "").trim().toLowerCase();
}

function normalizeRow(
  input: Partial<BrandingEmailIdentityRow>,
): BrandingEmailIdentityRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    from_name: String(input.from_name ?? "Workspace"),
    from_email: normalizeEmail(input.from_email ?? "noreply@ziro.work"),
    reply_to_email: input.reply_to_email ? normalizeEmail(input.reply_to_email) : null,
    status: (input.status ?? "pending") as EmailIdentityStatus,
    verified_at: input.verified_at ?? null,
    last_tested_at: input.last_tested_at ?? null,
    failure_reason: input.failure_reason ?? null,
    is_primary: input.is_primary ?? false,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export async function listBrandingEmailIdentities(
  tenantId: string,
  opts?: ListOptions,
): Promise<BrandingEmailIdentityRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "updated_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 100,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return (data ?? []) as BrandingEmailIdentityRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  return Array.from(store().values())
    .filter((r) => r.tenant_id === tenantId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getPrimaryBrandingEmailIdentity(
  tenantId: string,
): Promise<BrandingEmailIdentityRow | null> {
  const rows = await listBrandingEmailIdentities(tenantId);
  return rows.find((r) => r.is_primary) ?? rows[0] ?? null;
}

export async function getBrandingEmailIdentity(
  id: string,
  tenantId?: string,
): Promise<BrandingEmailIdentityRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", id);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as BrandingEmailIdentityRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const row = store().get(id) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertBrandingEmailIdentity(
  tenantId: string,
  input: Partial<BrandingEmailIdentityRow>,
): Promise<BrandingEmailIdentityRow> {
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
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) {
        store().set(row.id, data as BrandingEmailIdentityRow);
        return data as BrandingEmailIdentityRow;
      }
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

export async function deleteBrandingEmailIdentity(
  id: string,
  tenantId: string,
): Promise<boolean> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (!error) {
        store().delete(id);
        return true;
      }
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const existing = store().get(id);
  if (existing && existing.tenant_id === tenantId) {
    store().delete(id);
    return true;
  }
  return false;
}
