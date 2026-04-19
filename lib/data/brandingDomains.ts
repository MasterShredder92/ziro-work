import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "branding_domains";

export type BrandingDomainStatus =
  | "pending"
  | "verifying"
  | "verified"
  | "active"
  | "failed";

export type BrandingDomainRow = {
  id: string;
  tenant_id: string;
  domain_name: string;
  status: BrandingDomainStatus;
  verification_token: string;
  verification_target: string | null;
  is_primary: boolean;
  verified_at: string | null;
  last_checked_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_branding_domains_store?: Map<string, BrandingDomainRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, BrandingDomainRow> {
  if (!g.__ziro_branding_domains_store) g.__ziro_branding_domains_store = new Map();
  return g.__ziro_branding_domains_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `dom_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function newToken(): string {
  const bytes = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256),
  );
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function normalizeDomainName(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

function normalizeRow(input: Partial<BrandingDomainRow>): BrandingDomainRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    domain_name: normalizeDomainName(input.domain_name ?? ""),
    status: (input.status ?? "pending") as BrandingDomainStatus,
    verification_token: input.verification_token ?? newToken(),
    verification_target: input.verification_target ?? "cname.ziro.work",
    is_primary: input.is_primary ?? false,
    verified_at: input.verified_at ?? null,
    last_checked_at: input.last_checked_at ?? null,
    failure_reason: input.failure_reason ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export async function listBrandingDomains(
  tenantId: string,
  opts?: ListOptions,
): Promise<BrandingDomainRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "updated_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 200,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return (data ?? []) as BrandingDomainRow[];
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

export async function getBrandingDomain(
  id: string,
  tenantId?: string,
): Promise<BrandingDomainRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", id);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as BrandingDomainRow | null;
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

export async function getBrandingDomainByName(
  domainName: string,
  tenantId?: string,
): Promise<BrandingDomainRow | null> {
  const normalized = normalizeDomainName(domainName);
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase
        .from(TABLE)
        .select("*")
        .eq("domain_name", normalized);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as BrandingDomainRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  for (const row of store().values()) {
    if (row.domain_name !== normalized) continue;
    if (tenantId && row.tenant_id !== tenantId) continue;
    return row;
  }
  return null;
}

export async function upsertBrandingDomain(
  tenantId: string,
  input: Partial<BrandingDomainRow> & { domain_name: string },
): Promise<BrandingDomainRow> {
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
        store().set(row.id, data as BrandingDomainRow);
        return data as BrandingDomainRow;
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

export async function deleteBrandingDomain(
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
