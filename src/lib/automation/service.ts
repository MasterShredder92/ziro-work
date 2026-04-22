import "server-only";
import { invokeSkill } from "@/lib/ziro/invokeSkill";
import { sendMessage as sendMessageService } from "@/lib/messaging/service";
import { renderTemplateForContext } from "@/lib/templates/service";
import type { TemplateContext } from "@/lib/templates/types";
import { logAudit } from "@/lib/audit/log";
import { listAutomationRules } from "./queries";
import type {
  AutomationAction,
  AutomationActionResult,
  AutomationCondition,
  AutomationContext,
  AutomationExecution,
  AutomationRule,
  AutomationTrigger,
} from "./types";

function getByPath(obj: unknown, path: string): unknown {
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

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function evaluateTrigger(
  trigger: AutomationTrigger,
  context: AutomationContext,
): boolean {
  if (!trigger) return false;
  if (trigger.event !== context.event) return false;
  const filters = trigger.filters;
  if (!filters || typeof filters !== "object") return true;
  for (const [key, expected] of Object.entries(filters)) {
    const actual = getByPath(context.payload, key);
    if (Array.isArray(expected)) {
      if (!expected.includes(actual as never)) return false;
    } else if (actual !== expected) {
      return false;
    }
  }
  return true;
}

function evalCondition(
  cond: AutomationCondition,
  context: AutomationContext,
): boolean {
  const actual = getByPath(
    { payload: context.payload, event: context.event, tenantId: context.tenantId },
    cond.path,
  );

  switch (cond.op) {
    case "eq":
      return actual === cond.value;
    case "neq":
      return actual !== cond.value;
    case "gt": {
      const a = toNumber(actual);
      const b = toNumber(cond.value);
      return a !== null && b !== null && a > b;
    }
    case "gte": {
      const a = toNumber(actual);
      const b = toNumber(cond.value);
      return a !== null && b !== null && a >= b;
    }
    case "lt": {
      const a = toNumber(actual);
      const b = toNumber(cond.value);
      return a !== null && b !== null && a < b;
    }
    case "lte": {
      const a = toNumber(actual);
      const b = toNumber(cond.value);
      return a !== null && b !== null && a <= b;
    }
    case "in":
      return Array.isArray(cond.value) && cond.value.includes(actual as never);
    case "nin":
      return Array.isArray(cond.value) && !cond.value.includes(actual as never);
    case "exists":
      return actual !== undefined && actual !== null;
    case "not_exists":
      return actual === undefined || actual === null;
    case "contains": {
      if (typeof actual === "string" && typeof cond.value === "string") {
        return actual.toLowerCase().includes(cond.value.toLowerCase());
      }
      if (Array.isArray(actual)) {
        return actual.includes(cond.value as never);
      }
      return false;
    }
    default:
      return false;
  }
}

export function evaluateConditions(
  conditions: AutomationCondition[] | undefined,
  context: AutomationContext,
): boolean {
  if (!conditions || conditions.length === 0) return true;
  for (const c of conditions) {
    if (!evalCondition(c, context)) return false;
  }
  return true;
}

async function runAction(
  action: AutomationAction,
  context: AutomationContext,
): Promise<AutomationActionResult> {
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();
  const t0 = Date.now();

  try {
    switch (action.kind) {
      case "runSkill": {
        const result = await invokeSkill(action.skillId, {
          tenantId: context.tenantId,
          profileId: context.profileId ?? undefined,
          conversationId: context.conversationId ?? undefined,
          locationId: context.locationId ?? undefined,
          input: action.input,
          extra: action.extra,
        });
        return {
          kind: action.kind,
          ok: result.ok,
          durationMs: Date.now() - t0,
          startedAt,
          output: result,
          error: result.error ? (typeof result.error === "string" ? { message: result.error } : result.error as { message: string; code?: string }) : undefined,
        };
      }
      case "sendMessage": {
        const senderId = context.profileId ?? "system";
        const detail = await sendMessageService(
          senderId,
          action.profileId,
          action.body,
        );
        return {
          kind: action.kind,
          ok: true,
          durationMs: Date.now() - t0,
          startedAt,
          output: { threadId: detail.thread.id },
        };
      }
      case "sendTemplatedMessage": {
        const senderId = context.profileId ?? "system";
        const actionContext = (action.context ?? {}) as Record<string, unknown>;
        const tenantFromAction =
          (actionContext.tenant as Record<string, unknown> | undefined) ?? {};
        const mergeContext: TemplateContext = {
          ...(actionContext as TemplateContext),
          tenant: {
            id: context.tenantId,
            ...tenantFromAction,
          },
        };
        const rendered = await renderTemplateForContext({
          templateId: action.templateId,
          versionId: action.versionId,
          context: mergeContext,
          tenantId: context.tenantId,
        });
        const body = rendered.subject
          ? `${rendered.subject}\n\n${rendered.body}`
          : rendered.body;
        const detail = await sendMessageService(
          senderId,
          action.profileId,
          body,
        );
        return {
          kind: action.kind,
          ok: true,
          durationMs: Date.now() - t0,
          startedAt,
          output: {
            threadId: detail.thread.id,
            templateId: rendered.templateId,
            version: rendered.version,
            missingMergeFields: rendered.missingMergeFields,
          },
        };
      }
      case "createNote": {
        const result = await invokeSkill("ziro.createNote", {
          tenantId: context.tenantId,
          profileId: context.profileId ?? undefined,
          conversationId: context.conversationId ?? undefined,
          extra: {
            entityId: action.entityId,
            entityType: action.entityType ?? "student",
            body: action.body,
          },
        });
        return {
          kind: action.kind,
          ok: result.ok,
          durationMs: Date.now() - t0,
          startedAt,
          output: result,
          error: result.error ? (typeof result.error === "string" ? { message: result.error } : result.error as { message: string; code?: string }) : undefined,
        };
      }
      case "scheduleFollowup": {
        const result = await invokeSkill("stewie.scheduleFollowup", {
          tenantId: context.tenantId,
          profileId: context.profileId ?? undefined,
          conversationId: context.conversationId ?? undefined,
          extra: {
            targetProfileId: action.profileId,
            dueAt: action.date,
            note: action.note ?? "",
          },
        });
        return {
          kind: action.kind,
          ok: result.ok,
          durationMs: Date.now() - t0,
          startedAt,
          output: result,
          error: result.error ? (typeof result.error === "string" ? { message: result.error } : result.error as { message: string; code?: string }) : undefined,
        };
      }
      case "createLead": {
        const result = await invokeSkill("star.createLead", {
          tenantId: context.tenantId,
          profileId: context.profileId ?? undefined,
          conversationId: context.conversationId ?? undefined,
          extra: {
            name: action.name,
            email: action.email,
            phone: action.phone,
            source: action.source,
            tags: action.tags ?? [],
            answers: action.answers ?? context.payload,
          },
        });
        return {
          kind: action.kind,
          ok: result.ok,
          durationMs: Date.now() - t0,
          startedAt,
          output: result,
          error: result.error ? (typeof result.error === "string" ? { message: result.error } : result.error as { message: string; code?: string }) : undefined,
        };
      }
      case "tagProfile": {
        const result = await invokeSkill("ziro.tagProfile", {
          tenantId: context.tenantId,
          profileId: context.profileId ?? undefined,
          conversationId: context.conversationId ?? undefined,
          extra: {
            targetProfileId: action.profileId,
            tag: action.tag,
            remove: action.remove === true,
          },
        });
        return {
          kind: action.kind,
          ok: result.ok,
          durationMs: Date.now() - t0,
          startedAt,
          output: result,
          error: result.error ? (typeof result.error === "string" ? { message: result.error } : result.error as { message: string; code?: string }) : undefined,
        };
      }
      default: {
        const unknownAction = action as { kind?: string };
        return {
          kind: unknownAction.kind ?? "unknown",
          ok: false,
          durationMs: Date.now() - t0,
          startedAt,
          error: {
            message: `Unknown automation action kind: ${unknownAction.kind}`,
            code: "UNKNOWN_ACTION",
          },
        };
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: unknown }).code)
        : undefined;
    return {
      kind: action.kind,
      ok: false,
      durationMs: Date.now() - t0,
      startedAt,
      error: { message, code },
    };
  }
}

export async function runActions(
  actions: AutomationAction[] | undefined,
  context: AutomationContext,
): Promise<AutomationActionResult[]> {
  if (!actions || actions.length === 0) return [];
  const out: AutomationActionResult[] = [];
  for (const action of actions) {
    const result = await runAction(action, context);
    out.push(result);
  }
  return out;
}

export async function runAutomationRule(
  rule: AutomationRule,
  context: AutomationContext,
): Promise<AutomationExecution> {
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();

  const triggerMatched = evaluateTrigger(rule.trigger, context);
  if (!rule.enabled || !triggerMatched) {
    const finishedAt = new Date();
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      tenantId: rule.tenantId,
      event: context.event,
      startedAt,
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAtDate.getTime(),
      ok: true,
      matched: triggerMatched,
      skipped: true,
      skipReason: !rule.enabled ? "RULE_DISABLED" : "TRIGGER_MISMATCH",
      actionResults: [],
    };
  }

  const conditionsOk = evaluateConditions(rule.conditions, context);
  if (!conditionsOk) {
    const finishedAt = new Date();
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      tenantId: rule.tenantId,
      event: context.event,
      startedAt,
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAtDate.getTime(),
      ok: true,
      matched: true,
      skipped: true,
      skipReason: "CONDITIONS_NOT_MET",
      actionResults: [],
    };
  }

  await logAudit("automation.rule.start", {
    ruleId: rule.id,
    ruleName: rule.name,
    tenantId: rule.tenantId,
    event: context.event,
  });

  let actionResults: AutomationActionResult[] = [];
  let ok = true;
  let error: AutomationExecution["error"] | undefined;

  try {
    actionResults = await runActions(rule.actions, context);
    ok = actionResults.every((r) => r.ok);
  } catch (err) {
    ok = false;
    const message = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: unknown }).code)
        : undefined;
    error = { message, code };
  }

  const finishedAt = new Date();
  const execution: AutomationExecution = {
    ruleId: rule.id,
    ruleName: rule.name,
    tenantId: rule.tenantId,
    event: context.event,
    startedAt,
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAtDate.getTime(),
    ok,
    matched: true,
    skipped: false,
    actionResults,
    error,
  };

  if (ok) {
    await logAudit("automation.rule.finish", {
      ruleId: rule.id,
      ruleName: rule.name,
      tenantId: rule.tenantId,
      event: context.event,
      durationMs: execution.durationMs,
      actionCount: actionResults.length,
    });
  } else {
    await logAudit("automation.rule.failure", {
      ruleId: rule.id,
      ruleName: rule.name,
      tenantId: rule.tenantId,
      event: context.event,
      durationMs: execution.durationMs,
      error: error?.message ?? "action_failed",
      actionResults: actionResults.map((r) => ({
        kind: r.kind,
        ok: r.ok,
        error: r.error?.message,
      })),
    });
  }

  return execution;
}

export async function runAutomationForEvent(
  eventName: string,
  context: AutomationContext,
): Promise<AutomationExecution[]> {
  const rules = await listAutomationRules(context.tenantId);
  const matching = rules.filter(
    (r) => r.enabled && r.trigger?.event === eventName,
  );
  const out: AutomationExecution[] = [];
  for (const rule of matching) {
    const exec = await runAutomationRule(rule, context);
    out.push(exec);
  }
  return out;
}
