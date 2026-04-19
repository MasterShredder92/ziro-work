/**
 * Reporting OS — saved reports + widget service.
 *
 * Bridges the @data/reports and @data/reportWidgets facades with the
 * reports service. Handles tenant enforcement, audit logging, mapping
 * between row shapes and domain types, and coordinated widget upserts.
 */

import "server-only";

import {
  createReport as createReportRow,
  deleteReport as deleteReportRow,
  getReport as getReportRow,
  listReports as listReportRows,
  updateReport as updateReportRow,
  type ReportRow,
} from "@data/reports";
import {
  deleteWidget as deleteWidgetRow,
  deleteWidgetsByReport,
  listWidgetsByReport,
  upsertWidget as upsertWidgetRow,
  type ReportWidgetRow,
} from "@data/reportWidgets";

import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";

import type {
  ExtendedReportKind,
  ReportParameter,
  ReportQuery,
  ReportStatus,
  ReportWidget,
  ReportWidgetInput,
  SavedReport,
  SavedReportInput,
  SavedReportWithWidgets,
  WidgetSize,
  WidgetType,
} from "./types";

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function mapReport(row: ReportRow): SavedReport {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    kind: (row.kind as ExtendedReportKind) ?? "custom",
    status: row.status as ReportStatus,
    source: row.source as SavedReport["source"],
    query: (row.query ?? null) as ReportQuery | null,
    layout: row.layout,
    parameters: ((row.parameters ?? []) as unknown) as ReportParameter[],
    tags: row.tags ?? [],
    isPinned: row.is_pinned ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapWidget(row: ReportWidgetRow): ReportWidget {
  return {
    id: row.id,
    reportId: row.report_id,
    tenantId: row.tenant_id,
    widgetType: row.widget_type as WidgetType,
    title: row.title,
    position: row.position,
    size: (row.size as WidgetSize) ?? "md",
    kpiKey: row.kpi_key,
    query: (row.query ?? null) as ReportQuery | null,
    config: row.config,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function listSavedReports(
  tenantId: string,
  opts?: { includeArchived?: boolean; limit?: number },
): Promise<SavedReport[]> {
  await assertTenantAccess(tenantId);
  const rows = await listReportRows(
    tenantId,
    { includeArchived: opts?.includeArchived },
    { limit: opts?.limit ?? 100 },
  );
  return rows.map(mapReport);
}

export async function getSavedReport(
  reportId: string,
  tenantId: string,
): Promise<SavedReportWithWidgets | null> {
  await assertTenantAccess(tenantId);
  const row = await getReportRow(reportId, tenantId);
  if (!row) return null;
  const widgets = await listWidgetsByReport(reportId, tenantId);
  return {
    report: mapReport(row),
    widgets: widgets.map(mapWidget),
  };
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export async function createSavedReport(
  tenantId: string,
  input: SavedReportInput,
  actorProfileId?: string | null,
): Promise<SavedReportWithWidgets> {
  await assertTenantAccess(tenantId);
  const row = await createReportRow(tenantId, {
    name: input.name,
    slug: input.slug ?? null,
    description: input.description ?? null,
    kind: input.kind ?? "custom",
    status: input.status ?? "draft",
    source: input.source ?? "custom",
    query: (input.query ?? null) as Record<string, unknown> | null,
    layout: input.layout ?? null,
    parameters: (input.parameters ?? []) as unknown as Array<Record<string, unknown>>,
    tags: input.tags ?? [],
    is_pinned: input.isPinned ?? false,
    created_by: actorProfileId ?? null,
    updated_by: actorProfileId ?? null,
  });

  const widgets: ReportWidgetRow[] = [];
  if (input.widgets) {
    for (const [i, w] of input.widgets.entries()) {
      widgets.push(
        await upsertWidgetRow(tenantId, {
          report_id: row.id,
          widget_type: w.widgetType,
          title: w.title ?? null,
          position: w.position ?? i,
          size: w.size ?? "md",
          config: w.config ?? null,
          query: (w.query ?? null) as Record<string, unknown> | null,
          kpi_key: w.kpiKey ?? null,
        }),
      );
    }
  }

  await logAudit("reports.create", {
    tenantId,
    profileId: actorProfileId ?? null,
    reportId: row.id,
    name: row.name,
  });

  return {
    report: mapReport(row),
    widgets: widgets.map(mapWidget),
  };
}

export async function updateSavedReport(
  reportId: string,
  tenantId: string,
  input: SavedReportInput,
  actorProfileId?: string | null,
): Promise<SavedReportWithWidgets | null> {
  await assertTenantAccess(tenantId);
  const existing = await getReportRow(reportId, tenantId);
  if (!existing) return null;

  const updated = await updateReportRow(reportId, tenantId, {
    name: input.name ?? existing.name,
    slug: input.slug ?? existing.slug,
    description: input.description ?? existing.description,
    kind: input.kind ?? existing.kind,
    status: input.status ?? existing.status,
    source: input.source ?? existing.source,
    query: (input.query ?? existing.query) as Record<string, unknown> | null,
    layout: input.layout ?? existing.layout,
    parameters: (input.parameters ?? existing.parameters) as unknown as Array<Record<string, unknown>>,
    tags: input.tags ?? existing.tags,
    is_pinned: input.isPinned ?? existing.is_pinned,
    updated_by: actorProfileId ?? null,
  });
  if (!updated) return null;

  if (input.widgets) {
    await deleteWidgetsByReport(reportId, tenantId);
    for (const [i, w] of input.widgets.entries()) {
      await upsertWidgetRow(tenantId, {
        report_id: reportId,
        widget_type: w.widgetType,
        title: w.title ?? null,
        position: w.position ?? i,
        size: w.size ?? "md",
        config: w.config ?? null,
        query: (w.query ?? null) as Record<string, unknown> | null,
        kpi_key: w.kpiKey ?? null,
      });
    }
  }

  const widgets = await listWidgetsByReport(reportId, tenantId);

  await logAudit("reports.update", {
    tenantId,
    profileId: actorProfileId ?? null,
    reportId,
  });

  return {
    report: mapReport(updated),
    widgets: widgets.map(mapWidget),
  };
}

export async function deleteSavedReport(
  reportId: string,
  tenantId: string,
  actorProfileId?: string | null,
): Promise<boolean> {
  await assertTenantAccess(tenantId);
  await deleteWidgetsByReport(reportId, tenantId);
  const ok = await deleteReportRow(reportId, tenantId);
  await logAudit("reports.delete", {
    tenantId,
    profileId: actorProfileId ?? null,
    reportId,
    ok,
  });
  return ok;
}

export async function upsertWidget(
  tenantId: string,
  reportId: string,
  input: ReportWidgetInput,
): Promise<ReportWidget> {
  await assertTenantAccess(tenantId);
  const row = await upsertWidgetRow(tenantId, {
    id: input.id,
    report_id: reportId,
    widget_type: input.widgetType,
    title: input.title ?? null,
    position: input.position ?? 0,
    size: input.size ?? "md",
    config: input.config ?? null,
    query: (input.query ?? null) as Record<string, unknown> | null,
    kpi_key: input.kpiKey ?? null,
  });
  return mapWidget(row);
}

export async function deleteWidget(
  widgetId: string,
  tenantId: string,
): Promise<boolean> {
  await assertTenantAccess(tenantId);
  return deleteWidgetRow(widgetId, tenantId);
}
