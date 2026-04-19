/**
 * Reporting OS — service layer.
 *
 * Wraps the pure report definitions with tenant enforcement and
 * audit logging. All server/API entry points should call into
 * this module rather than invoking definitions directly.
 */

import "server-only";

import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getSession } from "@/lib/auth/session";

import {
  getReportDefinitionById,
  listReportDefinitions,
} from "./definitions";
import type {
  ReportContext,
  ReportDefinition,
  ReportDefinitionSummary,
  ReportExecution,
  ReportResult,
} from "./types";

export type RunReportParams = {
  range?: { from?: string; to?: string };
  [key: string]: unknown;
};

export type RunReportContext = {
  tenantId: string;
  profileId?: string | null;
  role?: string | null;
};

export type RunReportOutcome = {
  ok: boolean;
  execution: ReportExecution;
  result?: ReportResult;
  error?: { message: string; code?: string };
};

function normalizeRange(
  params: RunReportParams | undefined,
): { from: string; to: string } {
  const today = new Date();
  const defaultTo = today.toISOString().slice(0, 10);
  const defaultFromDate = new Date(today.getTime());
  defaultFromDate.setUTCMonth(defaultFromDate.getUTCMonth() - 3);
  const defaultFrom = defaultFromDate.toISOString().slice(0, 10);

  const fromParam =
    (params?.range?.from as string | undefined) ??
    (params?.from as string | undefined) ??
    defaultFrom;
  const toParam =
    (params?.range?.to as string | undefined) ??
    (params?.to as string | undefined) ??
    defaultTo;

  return {
    from: typeof fromParam === "string" && fromParam.length > 0
      ? fromParam
      : defaultFrom,
    to: typeof toParam === "string" && toParam.length > 0 ? toParam : defaultTo,
  };
}

export async function listReports(): Promise<ReportDefinitionSummary[]> {
  return listReportDefinitions().map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    parameters: d.parameters,
  }));
}

export async function getReportDefinition(
  reportId: string,
): Promise<ReportDefinitionSummary | null> {
  const def = getReportDefinitionById(reportId);
  if (!def) return null;
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    parameters: def.parameters,
  };
}

/**
 * Runs a report under a tenant context.
 *
 * Enforces:
 *   - tenantId is present
 *   - current session has tenant access (via assertTenantAccess)
 *   - audit log start + finish entries
 */
export async function runReport(
  reportId: string,
  params: RunReportParams | undefined,
  context: RunReportContext,
): Promise<RunReportOutcome> {
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();
  const t0 = Date.now();
  const tenantId = (context.tenantId ?? "").trim();

  if (!tenantId) {
    const error = { message: "TENANT_REQUIRED", code: "TENANT_REQUIRED" };
    return {
      ok: false,
      error,
      execution: {
        reportId,
        tenantId,
        profileId: context.profileId ?? null,
        startedAt,
        endedAt: new Date().toISOString(),
        durationMs: Date.now() - t0,
        ok: false,
        error,
      },
    };
  }

  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await getSession();
  } catch {
    session = null;
  }

  try {
    await assertTenantAccess(tenantId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "FORBIDDEN";
    const error = { message, code: "FORBIDDEN" };
    await logAudit("reports.run.denied", {
      reportId,
      tenantId,
      profileId: context.profileId ?? session?.userId ?? null,
      error: message,
    });
    return {
      ok: false,
      error,
      execution: {
        reportId,
        tenantId,
        profileId: context.profileId ?? session?.userId ?? null,
        startedAt,
        endedAt: new Date().toISOString(),
        durationMs: Date.now() - t0,
        ok: false,
        error,
      },
    };
  }

  const definition: ReportDefinition | null = getReportDefinitionById(reportId);
  if (!definition) {
    const error = {
      message: `Report '${reportId}' not found`,
      code: "NOT_FOUND",
    };
    return {
      ok: false,
      error,
      execution: {
        reportId,
        tenantId,
        profileId: context.profileId ?? session?.userId ?? null,
        startedAt,
        endedAt: new Date().toISOString(),
        durationMs: Date.now() - t0,
        ok: false,
        error,
      },
    };
  }

  const range = normalizeRange(params);
  const runContext: ReportContext = {
    tenantId,
    profileId: context.profileId ?? session?.userId ?? null,
    role: context.role ?? session?.role ?? null,
    range,
    params: (params ?? {}) as Record<string, unknown>,
  };

  await logAudit("reports.run.start", {
    reportId,
    tenantId,
    profileId: runContext.profileId,
    range,
  });

  try {
    const result = await definition.run(runContext);
    const endedAt = new Date().toISOString();
    const durationMs = Date.now() - t0;

    await logAudit("reports.run.finish", {
      reportId,
      tenantId,
      profileId: runContext.profileId,
      durationMs,
      rowCount: result.rows.length,
      ok: true,
    });

    return {
      ok: true,
      result,
      execution: {
        reportId,
        tenantId,
        profileId: runContext.profileId,
        startedAt,
        endedAt,
        durationMs,
        ok: true,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: unknown }).code)
        : undefined;
    const error = { message, code };
    const endedAt = new Date().toISOString();
    const durationMs = Date.now() - t0;

    await logAudit("reports.run.finish", {
      reportId,
      tenantId,
      profileId: runContext.profileId,
      durationMs,
      ok: false,
      error: message,
    });

    return {
      ok: false,
      error,
      execution: {
        reportId,
        tenantId,
        profileId: runContext.profileId,
        startedAt,
        endedAt,
        durationMs,
        ok: false,
        error,
      },
    };
  }
}
