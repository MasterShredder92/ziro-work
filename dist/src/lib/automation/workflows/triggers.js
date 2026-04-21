import "server-only";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { logAudit } from "@/lib/audit/log";
import { listWorkflows, touchWorkflowLastRun } from "./queries";
import { enqueueRun } from "./runtime";
function valueAtPath(obj, path) {
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
function matchesFilters(workflow, payload) {
    var _a;
    const filters = (_a = workflow.trigger) === null || _a === void 0 ? void 0 : _a.filters;
    if (!filters || typeof filters !== "object")
        return true;
    for (const [key, expected] of Object.entries(filters)) {
        const actual = valueAtPath(payload, key);
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
export async function dispatchTrigger(input) {
    var _a, _b, _c, _d;
    const tenantId = ((_a = input.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    const triggerType = input.triggerType;
    const payload = (_b = input.payload) !== null && _b !== void 0 ? _b : {};
    await logAudit("automation.trigger.received", {
        tenantId,
        triggerType,
    });
    const workflows = await listWorkflows(tenantId, { triggerType });
    const active = workflows.filter((w) => { var _a; return w.status === "active" && ((_a = w.trigger) === null || _a === void 0 ? void 0 : _a.type) === triggerType; });
    const matched = active.filter((w) => matchesFilters(w, payload));
    const runIds = [];
    for (const wf of matched) {
        try {
            const run = await enqueueRun({
                tenantId,
                workflowId: wf.id,
                triggerType,
                payload,
                triggeredBy: (_c = input.triggeredBy) !== null && _c !== void 0 ? _c : null,
                maxAttempts: (_d = wf.retry_max) !== null && _d !== void 0 ? _d : 3,
            });
            runIds.push(run.id);
            await touchWorkflowLastRun(wf.id, tenantId, run.status);
        }
        catch (err) {
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
export async function dispatchScheduleCron(tenantId, payload = {}) {
    return dispatchTrigger({
        tenantId,
        triggerType: "schedule.cron",
        payload,
    });
}
export async function dispatchScheduleEvent(tenantId, payload) {
    return dispatchTrigger({
        tenantId,
        triggerType: "schedule.event",
        payload,
    });
}
export async function dispatchCrmTrigger(tenantId, event, payload) {
    return dispatchTrigger({ tenantId, triggerType: event, payload });
}
export async function dispatchBillingTrigger(tenantId, event, payload) {
    return dispatchTrigger({ tenantId, triggerType: event, payload });
}
export async function dispatchAssessmentsTrigger(tenantId, event, payload) {
    return dispatchTrigger({ tenantId, triggerType: event, payload });
}
export async function dispatchMessagesTrigger(tenantId, event, payload) {
    return dispatchTrigger({ tenantId, triggerType: event, payload });
}
export async function dispatchProgressEvidence(tenantId, payload) {
    return dispatchTrigger({
        tenantId,
        triggerType: "progress.evidence.added",
        payload,
    });
}
export async function dispatchCustomWebhook(tenantId, workflowId, payload, triggeredBy) {
    var _a, _b;
    await logAudit("automation.webhook.received", {
        tenantId,
        workflowId,
    });
    const { getWorkflow } = await import("./queries");
    const workflow = await getWorkflow(workflowId, tenantId);
    if (!workflow)
        return { runId: null };
    if (workflow.status !== "active")
        return { runId: null };
    if (((_a = workflow.trigger) === null || _a === void 0 ? void 0 : _a.type) !== "custom.webhook")
        return { runId: null };
    if (!matchesFilters(workflow, payload))
        return { runId: null };
    const run = await enqueueRun({
        tenantId,
        workflowId,
        triggerType: "custom.webhook",
        payload,
        triggeredBy: triggeredBy !== null && triggeredBy !== void 0 ? triggeredBy : null,
        maxAttempts: (_b = workflow.retry_max) !== null && _b !== void 0 ? _b : 3,
    });
    await touchWorkflowLastRun(workflowId, tenantId, run.status);
    return { runId: run.id };
}
