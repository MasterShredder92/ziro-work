import "server-only";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { logAudit } from "@/lib/audit/log";
import { runAutomationForEvent } from "./service";
import {
  BUILT_IN_TRIGGERS,
  type AutomationAction,
  type AutomationContext,
  type AutomationExecution,
  type BuiltInTrigger,
} from "./types";

export type DispatchPayload = {
  tenantId?: string;
  profileId?: string | null;
  conversationId?: string | null;
  locationId?: string | null;
  data?: Record<string, unknown>;
  occurredAt?: string;
};

export const BUILT_IN_ACTIONS: readonly AutomationAction["kind"][] = [
  "runSkill",
  "sendMessage",
  "sendTemplatedMessage",
  "createNote",
  "scheduleFollowup",
  "createLead",
  "tagProfile",
] as const;

export const BUILT_IN_TRIGGER_EVENTS: readonly BuiltInTrigger[] =
  BUILT_IN_TRIGGERS;

export function isBuiltInTrigger(event: string): event is BuiltInTrigger {
  return (BUILT_IN_TRIGGERS as readonly string[]).includes(event);
}

export async function dispatchAutomationEvent(
  eventName: string,
  payload: DispatchPayload = {},
): Promise<AutomationExecution[]> {
  const tenantId = payload.tenantId?.trim() || DEFAULT_TENANT_ID;
  const occurredAt = payload.occurredAt ?? new Date().toISOString();

  const context: AutomationContext = {
    tenantId,
    profileId: payload.profileId ?? null,
    conversationId: payload.conversationId ?? null,
    locationId: payload.locationId ?? null,
    event: eventName,
    payload: payload.data ?? {},
    occurredAt,
  };

  await logAudit("automation.dispatch.received", {
    event: eventName,
    tenantId,
    profileId: context.profileId ?? null,
  });

  try {
    const executions = await runAutomationForEvent(eventName, context);
    await logAudit("automation.dispatch.completed", {
      event: eventName,
      tenantId,
      executionCount: executions.length,
      ok: executions.every((e) => e.ok),
    });
    return executions;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAudit("automation.dispatch.failure", {
      event: eventName,
      tenantId,
      error: message,
    });
    throw err;
  }
}

export function runSkillAction(
  skillId: string,
  input?: string,
  extra?: Record<string, unknown>,
): AutomationAction {
  return { kind: "runSkill", skillId, input, extra };
}

export function sendMessageAction(
  profileId: string,
  body: string,
): AutomationAction {
  return { kind: "sendMessage", profileId, body };
}

export function createNoteAction(
  entityId: string,
  body: string,
  entityType?: string,
): AutomationAction {
  return { kind: "createNote", entityId, body, entityType };
}

export function scheduleFollowupAction(
  profileId: string,
  date: string,
  note?: string,
): AutomationAction {
  return { kind: "scheduleFollowup", profileId, date, note };
}

export function createLeadAction(input: {
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  tags?: string[];
  answers?: Record<string, unknown>;
}): AutomationAction {
  return { kind: "createLead", ...input };
}

export function tagProfileAction(
  profileId: string,
  tag: string,
  remove?: boolean,
): AutomationAction {
  return { kind: "tagProfile", profileId, tag, remove };
}

export function sendTemplatedMessageAction(
  profileId: string,
  templateId: string,
  versionId?: string,
  context?: Record<string, unknown>,
): AutomationAction {
  return { kind: "sendTemplatedMessage", profileId, templateId, versionId, context };
}

/**
 * Helper that creates an AutomationTrigger bound to `form.submitted` for a specific form.
 * Use when building rules that should fire only for a given form.
 */
export function onFormSubmitted(formId: string): {
  event: "form.submitted";
  filters: { formId: string };
} {
  return { event: "form.submitted", filters: { formId } };
}

/**
 * Dispatches a `form.submitted` automation event. Typically called from the
 * forms service after a validated submission. Exposed here so other modules
 * (API routes, cron jobs, tests) can trigger workflows without importing the
 * full forms pipeline.
 */
export async function triggerWorkflowOnForm(
  formId: string,
  payload: {
    tenantId: string;
    submissionId?: string;
    profileId?: string | null;
    answers?: Record<string, unknown>;
    formSlug?: string;
    formName?: string;
  },
): Promise<AutomationExecution[]> {
  return dispatchAutomationEvent("form.submitted", {
    tenantId: payload.tenantId,
    profileId: payload.profileId ?? null,
    data: {
      formId,
      formSlug: payload.formSlug,
      formName: payload.formName,
      submissionId: payload.submissionId,
      answers: payload.answers ?? {},
    },
  });
}
