/**
 * @data/reportExportJobs facade.
 *
 * Tracks long-running export jobs (CSV / XLSX / PDF) so the UI can poll
 * for status and download results. Falls back to an in-memory tenant
 * store when the `report_export_jobs` table is absent.
 */

import { applyListOptions, clientFor, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

export type ExportJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "expired";

export type ExportJobFormat = "csv" | "xlsx" | "pdf";

export type ReportExportJobRow = {
  id: string;
  tenant_id: string;
  report_id: string | null;
  format: ExportJobFormat;
  status: ExportJobStatus;
  filename: string;
  content_type: string;
  size_bytes: number;
  params: Record<string, unknown> | null;
  error: string | null;
  content_base64: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  expires_at: string | null;
  created_by: string | null;
};

export type ReportExportJobInsert = Omit<
  ReportExportJobRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

const TABLE = "report_export_jobs";

type GlobalWithStore = typeof globalThis & {
  __ziro_report_export_jobs_store?: Map<string, ReportExportJobRow>;
};

function store(): Map<string, ReportExportJobRow> {
  const g = globalThis as GlobalWithStore;
  if (!g.__ziro_report_export_jobs_store)
    g.__ziro_report_export_jobs_store = new Map();
  return g.__ziro_report_export_jobs_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `exp_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export async function listExportJobs(
  tenantId: string,
  filter?: { reportId?: string; status?: ExportJobStatus },
  opts?: ListOptions,
): Promise<ReportExportJobRow[]> {
  if (tableMissing(TABLE)) {
    let rows = Array.from(store().values()).filter(
      (r) => r.tenant_id === tenantId,
    );
    if (filter?.reportId) rows = rows.filter((r) => r.report_id === filter.reportId);
    if (filter?.status) rows = rows.filter((r) => r.status === filter.status);
    rows.sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
    if (typeof opts?.limit === "number") return rows.slice(0, opts.limit);
    return rows;
  }
  const supabase = await clientFor(tenantId);
  let q = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
  if (filter?.reportId) q = q.eq("report_id", filter.reportId);
  if (filter?.status) q = q.eq("status", filter.status);
  q = applyListOptions(q, {
    orderBy: opts?.orderBy ?? "created_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit,
    offset: opts?.offset,
  });
  const { data, error } = await q;
  if (error) {
    if (isMissingTableError(error, TABLE)) {
      markTableMissing(TABLE);
      return listExportJobs(tenantId, filter, opts);
    }
    throw error;
  }
  return (data ?? []) as ReportExportJobRow[];
}

export async function getExportJob(
  id: string,
  tenantId: string,
): Promise<ReportExportJobRow | null> {
  if (tableMissing(TABLE)) {
    const j = store().get(id);
    return j && j.tenant_id === tenantId ? j : null;
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
      return getExportJob(id, tenantId);
    }
    throw error;
  }
  return (data ?? null) as ReportExportJobRow | null;
}

export async function createExportJob(
  tenantId: string,
  input: Omit<ReportExportJobInsert, "tenant_id">,
): Promise<ReportExportJobRow> {
  const now = nowIso();
  const row: ReportExportJobRow = {
    id: input.id ?? uuid(),
    tenant_id: tenantId,
    report_id: input.report_id ?? null,
    format: input.format,
    status: input.status ?? "pending",
    filename: input.filename,
    content_type: input.content_type,
    size_bytes: input.size_bytes ?? 0,
    params: input.params ?? null,
    error: input.error ?? null,
    content_base64: input.content_base64 ?? null,
    created_at: input.created_at ?? now,
    updated_at: now,
    completed_at: input.completed_at ?? null,
    expires_at: input.expires_at ?? null,
    created_by: input.created_by ?? null,
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
  return data as ReportExportJobRow;
}

export async function updateExportJob(
  id: string,
  tenantId: string,
  patch: Partial<Omit<ReportExportJobRow, "id" | "tenant_id" | "created_at">>,
): Promise<ReportExportJobRow | null> {
  const next: Partial<ReportExportJobRow> = { ...patch, updated_at: nowIso() };
  if (tableMissing(TABLE)) {
    const existing = store().get(id);
    if (!existing || existing.tenant_id !== tenantId) return null;
    const merged = { ...existing, ...next } as ReportExportJobRow;
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
      return updateExportJob(id, tenantId, patch);
    }
    throw error;
  }
  return (data ?? null) as ReportExportJobRow | null;
}
