import "server-only";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { logAudit } from "@/lib/audit/log";
import { runAutomationForEvent } from "./service";
import { BUILT_IN_TRIGGERS, } from "./types";
export const BUILT_IN_ACTIONS = [
    "runSkill",
    "sendMessage",
    "sendTemplatedMessage",
    "createNote",
    "scheduleFollowup",
    "createLead",
    "tagProfile",
];
export const BUILT_IN_TRIGGER_EVENTS = BUILT_IN_TRIGGERS;
export function isBuiltInTrigger(event) {
    return BUILT_IN_TRIGGERS.includes(event);
}
export async function dispatchAutomationEvent(eventName, payload = {}) {
    var _a, _b, _c, _d, _e, _f, _g;
    const tenantId = ((_a = payload.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    const occurredAt = (_b = payload.occurredAt) !== null && _b !== void 0 ? _b : new Date().toISOString();
    const context = {
        tenantId,
        profileId: (_c = payload.profileId) !== null && _c !== void 0 ? _c : null,
        conversationId: (_d = payload.conversationId) !== null && _d !== void 0 ? _d : null,
        locationId: (_e = payload.locationId) !== null && _e !== void 0 ? _e : null,
        event: eventName,
        payload: (_f = payload.data) !== null && _f !== void 0 ? _f : {},
        occurredAt,
    };
    await logAudit("automation.dispatch.received", {
        event: eventName,
        tenantId,
        profileId: (_g = context.profileId) !== null && _g !== void 0 ? _g : null,
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
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await logAudit("automation.dispatch.failure", {
            event: eventName,
            tenantId,
            error: message,
        });
        throw err;
    }
}
export function runSkillAction(skillId, input, extra) {
    return { kind: "runSkill", skillId, input, extra };
}
export function sendMessageAction(profileId, body) {
    return { kind: "sendMessage", profileId, body };
}
export function createNoteAction(entityId, body, entityType) {
    return { kind: "createNote", entityId, body, entityType };
}
export function scheduleFollowupAction(profileId, date, note) {
    return { kind: "scheduleFollowup", profileId, date, note };
}
export function createLeadAction(input) {
    return Object.assign({ kind: "createLead" }, input);
}
export function tagProfileAction(profileId, tag, remove) {
    return { kind: "tagProfile", profileId, tag, remove };
}
export function sendTemplatedMessageAction(profileId, templateId, versionId, context) {
    return { kind: "sendTemplatedMessage", profileId, templateId, versionId, context };
}
/**
 * Helper that creates an AutomationTrigger bound to `form.submitted` for a specific form.
 * Use when building rules that should fire only for a given form.
 */
export function onFormSubmitted(formId) {
    return { event: "form.submitted", filters: { formId } };
}
/**
 * Dispatches a `form.submitted` automation event. Typically called from the
 * forms service after a validated submission. Exposed here so other modules
 * (API routes, cron jobs, tests) can trigger workflows without importing the
 * full forms pipeline.
 */
export async function triggerWorkflowOnForm(formId, payload) {
    var _a, _b;
    return dispatchAutomationEvent("form.submitted", {
        tenantId: payload.tenantId,
        profileId: (_a = payload.profileId) !== null && _a !== void 0 ? _a : null,
        data: {
            formId,
            formSlug: payload.formSlug,
            formName: payload.formName,
            submissionId: payload.submissionId,
            answers: (_b = payload.answers) !== null && _b !== void 0 ? _b : {},
        },
    });
}
