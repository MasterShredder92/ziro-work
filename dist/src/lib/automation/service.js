import "server-only";
import { invokeSkill } from "@/lib/ziro/invokeSkill";
import { sendMessage as sendMessageService } from "@/lib/messaging/service";
import { renderTemplateForContext } from "@/lib/templates/service";
import { logAudit } from "@/lib/audit/log";
import { listAutomationRules } from "./queries";
function getByPath(obj, path) {
    if (!path)
        return undefined;
    const parts = path.split(".");
    let cursor = obj;
    for (const part of parts) {
        if (cursor === null || cursor === undefined)
            return undefined;
        if (typeof cursor !== "object")
            return undefined;
        cursor = cursor[part];
    }
    return cursor;
}
function toNumber(value) {
    if (typeof value === "number")
        return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}
export function evaluateTrigger(trigger, context) {
    if (!trigger)
        return false;
    if (trigger.event !== context.event)
        return false;
    const filters = trigger.filters;
    if (!filters || typeof filters !== "object")
        return true;
    for (const [key, expected] of Object.entries(filters)) {
        const actual = getByPath(context.payload, key);
        if (Array.isArray(expected)) {
            if (!expected.includes(actual))
                return false;
        }
        else if (actual !== expected) {
            return false;
        }
    }
    return true;
}
function evalCondition(cond, context) {
    const actual = getByPath({ payload: context.payload, event: context.event, tenantId: context.tenantId }, cond.path);
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
            return Array.isArray(cond.value) && cond.value.includes(actual);
        case "nin":
            return Array.isArray(cond.value) && !cond.value.includes(actual);
        case "exists":
            return actual !== undefined && actual !== null;
        case "not_exists":
            return actual === undefined || actual === null;
        case "contains": {
            if (typeof actual === "string" && typeof cond.value === "string") {
                return actual.toLowerCase().includes(cond.value.toLowerCase());
            }
            if (Array.isArray(actual)) {
                return actual.includes(cond.value);
            }
            return false;
        }
        default:
            return false;
    }
}
export function evaluateConditions(conditions, context) {
    if (!conditions || conditions.length === 0)
        return true;
    for (const c of conditions) {
        if (!evalCondition(c, context))
            return false;
    }
    return true;
}
async function runAction(action, context) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
    const startedAtDate = new Date();
    const startedAt = startedAtDate.toISOString();
    const t0 = Date.now();
    try {
        switch (action.kind) {
            case "runSkill": {
                const result = await invokeSkill(action.skillId, {
                    tenantId: context.tenantId,
                    profileId: (_a = context.profileId) !== null && _a !== void 0 ? _a : undefined,
                    conversationId: (_b = context.conversationId) !== null && _b !== void 0 ? _b : undefined,
                    locationId: (_c = context.locationId) !== null && _c !== void 0 ? _c : undefined,
                    input: action.input,
                    extra: action.extra,
                });
                return {
                    kind: action.kind,
                    ok: result.ok,
                    durationMs: Date.now() - t0,
                    startedAt,
                    output: result,
                    error: result.error,
                };
            }
            case "sendMessage": {
                const senderId = (_d = context.profileId) !== null && _d !== void 0 ? _d : "system";
                const detail = await sendMessageService(senderId, action.profileId, action.body);
                return {
                    kind: action.kind,
                    ok: true,
                    durationMs: Date.now() - t0,
                    startedAt,
                    output: { threadId: detail.thread.id },
                };
            }
            case "sendTemplatedMessage": {
                const senderId = (_e = context.profileId) !== null && _e !== void 0 ? _e : "system";
                const actionContext = ((_f = action.context) !== null && _f !== void 0 ? _f : {});
                const tenantFromAction = (_g = actionContext.tenant) !== null && _g !== void 0 ? _g : {};
                const mergeContext = Object.assign(Object.assign({}, actionContext), { tenant: Object.assign({ id: context.tenantId }, tenantFromAction) });
                const rendered = await renderTemplateForContext({
                    templateId: action.templateId,
                    versionId: action.versionId,
                    context: mergeContext,
                    tenantId: context.tenantId,
                });
                const body = rendered.subject
                    ? `${rendered.subject}\n\n${rendered.body}`
                    : rendered.body;
                const detail = await sendMessageService(senderId, action.profileId, body);
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
                    profileId: (_h = context.profileId) !== null && _h !== void 0 ? _h : undefined,
                    conversationId: (_j = context.conversationId) !== null && _j !== void 0 ? _j : undefined,
                    extra: {
                        entityId: action.entityId,
                        entityType: (_k = action.entityType) !== null && _k !== void 0 ? _k : "student",
                        body: action.body,
                    },
                });
                return {
                    kind: action.kind,
                    ok: result.ok,
                    durationMs: Date.now() - t0,
                    startedAt,
                    output: result,
                    error: result.error,
                };
            }
            case "scheduleFollowup": {
                const result = await invokeSkill("stewie.scheduleFollowup", {
                    tenantId: context.tenantId,
                    profileId: (_l = context.profileId) !== null && _l !== void 0 ? _l : undefined,
                    conversationId: (_m = context.conversationId) !== null && _m !== void 0 ? _m : undefined,
                    extra: {
                        targetProfileId: action.profileId,
                        dueAt: action.date,
                        note: (_o = action.note) !== null && _o !== void 0 ? _o : "",
                    },
                });
                return {
                    kind: action.kind,
                    ok: result.ok,
                    durationMs: Date.now() - t0,
                    startedAt,
                    output: result,
                    error: result.error,
                };
            }
            case "createLead": {
                const result = await invokeSkill("star.createLead", {
                    tenantId: context.tenantId,
                    profileId: (_p = context.profileId) !== null && _p !== void 0 ? _p : undefined,
                    conversationId: (_q = context.conversationId) !== null && _q !== void 0 ? _q : undefined,
                    extra: {
                        name: action.name,
                        email: action.email,
                        phone: action.phone,
                        source: action.source,
                        tags: (_r = action.tags) !== null && _r !== void 0 ? _r : [],
                        answers: (_s = action.answers) !== null && _s !== void 0 ? _s : context.payload,
                    },
                });
                return {
                    kind: action.kind,
                    ok: result.ok,
                    durationMs: Date.now() - t0,
                    startedAt,
                    output: result,
                    error: result.error,
                };
            }
            case "tagProfile": {
                const result = await invokeSkill("ziro.tagProfile", {
                    tenantId: context.tenantId,
                    profileId: (_t = context.profileId) !== null && _t !== void 0 ? _t : undefined,
                    conversationId: (_u = context.conversationId) !== null && _u !== void 0 ? _u : undefined,
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
                    error: result.error,
                };
            }
            default: {
                const unknownAction = action;
                return {
                    kind: (_v = unknownAction.kind) !== null && _v !== void 0 ? _v : "unknown",
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
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const code = err && typeof err === "object" && "code" in err
            ? String(err.code)
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
export async function runActions(actions, context) {
    if (!actions || actions.length === 0)
        return [];
    const out = [];
    for (const action of actions) {
        const result = await runAction(action, context);
        out.push(result);
    }
    return out;
}
export async function runAutomationRule(rule, context) {
    var _a;
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
    let actionResults = [];
    let ok = true;
    let error;
    try {
        actionResults = await runActions(rule.actions, context);
        ok = actionResults.every((r) => r.ok);
    }
    catch (err) {
        ok = false;
        const message = err instanceof Error ? err.message : String(err);
        const code = err && typeof err === "object" && "code" in err
            ? String(err.code)
            : undefined;
        error = { message, code };
    }
    const finishedAt = new Date();
    const execution = {
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
    }
    else {
        await logAudit("automation.rule.failure", {
            ruleId: rule.id,
            ruleName: rule.name,
            tenantId: rule.tenantId,
            event: context.event,
            durationMs: execution.durationMs,
            error: (_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : "action_failed",
            actionResults: actionResults.map((r) => {
                var _a;
                return ({
                    kind: r.kind,
                    ok: r.ok,
                    error: (_a = r.error) === null || _a === void 0 ? void 0 : _a.message,
                });
            }),
        });
    }
    return execution;
}
export async function runAutomationForEvent(eventName, context) {
    const rules = await listAutomationRules(context.tenantId);
    const matching = rules.filter((r) => { var _a; return r.enabled && ((_a = r.trigger) === null || _a === void 0 ? void 0 : _a.event) === eventName; });
    const out = [];
    for (const rule of matching) {
        const exec = await runAutomationRule(rule, context);
        out.push(exec);
    }
    return out;
}
