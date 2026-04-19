import { clientFor } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "feature_flags";

export type FeatureFlagRow = {
  id: string;
  tenant_id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rollout_percent: number;
  target_roles: string[];
  target_profile_ids: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

type GlobalWithStore = typeof globalThis & {
  __ziro_feature_flags_store?: Map<string, FeatureFlagRow>;
};

function store(): Map<string, FeatureFlagRow> {
  const g = globalThis as GlobalWithStore;
  if (!g.__ziro_feature_flags_store) g.__ziro_feature_flags_store = new Map();
  return g.__ziro_feature_flags_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `flag_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export type UpsertFeatureFlagInput = {
  id?: string;
  key: string;
  name?: string;
  description?: string | null;
  enabled?: boolean;
  rollout_percent?: number;
  target_roles?: string[];
  target_profile_ids?: string[];
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  updated_by?: string | null;
};

function merge(
  existing: FeatureFlagRow | undefined,
  tenantId: string,
  input: UpsertFeatureFlagInput,
): FeatureFlagRow {
  const id = input.id ?? existing?.id ?? uuid();
  const now = nowIso();
  const key = input.key.trim();
  return {
    id,
    tenant_id: tenantId,
    key,
    name: input.name ?? existing?.name ?? key,
    description: input.description ?? existing?.description ?? null,
    enabled: input.enabled ?? existing?.enabled ?? false,
    rollout_percent:
      typeof input.rollout_percent === "number"
        ? Math.max(0, Math.min(100, input.rollout_percent))
        : existing?.rollout_percent ?? 100,
    target_roles: input.target_roles ?? existing?.target_roles ?? [],
    target_profile_ids:
      input.target_profile_ids ?? existing?.target_profile_ids ?? [],
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

function listFromStore(tenantId: string): FeatureFlagRow[] {
  const out: FeatureFlagRow[] = [];
  for (const row of store().values()) {
    if (row.tenant_id !== tenantId) continue;
    out.push(row);
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

export async function listFeatureFlags(
  tenantId: string,
): Promise<FeatureFlagRow[]> {
  if (tableMissing(TABLE)) return listFromStore(tenantId);
  try {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("key", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as FeatureFlagRow[];
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return listFromStore(tenantId);
    }
    throw err;
  }
}

export async function getFeatureFlag(
  id: string,
  tenantId: string,
): Promise<FeatureFlagRow | null> {
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
    return (data ?? null) as unknown as FeatureFlagRow | null;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return getFeatureFlag(id, tenantId);
    }
    throw err;
  }
}

export async function getFeatureFlagByKey(
  key: string,
  tenantId: string,
): Promise<FeatureFlagRow | null> {
  if (tableMissing(TABLE)) {
    for (const row of store().values()) {
      if (row.tenant_id === tenantId && row.key === key) return row;
    }
    return null;
  }
  try {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as FeatureFlagRow | null;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return getFeatureFlagByKey(key, tenantId);
    }
    throw err;
  }
}

export async function upsertFeatureFlag(
  tenantId: string,
  input: UpsertFeatureFlagInput,
): Promise<FeatureFlagRow> {
  const existing = input.id
    ? await getFeatureFlag(input.id, tenantId)
    : await getFeatureFlagByKey(input.key, tenantId);
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
    return data as unknown as FeatureFlagRow;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      store().set(next.id, next);
      return next;
    }
    throw err;
  }
}

export async function deleteFeatureFlag(
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
      return deleteFeatureFlag(id, tenantId);
    }
    throw err;
  }
}
