import "server-only";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import {
  createWorkflowForTenant,
  deleteWorkflowForTenant,
  runWorkflowManually,
  updateWorkflowForTenant,
} from "./service";
import { listWorkflows as listWorkflowsQuery } from "./queries";
import { dispatchTrigger } from "./triggers";
import { runAction } from "./actions";
import type {
  AutomationActionDef,
  AutomationRunContext,
  AutomationWorkflow,
  AutomationWorkflowInput,
} from "./types";

export async function createWorkflow(
  input: AutomationWorkflowInput & { tenantId?: string },
): Promise<AutomationWorkflow> {
  const tenantId = input.tenantId?.trim() || DEFAULT_TENANT_ID;
  const rest = { ...input };
  delete (rest as { tenantId?: string }).tenantId;
  return createWorkflowForTenant(tenantId, rest);
}

export async function updateWorkflow(
  workflowId: string,
  input: Partial<AutomationWorkflowInput> & { tenantId?: string },
): Promise<AutomationWorkflow> {
  const tenantId = input.tenantId?.trim() || DEFAULT_TENANT_ID;
  const rest = { ...input };
  delete (rest as { tenantId?: string }).tenantId;
  return updateWorkflowForTenant(workflowId, tenantId, rest);
}

export async function deleteWorkflow(
  workflowId: string,
  tenantId?: string,
): Promise<void> {
  const resolvedTenantId = tenantId?.trim() || DEFAULT_TENANT_ID;
  return deleteWorkflowForTenant(workflowId, resolvedTenantId);
}

export async function listWorkflows(
  tenantId?: string,
): Promise<AutomationWorkflow[]> {
  const resolvedTenantId = tenantId?.trim() || DEFAULT_TENANT_ID;
  return listWorkflowsQuery(resolvedTenantId);
}

export async function runWorkflow(
  workflowId: string,
  input: {
    tenantId?: string;
    payload?: Record<string, unknown>;
    triggeredBy?: string | null;
  } = {},
) {
  const tenantId = input.tenantId?.trim() || DEFAULT_TENANT_ID;
  return runWorkflowManually(workflowId, tenantId, {
    payload: input.payload ?? {},
    triggeredBy: input.triggeredBy ?? null,
  });
}

export async function evaluateTriggers(input: {
  triggerType: "message.received" | "file.uploaded" | "appointment.created" | "appointment.updated";
  tenantId?: string;
  payload?: Record<string, unknown>;
  triggeredBy?: string | null;
}) {
  const tenantId = input.tenantId?.trim() || DEFAULT_TENANT_ID;
  return dispatchTrigger({
    tenantId,
    triggerType: input.triggerType,
    payload: input.payload ?? {},
    triggeredBy: input.triggeredBy ?? null,
  });
}

export async function executeActions(input: {
  tenantId?: string;
  workflowId: string;
  runId: string;
  triggerType: string;
  payload: Record<string, unknown>;
  actions: AutomationActionDef[];
  triggeredBy?: string | null;
}) {
  const tenantId = input.tenantId?.trim() || DEFAULT_TENANT_ID;
  const ctx: AutomationRunContext = {
    tenantId,
    workflowId: input.workflowId,
    runId: input.runId,
    triggerType: input.triggerType,
    payload: input.payload,
    triggeredBy: input.triggeredBy ?? null,
  };
  const results = [];
  for (const action of input.actions) {
    const result = await runAction(action, ctx);
    results.push({ actionId: action.id, type: action.type, ...result });
  }
  return results;
}
