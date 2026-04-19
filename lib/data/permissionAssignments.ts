import { clientFor } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "permission_assignments";

export type PermissionAssignmentRow = {
  id: string;
  tenant_id: string;
  profile_id: string;
  role_id: string | null;
  permission_key: string;
  granted: boolean;
  reason: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

type GlobalWithStore = typeof globalThis & {
  __ziro_permission_assignments_store?: Map<string, PermissionAssignmentRow>;
};

function store(): Map<string, PermissionAssignmentRow> {
  const g = globalThis as GlobalWithStore;
  if (!g.__ziro_permission_assignments_store) {
    g.__ziro_permission_assignments_store = new Map();
  }
  return g.__ziro_permission_assignments_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `pa_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export type PermissionAssignmentFilter = {
  profileId?: string;
  roleId?: string;
  permissionKey?: string;
};

export type UpsertPermissionAssignmentInput = {
  id?: string;
  profile_id: string;
  role_id?: string | null;
  permission_key: string;
  granted?: boolean;
  reason?: string | null;
  expires_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
};

function merge(
  existing: PermissionAssignmentRow | undefined,
  tenantId: string,
  input: UpsertPermissionAssignmentInput,
): PermissionAssignmentRow {
  const now = nowIso();
  return {
    id: input.id ?? existing?.id ?? uuid(),
    tenant_id: tenantId,
    profile_id: input.profile_id,
    role_id: input.role_id ?? existing?.role_id ?? null,
    permission_key: input.permission_key,
    granted: input.granted ?? existing?.granted ?? true,
    reason: input.reason ?? existing?.reason ?? null,
    expires_at: input.expires_at ?? existing?.expires_at ?? null,
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

function listFromStore(
  tenantId: string,
  filter?: PermissionAssignmentFilter,
): PermissionAssignmentRow[] {
  const out: PermissionAssignmentRow[] = [];
  for (const row of store().values()) {
    if (row.tenant_id !== tenantId) continue;
    if (filter?.profileId && row.profile_id !== filter.profileId) continue;
    if (filter?.roleId && row.role_id !== filter.roleId) continue;
    if (filter?.permissionKey && row.permission_key !== filter.permissionKey)
      continue;
    out.push(row);
  }
  return out.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function listPermissionAssignments(
  tenantId: string,
  filter?: PermissionAssignmentFilter,
): Promise<PermissionAssignmentRow[]> {
  if (tableMissing(TABLE)) return listFromStore(tenantId, filter);
  try {
    const supabase = clientFor(tenantId);
    let query = supabase
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId);
    if (filter?.profileId) query = query.eq("profile_id", filter.profileId);
    if (filter?.roleId) query = query.eq("role_id", filter.roleId);
    if (filter?.permissionKey)
      query = query.eq("permission_key", filter.permissionKey);
    const { data, error } = await query.order("updated_at", {
      ascending: false,
    });
    if (error) throw error;
    return (data ?? []) as unknown as PermissionAssignmentRow[];
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return listFromStore(tenantId, filter);
    }
    throw err;
  }
}

export async function getPermissionAssignment(
  id: string,
  tenantId: string,
): Promise<PermissionAssignmentRow | null> {
  if (tableMissing(TABLE)) {
    const row = store().get(id);
    return row && row.tenant_id === tenantId ? row : null;
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
    return (data ?? null) as unknown as PermissionAssignmentRow | null;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return getPermissionAssignment(id, tenantId);
    }
    throw err;
  }
}

export async function upsertPermissionAssignment(
  tenantId: string,
  input: UpsertPermissionAssignmentInput,
): Promise<PermissionAssignmentRow> {
  const existing = input.id
    ? await getPermissionAssignment(input.id, tenantId)
    : null;
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
    return data as unknown as PermissionAssignmentRow;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      store().set(next.id, next);
      return next;
    }
    throw err;
  }
}

export async function deletePermissionAssignment(
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
      return deletePermissionAssignment(id, tenantId);
    }
    throw err;
  }
}
