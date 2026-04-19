import "server-only";
import {
  listAutomationWorkflows as listWorkflowsData,
  getAutomationWorkflow as getWorkflowData,
  upsertAutomationWorkflow as upsertWorkflowData,
  deleteAutomationWorkflow as deleteWorkflowData,
  updateWorkflowRunMetadata,
  type AutomationWorkflowFilter,
} from "@data/automationWorkflows";
import {
  listAutomationRuns as listRunsData,
  getAutomationRun as getRunData,
  upsertAutomationRun as upsertRunData,
  countRunningForTenant as countRunningForTenantData,
  countRunningForWorkflow as countRunningForWorkflowData,
  type AutomationRunFilter,
  type AutomationRunRow,
} from "@data/automationRuns";
import {
  listAutomationLogs as listLogsData,
  insertAutomationLog as insertLogData,
  type AutomationLogFilter,
  type AutomationLogLevel,
  type AutomationLogRow,
} from "@data/automationLogs";
import type {
  AutomationWorkflow,
  AutomationWorkflowInput,
  AutomationRun,
} from "./types";

export async function listWorkflows(
  tenantId: string,
  filter?: AutomationWorkflowFilter,
): Promise<AutomationWorkflow[]> {
  return listWorkflowsData(tenantId, filter);
}

export async function getWorkflow(
  workflowId: string,
  tenantId: string,
): Promise<AutomationWorkflow | null> {
  return getWorkflowData(workflowId, tenantId);
}

export async function createWorkflow(
  tenantId: string,
  input: AutomationWorkflowInput,
): Promise<AutomationWorkflow> {
  return upsertWorkflowData(tenantId, {
    name: input.name,
    description: input.description ?? null,
    status: input.status ?? "draft",
    trigger: input.trigger,
    actions: input.actions,
    concurrency_limit: input.concurrencyLimit ?? null,
    retry_max: input.retryMax ?? 3,
    retry_backoff_ms: input.retryBackoffMs ?? 1000,
    tags: input.tags ?? [],
    created_by: input.createdBy ?? null,
  });
}

export async function updateWorkflow(
  workflowId: string,
  tenantId: string,
  input: Partial<AutomationWorkflowInput>,
): Promise<AutomationWorkflow> {
  const existing = await getWorkflowData(workflowId, tenantId);
  if (!existing) throw new Error("AUTOMATION_WORKFLOW_NOT_FOUND");
  return upsertWorkflowData(tenantId, {
    id: existing.id,
    name: input.name ?? existing.name,
    description:
      input.description === undefined ? existing.description : input.description,
    status: input.status ?? existing.status,
    trigger: input.trigger ?? existing.trigger,
    actions: input.actions ?? existing.actions,
    concurrency_limit:
      input.concurrencyLimit === undefined
        ? existing.concurrency_limit
        : input.concurrencyLimit,
    retry_max: input.retryMax ?? existing.retry_max,
    retry_backoff_ms: input.retryBackoffMs ?? existing.retry_backoff_ms,
    tags: input.tags ?? existing.tags,
    created_at: existing.created_at,
    created_by: existing.created_by,
  });
}

export async function deleteWorkflow(
  workflowId: string,
  tenantId: string,
): Promise<void> {
  await deleteWorkflowData(workflowId, tenantId);
}

export async function listRuns(
  tenantId: string,
  filter?: AutomationRunFilter,
  opts?: { limit?: number; offset?: number },
): Promise<AutomationRun[]> {
  return listRunsData(tenantId, filter, opts);
}

export async function getRun(
  runId: string,
  tenantId: string,
): Promise<AutomationRun | null> {
  return getRunData(runId, tenantId);
}

export async function upsertRun(
  tenantId: string,
  input: Partial<AutomationRunRow> & { workflow_id: string },
): Promise<AutomationRun> {
  return upsertRunData(tenantId, input);
}

export async function logAutomation(
  tenantId: string,
  input: {
    runId?: string | null;
    workflowId?: string | null;
    actionId?: string | null;
    level?: AutomationLogLevel;
    message: string;
    data?: Record<string, unknown> | null;
  },
): Promise<AutomationLogRow> {
  return insertLogData(tenantId, {
    run_id: input.runId ?? null,
    workflow_id: input.workflowId ?? null,
    action_id: input.actionId ?? null,
    level: input.level ?? "info",
    message: input.message,
    data: input.data ?? null,
  });
}

export async function listLogs(
  tenantId: string,
  filter?: AutomationLogFilter,
): Promise<AutomationLogRow[]> {
  return listLogsData(tenantId, filter);
}

export async function touchWorkflowLastRun(
  workflowId: string,
  tenantId: string,
  status: string,
): Promise<void> {
  await updateWorkflowRunMetadata(
    workflowId,
    tenantId,
    new Date().toISOString(),
    status,
  );
}

export async function countRunningForTenant(tenantId: string): Promise<number> {
  return countRunningForTenantData(tenantId);
}

export async function countRunningForWorkflow(
  tenantId: string,
  workflowId: string,
): Promise<number> {
  return countRunningForWorkflowData(tenantId, workflowId);
}

export type {
  AutomationWorkflowFilter,
  AutomationRunFilter,
  AutomationLogFilter,
};
