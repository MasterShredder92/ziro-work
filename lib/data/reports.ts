/**
 * @data/reports facade.
 *
 * Persists saved report definitions (distinct from the built-in report
 * registry at `src/lib/reports/definitions.ts`). Falls back to an in-memory
 * tenant-scoped store when the `reports` table is absent from Supabase so
 * the UI keeps working during incremental schema rollouts.
 */

import { applyListOptions, clientFor, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

export type ReportRow = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  kind: string;
  status: "draft" | "published" | "archived";
  source: string;
  query: Record<string, unknown> | null;
  layout: Record<string, unknown> | null;
  parameters: Array<Record<string, unknown>>;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type ReportInsert = Omit<
  ReportRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ReportListFilter = {
  status?: ReportRow["status"];
  kind?: string;
  search?: string;
  includeArchived?: boolean;
};

const TABLE = "reports";

type GlobalWithStore = typeof globalThis & {
  __ziro_reports_store?: Map<string, ReportRow>;
};

function store(): Map<string, ReportRow> {
  const g = globalThis as GlobalWithStore;
  if (!g.__ziro_reports_store) g.__ziro_reports_store = new Map();
  return g.__ziro_reports_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `report_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function tenantRows(tenantId: string): ReportRow[] {
  return Array.from(store().values()).filter((r) => r.tenant_id === tenantId);
}

function applyFilter(rows: ReportRow[], filter?: ReportListFilter): ReportRow[] {
  let out = rows;
  if (!filter?.includeArchived) {
    out = out.filter((r) => r.status !== "archived");
  }
  if (filter?.status) out = out.filter((r) => r.status === filter.status);
  if (filter?.kind) out = out.filter((r) => r.kind === filter.kind);
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    out = out.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q),
    );
  }
  return out;
}

export async function listReports(
  tenantId: string,
  filter?: ReportListFilter,
  opts?: ListOptions,
): Promise<ReportRow[]> {
  if (tableMissing(TABLE)) {
    const rows = applyFilter(tenantRows(tenantId), filter).sort((a, b) =>
      a.updated_at > b.updated_at ? -1 : 1,
    );
    if (typeof opts?.limit === "number") return rows.slice(0, opts.limit);
    return rows;
  }
  const supabase = await clientFor(tenantId);
  let q = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
  if (!filter?.includeArchived) q = q.neq("status", "archived");
  if (filter?.status) q = q.eq("status", filter.status);
  if (filter?.kind) q = q.eq("kind", filter.kind);
  if (filter?.search) q = q.ilike("name", `%${filter.search}%`);
  q = applyListOptions(q, {
    orderBy: opts?.orderBy ?? "updated_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit,
    offset: opts?.offset,
  });
  const { data, error } = await q;
  if (error) {
    if (isMissingTableError(error, TABLE)) {
      markTableMissing(TABLE);
      return listReports(tenantId, filter, opts);
    }
    throw error;
  }
  return (data ?? []) as ReportRow[];
}

export async function getReport(
  id: string,
  tenantId: string,
): Promise<ReportRow | null> {
  if (tableMissing(TABLE)) {
    const r = store().get(id);
    return r && r.tenant_id === tenantId ? r : null;
  }
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error, TABLE)) {
      markTableMissing(TABLE);
      return getReport(id, tenantId);
    }
    throw error;
  }
  return (data ?? null) as ReportRow | null;
}

export async function createReport(
  tenantId: string,
  input: Omit<ReportInsert, "tenant_id" | "id" | "created_at" | "updated_at">,
): Promise<ReportRow> {
  const now = nowIso();
  const row: ReportRow = {
    id: uuid(),
    tenant_id: tenantId,
    name: input.name,
    slug: input.slug ?? null,
    description: input.description ?? null,
    kind: input.kind ?? "custom",
    status: input.status ?? "draft",
    source: input.source ?? "custom",
    query: input.query ?? null,
    layout: input.layout ?? null,
    parameters: input.parameters ?? [],
    tags: input.tags ?? [],
    is_pinned: input.is_pinned ?? false,
    created_at: now,
    updated_at: now,
    created_by: input.created_by ?? null,
    updated_by: input.updated_by ?? null,
  };

  if (tableMissing(TABLE)) {
    store().set(row.id, row);
    return row;
  }

  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select("*")
    .single();
  if (error) {
    if (isMissingTableError(error, TABLE)) {
      markTableMissing(TABLE);
      store().set(row.id, row);
      return row;
    }
    throw error;
  }
  return data as ReportRow;
}

export async function updateReport(
  id: string,
  tenantId: string,
  patch: Partial<Omit<ReportRow, "id" | "tenant_id" | "created_at">>,
): Promise<ReportRow | null> {
  const next: Partial<ReportRow> = { ...patch, updated_at: nowIso() };

  if (tableMissing(TABLE)) {
    const existing = store().get(id);
    if (!existing || existing.tenant_id !== tenantId) return null;
    const merged = { ...existing, ...next } as ReportRow;
    store().set(id, merged);
    return merged;
  }

  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .update(next)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error, TABLE)) {
      markTableMissing(TABLE);
      return updateReport(id, tenantId, patch);
    }
    throw error;
  }
  return (data ?? null) as ReportRow | null;
}

export async function deleteReport(
  id: string,
  tenantId: string,
): Promise<boolean> {
  if (tableMissing(TABLE)) {
    const existing = store().get(id);
    if (!existing || existing.tenant_id !== tenantId) return false;
    store().delete(id);
    return true;
  }
  const supabase = await clientFor(tenantId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) {
    if (isMissingTableError(error, TABLE)) {
      markTableMissing(TABLE);
      return deleteReport(id, tenantId);
    }
    throw error;
  }
  return true;
}
