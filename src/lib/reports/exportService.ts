/**
 * Reporting OS — export job service.
 *
 * Coordinates the export engine and the @data/reportExportJobs facade.
 * Creates an in-memory (or DB-backed) job row, runs the associated
 * report or query synchronously (since datasets are small), and
 * persists the encoded payload back onto the job for later download.
 */

import "server-only";

import {
  createExportJob,
  getExportJob as getExportJobRow,
  listExportJobs as listExportJobRows,
  updateExportJob,
  type ReportExportJobRow,
} from "@data/reportExportJobs";

import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getBrandingProfile } from "@/lib/branding/service";

import { exportResult, type ExportPayload } from "./export";
import { getSavedReport } from "./savedReports";
import { runQuery } from "./queryEngine";
import { runReport } from "./service";
import type {
  ExportFormat,
  ExportJob,
  ExportJobWithContent,
  ReportQuery,
  ReportResult,
  ReportSummaryMetric,
} from "./types";

function mapJob(row: ReportExportJobRow): ExportJob {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    reportId: row.report_id,
    format: row.format,
    status: row.status,
    filename: row.filename,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    params: row.params,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    expiresAt: row.expires_at,
    createdBy: row.created_by,
  };
}

function mapJobWithContent(row: ReportExportJobRow): ExportJobWithContent {
  return { ...mapJob(row), contentBase64: row.content_base64 };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function listExportJobs(
  tenantId: string,
  opts?: { reportId?: string; limit?: number },
): Promise<ExportJob[]> {
  await assertTenantAccess(tenantId);
  const rows = await listExportJobRows(
    tenantId,
    { reportId: opts?.reportId },
    { limit: opts?.limit ?? 50 },
  );
  return rows.map(mapJob);
}

export async function getExportJob(
  jobId: string,
  tenantId: string,
): Promise<ExportJobWithContent | null> {
  await assertTenantAccess(tenantId);
  const row = await getExportJobRow(jobId, tenantId);
  if (!row) return null;
  return mapJobWithContent(row);
}

// ---------------------------------------------------------------------------
// Create / run export
// ---------------------------------------------------------------------------

export type QueueExportInput = {
  reportId?: string | null;
  query?: ReportQuery | null;
  name?: string;
  format: ExportFormat;
  params?: Record<string, unknown> | null;
};

export async function queueReportExport(
  tenantId: string,
  input: QueueExportInput,
  actorProfileId?: string | null,
): Promise<ExportJob> {
  await assertTenantAccess(tenantId);

  const job = await createExportJob(tenantId, {
    report_id: input.reportId ?? null,
    format: input.format,
    status: "pending",
    filename: `pending.${input.format}`,
    content_type: "application/octet-stream",
    size_bytes: 0,
    params: input.params ?? null,
    error: null,
    content_base64: null,
    completed_at: null,
    expires_at: null,
    created_by: actorProfileId ?? null,
  });

  await logAudit("reports.export.queued", {
    tenantId,
    profileId: actorProfileId ?? null,
    jobId: job.id,
    reportId: input.reportId ?? null,
    format: input.format,
  });

  // Execute inline. Datasets are small enough to export synchronously.
  const finished = await executeExportJob(job.id, tenantId, input, actorProfileId);
  return finished;
}

async function executeExportJob(
  jobId: string,
  tenantId: string,
  input: QueueExportInput,
  actorProfileId?: string | null,
): Promise<ExportJob> {
  await updateExportJob(jobId, tenantId, { status: "running" });

  try {
    const payload = await buildExportPayload(tenantId, input, actorProfileId);
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const row = await updateExportJob(jobId, tenantId, {
      status: "completed",
      filename: payload.filename,
      content_type: payload.contentType,
      size_bytes: payload.sizeBytes,
      content_base64: payload.base64,
      completed_at: new Date().toISOString(),
      expires_at: expires,
      error: null,
    });
    await logAudit("reports.export.completed", {
      tenantId,
      profileId: actorProfileId ?? null,
      jobId,
      sizeBytes: payload.sizeBytes,
    });
    return row ? mapJob(row) : (await getExportJob(jobId, tenantId))!;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const row = await updateExportJob(jobId, tenantId, {
      status: "failed",
      error: message,
    });
    await logAudit("reports.export.failed", {
      tenantId,
      profileId: actorProfileId ?? null,
      jobId,
      error: message,
    });
    return row ? mapJob(row) : (await getExportJob(jobId, tenantId))!;
  }
}

async function mergePdfBranding(
  tenantId: string,
  result: ReportResult,
): Promise<ReportResult> {
  const profile = await getBrandingProfile(tenantId).catch(() => null);
  if (!profile?.pdf_export) return result;
  return {
    ...result,
    pdfExportBranding: {
      footerText: profile.pdf_export.footerText ?? null,
      watermark: profile.pdf_export.watermark ?? null,
    },
  };
}

async function buildExportPayload(
  tenantId: string,
  input: QueueExportInput,
  actorProfileId?: string | null,
): Promise<ExportPayload> {
  if (input.reportId && !input.query) {
    const outcome = await runReport(input.reportId, input.params ?? undefined, {
      tenantId,
      profileId: actorProfileId ?? null,
    });
    if (outcome.ok && outcome.result) {
      const merged = await mergePdfBranding(tenantId, outcome.result);
      return exportResult(merged, input.format);
    }

    const saved = await getSavedReport(input.reportId, tenantId);
    if (!saved) {
      throw new Error(outcome.error?.message ?? "Report run failed");
    }
    if (!saved.report.query) {
      throw new Error(`Saved report '${input.reportId}' has no query`);
    }
    const q = await runQuery(saved.report.query, tenantId);
    const synth = synthesizeResult(
      saved.report.name,
      tenantId,
      q.columns,
      q.rows,
      [],
    );
    const merged = await mergePdfBranding(tenantId, synth);
    return exportResult(merged, input.format);
  }

  if (input.query) {
    const q = await runQuery(input.query, tenantId);
    const result: ReportResult = synthesizeResult(
      input.name ?? "Ad-hoc report",
      tenantId,
      q.columns,
      q.rows,
      [],
    );
    const merged = await mergePdfBranding(tenantId, result);
    return exportResult(merged, input.format);
  }

  throw new Error("Export requires either reportId or query");
}

function synthesizeResult(
  name: string,
  tenantId: string,
  columns: ReportResult["columns"],
  rows: ReportResult["rows"],
  summary: ReportSummaryMetric[],
): ReportResult {
  return {
    reportId: "adhoc",
    reportKind: "enrollment",
    name,
    generatedAt: new Date().toISOString(),
    range: { from: "", to: "" },
    tenantId,
    summary,
    columns,
    rows,
  };
}
