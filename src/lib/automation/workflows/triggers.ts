import "server-only";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { logAudit } from "@/lib/audit/log";
import { listWorkflows, touchWorkflowLastRun } from "./queries";
import { enqueueRun } from "./runtime";
import type {
  AutomationTriggerType,
  AutomationWorkflow,
} from "./types";

export type TriggerDispatchInput = {
  tenantId?: string;
  triggerType: AutomationTriggerType | string;
  payload?: Record<string, unknown>;
  triggeredBy?: string | null;
};

export type TriggerDispatchResult = {
  matchedWorkflows: number;
  runIds: string[];
};

function valueAtPath(obj: unknown, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split(".");
  let cursor: unknown = obj;
  for (const part of parts) {
    if (cursor === null || cursor === undefined) return undefined;
    if (typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

function matchesFilters(
  workflow: AutomationWorkflow,
  payload: Record<string, unknown>,
): boolean {
  const filters = workflow.trigger?.filters;
  if (!filters || typeof filters !== "object") return true;
  for (const [key, expected] of Object.entries(filters)) {
    const actual = valueAtPath(payload, key);
    if (Array.isArray(expected)) {
      if (!expected.includes(actual as never)) return false;
    } else if (actual !== expected) {
      return false;
    }
  }
  return true;
}

export async function dispatchTrigger(
  input: TriggerDispatchInput,
): Promise<TriggerDispatchResult> {
  const tenantId = input.tenantId?.trim() || DEFAULT_TENANT_ID;
  const triggerType = input.triggerType;
  const payload = input.payload ?? {};

  await logAudit("automation.trigger.received", {
    tenantId,
    triggerType,
  });

  const workflows = await listWorkflows(tenantId, { triggerType });
  const active = workflows.filter(
    (w) => w.status === "active" && w.trigger?.type === triggerType,
  );
  const matched = active.filter((w) => matchesFilters(w, payload));

  const runIds: string[] = [];
  for (const wf of matched) {
    try {
      const run = await enqueueRun({
        tenantId,
        workflowId: wf.id,
        triggerType,
        payload,
        triggeredBy: input.triggeredBy ?? null,
        maxAttempts: wf.retry_max ?? 3,
      });
      runIds.push(run.id);
      await touchWorkflowLastRun(wf.id, tenantId, run.status);
    } catch (err) {
      await logAudit("automation.trigger.enqueue_failed", {
        tenantId,
        triggerType,
        workflowId: wf.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await logAudit("automation.trigger.dispatched", {
    tenantId,
    triggerType,
    matchedWorkflows: matched.length,
    runIds,
  });

  return { matchedWorkflows: matched.length, runIds };
}

export async function dispatchScheduleCron(
  tenantId: string,
  payload: {
    cron?: string;
    scheduledFor?: string;
    jobId?: string;
  } = {},
): Promise<TriggerDispatchResult> {
  return dispatchTrigger({
    tenantId,
    triggerType: "schedule.cron",
    payload,
  });
}

export async function dispatchScheduleEvent(
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<TriggerDispatchResult> {
  return dispatchTrigger({
    tenantId,
    triggerType: "schedule.event",
    payload,
  });
}

export async function dispatchCrmTrigger(
  tenantId: string,
  event:
    | "crm.contact.created"
    | "crm.student.updated"
    | "crm.family.updated",
  payload: Record<string, unknown>,
): Promise<TriggerDispatchResult> {
  return dispatchTrigger({ tenantId, triggerType: event, payload });
}

export async function dispatchBillingTrigger(
  tenantId: string,
  event:
    | "billing.invoice.created"
    | "billing.payment.received"
    | "billing.invoice.paid"
    | "billing.invoice.failed"
    | "billing.subscription.updated",
  payload: Record<string, unknown>,
): Promise<TriggerDispatchResult> {
  return dispatchTrigger({ tenantId, triggerType: event, payload });
}

export async function dispatchAssessmentsTrigger(
  tenantId: string,
  event:
    | "assessments.attempt.submitted"
    | "assessments.attempt.graded",
  payload: Record<string, unknown>,
): Promise<TriggerDispatchResult> {
  return dispatchTrigger({ tenantId, triggerType: event, payload });
}

export async function dispatchMessagesTrigger(
  tenantId: string,
  event: "messages.thread.created" | "messages.message.sent",
  payload: Record<string, unknown>,
): Promise<TriggerDispatchResult> {
  return dispatchTrigger({ tenantId, triggerType: event, payload });
}

export async function dispatchProgressEvidence(
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<TriggerDispatchResult> {
  return dispatchTrigger({
    tenantId,
    triggerType: "progress.evidence.added",
    payload,
  });
}

export async function dispatchCustomWebhook(
  tenantId: string,
  workflowId: string,
  payload: Record<string, unknown>,
  triggeredBy?: string | null,
): Promise<{ runId: string | null }> {
  await logAudit("automation.webhook.received", {
    tenantId,
    workflowId,
  });

  const { getWorkflow } = await import("./queries");
  const workflow = await getWorkflow(workflowId, tenantId);
  if (!workflow) return { runId: null };
  if (workflow.status !== "active") return { runId: null };
  if (workflow.trigger?.type !== "custom.webhook") return { runId: null };
  if (!matchesFilters(workflow, payload)) return { runId: null };

  const run = await enqueueRun({
    tenantId,
    workflowId,
    triggerType: "custom.webhook",
    payload,
    triggeredBy: triggeredBy ?? null,
    maxAttempts: workflow.retry_max ?? 3,
  });
  await touchWorkflowLastRun(workflowId, tenantId, run.status);
  return { runId: run.id };
}
