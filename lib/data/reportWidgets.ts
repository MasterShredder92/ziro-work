/**
 * @data/reportWidgets facade.
 *
 * Persists widgets that belong to a saved report. Falls back to an
 * in-memory tenant-scoped store when the `report_widgets` table is absent.
 */

import { applyListOptions, clientFor, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

export type ReportWidgetRow = {
  id: string;
  tenant_id: string;
  report_id: string;
  widget_type: string;
  title: string | null;
  position: number;
  size: string;
  config: Record<string, unknown> | null;
  query: Record<string, unknown> | null;
  kpi_key: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportWidgetInsert = Omit<
  ReportWidgetRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

const TABLE = "report_widgets";

type GlobalWithStore = typeof globalThis & {
  __ziro_report_widgets_store?: Map<string, ReportWidgetRow>;
};

function store(): Map<string, ReportWidgetRow> {
  const g = globalThis as GlobalWithStore;
  if (!g.__ziro_report_widgets_store)
    g.__ziro_report_widgets_store = new Map();
  return g.__ziro_report_widgets_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `widget_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export async function listWidgetsByReport(
  reportId: string,
  tenantId: string,
  opts?: ListOptions,
): Promise<ReportWidgetRow[]> {
  if (tableMissing(TABLE)) {
    return Array.from(store().values())
      .filter((w) => w.tenant_id === tenantId && w.report_id === reportId)
      .sort((a, b) => a.position - b.position);
  }
  const supabase = await clientFor(tenantId);
  const q = applyListOptions(
    supabase
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("report_id", reportId),
    { orderBy: opts?.orderBy ?? "position", ascending: opts?.ascending ?? true },
  );
  const { data, error } = await q;
  if (error) {
    if (isMissingTableError(error, TABLE)) {
      markTableMissing(TABLE);
      return listWidgetsByReport(reportId, tenantId, opts);
    }
    throw error;
  }
  return (data ?? []) as ReportWidgetRow[];
}

export async function getWidget(
  id: string,
  tenantId: string,
): Promise<ReportWidgetRow | null> {
  if (tableMissing(TABLE)) {
    const w = store().get(id);
    return w && w.tenant_id === tenantId ? w : null;
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
      return getWidget(id, tenantId);
    }
    throw error;
  }
  return (data ?? null) as ReportWidgetRow | null;
}

export async function upsertWidget(
  tenantId: string,
  input: Omit<ReportWidgetInsert, "tenant_id">,
): Promise<ReportWidgetRow> {
  const now = nowIso();
  const row: ReportWidgetRow = {
    id: input.id ?? uuid(),
    tenant_id: tenantId,
    report_id: input.report_id,
    widget_type: input.widget_type,
    title: input.title ?? null,
    position: input.position ?? 0,
    size: input.size ?? "md",
    config: input.config ?? null,
    query: input.query ?? null,
    kpi_key: input.kpi_key ?? null,
    created_at: input.created_at ?? now,
    updated_at: now,
  };

  if (tableMissing(TABLE)) {
    store().set(row.id, row);
    return row;
  }

  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: "id" })
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
  return data as ReportWidgetRow;
}

export async function deleteWidget(
  id: string,
  tenantId: string,
): Promise<boolean> {
  if (tableMissing(TABLE)) {
    const w = store().get(id);
    if (!w || w.tenant_id !== tenantId) return false;
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
      return deleteWidget(id, tenantId);
    }
    throw error;
  }
  return true;
}

export async function deleteWidgetsByReport(
  reportId: string,
  tenantId: string,
): Promise<void> {
  if (tableMissing(TABLE)) {
    for (const [id, w] of store().entries()) {
      if (w.tenant_id === tenantId && w.report_id === reportId) {
        store().delete(id);
      }
    }
    return;
  }
  const supabase = await clientFor(tenantId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("report_id", reportId);
  if (error) {
    if (isMissingTableError(error, TABLE)) {
      markTableMissing(TABLE);
      return deleteWidgetsByReport(reportId, tenantId);
    }
    throw error;
  }
}
