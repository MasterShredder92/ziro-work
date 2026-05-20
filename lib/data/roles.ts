import { clientFor } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "roles";

export type RoleRow = {
  id: string;
  tenant_id: string;
  key: string;
  name: string;
  description: string | null;
  base_role: "admin" | "director" | "teacher" | "student" | "family" | null;
  is_system: boolean;
  is_custom: boolean;
  permissions: string[];
  inherits_from: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

type GlobalWithStore = typeof globalThis & {
  __ziro_roles_store?: Map<string, RoleRow>;
};

function store(): Map<string, RoleRow> {
  const g = globalThis as GlobalWithStore;
  if (!g.__ziro_roles_store) g.__ziro_roles_store = new Map();
  return g.__ziro_roles_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `role_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export type RoleListFilter = {
  includeSystem?: boolean;
  includeCustom?: boolean;
  search?: string;
};

export type UpsertRoleInput = {
  id?: string;
  key?: string;
  name?: string;
  description?: string | null;
  base_role?: RoleRow["base_role"];
  is_system?: boolean;
  is_custom?: boolean;
  permissions?: string[];
  inherits_from?: string | null;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  updated_by?: string | null;
};

function mergeRole(
  existing: RoleRow | undefined,
  tenantId: string,
  input: UpsertRoleInput,
): RoleRow {
  const id = input.id ?? existing?.id ?? uuid();
  const now = nowIso();
  const key = (input.key ?? existing?.key ?? id).trim();
  return {
    id,
    tenant_id: tenantId,
    key,
    name: input.name ?? existing?.name ?? key,
    description: input.description ?? existing?.description ?? null,
    base_role: input.base_role ?? existing?.base_role ?? null,
    is_system: input.is_system ?? existing?.is_system ?? false,
    is_custom: input.is_custom ?? existing?.is_custom ?? !existing?.is_system,
    permissions: input.permissions ?? existing?.permissions ?? [],
    inherits_from: input.inherits_from ?? existing?.inherits_from ?? null,
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

function listFromStore(tenantId: string, filter?: RoleListFilter): RoleRow[] {
  const out: RoleRow[] = [];
  for (const row of store().values()) {
    if (row.tenant_id !== tenantId) continue;
    if (filter?.includeSystem === false && row.is_system) continue;
    if (filter?.includeCustom === false && row.is_custom) continue;
    if (filter?.search && filter.search.trim()) {
      const s = filter.search.trim().toLowerCase();
      if (
        !row.name.toLowerCase().includes(s) &&
        !row.key.toLowerCase().includes(s)
      )
        continue;
    }
    out.push(row);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listRoles(
  tenantId: string,
  filter?: RoleListFilter,
): Promise<RoleRow[]> {
  if (tableMissing(TABLE)) return listFromStore(tenantId, filter);
  try {
    const supabase = await clientFor(tenantId);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as RoleRow[];
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return listFromStore(tenantId, filter);
    }
    throw err;
  }
}

export async function getRole(
  id: string,
  tenantId: string,
): Promise<RoleRow | null> {
  if (tableMissing(TABLE)) {
    const row = store().get(id);
    return row && row.tenant_id === tenantId ? row : null;
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
    return (data ?? null) as unknown as RoleRow | null;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return getRole(id, tenantId);
    }
    throw err;
  }
}

export async function getRoleByKey(
  key: string,
  tenantId: string,
): Promise<RoleRow | null> {
  if (tableMissing(TABLE)) {
    for (const row of store().values()) {
      if (row.tenant_id === tenantId && row.key === key) return row;
    }
    return null;
  }
  try {
    const supabase = await clientFor(tenantId);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as RoleRow | null;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return getRoleByKey(key, tenantId);
    }
    throw err;
  }
}

export async function upsertRole(
  tenantId: string,
  input: UpsertRoleInput,
): Promise<RoleRow> {
  const existing = input.id ? await getRole(input.id, tenantId) : null;
  const next = mergeRole(existing ?? undefined, tenantId, input);
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
    return data as unknown as RoleRow;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      store().set(next.id, next);
      return next;
    }
    throw err;
  }
}

export async function deleteRole(
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
      return deleteRole(id, tenantId);
    }
    throw err;
  }
}
