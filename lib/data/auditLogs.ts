import { clientFor } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "audit_logs";

export type AuditLogRow = {
  id: string;
  tenant_id: string;
  event: string;
  category: string | null;
  actor_id: string | null;
  actor_role: string | null;
  actor_ip: string | null;
  target_type: string | null;
  target_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  diff: Array<Record<string, unknown>> | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

type GlobalWithStore = typeof globalThis & {
  __ziro_audit_logs_store?: Map<string, AuditLogRow>;
};

function store(): Map<string, AuditLogRow> {
  const g = globalThis as GlobalWithStore;
  if (!g.__ziro_audit_logs_store) g.__ziro_audit_logs_store = new Map();
  return g.__ziro_audit_logs_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `aud_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export type AuditLogFilter = {
  event?: string;
  category?: string;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  since?: string;
  until?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type InsertAuditLogInput = Omit<
  AuditLogRow,
  "id" | "tenant_id" | "created_at"
> & {
  id?: string;
  created_at?: string;
};

function matches(row: AuditLogRow, filter: AuditLogFilter): boolean {
  if (filter.event && row.event !== filter.event) return false;
  if (filter.category && row.category !== filter.category) return false;
  if (filter.actorId && row.actor_id !== filter.actorId) return false;
  if (filter.targetType && row.target_type !== filter.targetType) return false;
  if (filter.targetId && row.target_id !== filter.targetId) return false;
  if (filter.since && row.created_at < filter.since) return false;
  if (filter.until && row.created_at > filter.until) return false;
  if (filter.search) {
    const s = filter.search.toLowerCase();
    const hay = `${row.event} ${row.category ?? ""} ${row.target_type ?? ""} ${
      row.target_id ?? ""
    }`.toLowerCase();
    if (!hay.includes(s)) return false;
  }
  return true;
}

function listFromStore(
  tenantId: string,
  filter?: AuditLogFilter,
): AuditLogRow[] {
  const rows: AuditLogRow[] = [];
  for (const row of store().values()) {
    if (row.tenant_id !== tenantId) continue;
    if (filter && !matches(row, filter)) continue;
    rows.push(row);
  }
  rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const limit = filter?.limit ?? 200;
  const offset = filter?.offset ?? 0;
  return rows.slice(offset, offset + limit);
}

export async function listAuditLogs(
  tenantId: string,
  filter?: AuditLogFilter,
): Promise<AuditLogRow[]> {
  if (tableMissing(TABLE)) return listFromStore(tenantId, filter);
  try {
    const supabase = await clientFor(tenantId);
    let query = supabase
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId);
    if (filter?.event) query = query.eq("event", filter.event);
    if (filter?.category) query = query.eq("category", filter.category);
    if (filter?.actorId) query = query.eq("actor_id", filter.actorId);
    if (filter?.targetType) query = query.eq("target_type", filter.targetType);
    if (filter?.targetId) query = query.eq("target_id", filter.targetId);
    if (filter?.since) query = query.gte("created_at", filter.since);
    if (filter?.until) query = query.lte("created_at", filter.until);
    query = query.order("created_at", { ascending: false });
    const limit = filter?.limit ?? 200;
    const offset = filter?.offset ?? 0;
    if (typeof limit === "number") {
      query = query.range(offset, offset + Math.max(0, limit - 1));
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as AuditLogRow[];
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return listFromStore(tenantId, filter);
    }
    throw err;
  }
}

export async function insertAuditLog(
  tenantId: string,
  input: InsertAuditLogInput,
): Promise<AuditLogRow> {
  const row: AuditLogRow = {
    id: input.id ?? uuid(),
    tenant_id: tenantId,
    event: input.event,
    category: input.category ?? null,
    actor_id: input.actor_id ?? null,
    actor_role: input.actor_role ?? null,
    actor_ip: input.actor_ip ?? null,
    target_type: input.target_type ?? null,
    target_id: input.target_id ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
    diff: input.diff ?? null,
    payload: input.payload ?? null,
    created_at: input.created_at ?? nowIso(),
  };

  if (tableMissing(TABLE)) {
    store().set(row.id, row);
    return row;
  }
  try {
    const supabase = await clientFor(tenantId);
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as AuditLogRow;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      store().set(row.id, row);
      return row;
    }
    throw err;
  }
}

export async function purgeOlderThan(
  tenantId: string,
  before: string,
): Promise<number> {
  if (tableMissing(TABLE)) {
    let removed = 0;
    for (const [id, row] of store().entries()) {
      if (row.tenant_id === tenantId && row.created_at < before) {
        store().delete(id);
        removed += 1;
      }
    }
    return removed;
  }
  try {
    const supabase = await clientFor(tenantId);
    const { error, count } = await supabase
      .from(TABLE)
      .delete({ count: "exact" })
      .eq("tenant_id", tenantId)
      .lt("created_at", before);
    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return purgeOlderThan(tenantId, before);
    }
    throw err;
  }
}
