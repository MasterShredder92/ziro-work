import "server-only";
import { listAutomationWorkflows as listWorkflowsData, getAutomationWorkflow as getWorkflowData, upsertAutomationWorkflow as upsertWorkflowData, deleteAutomationWorkflow as deleteWorkflowData, updateWorkflowRunMetadata, } from "@data/automationWorkflows";
import { listAutomationRuns as listRunsData, getAutomationRun as getRunData, upsertAutomationRun as upsertRunData, countRunningForTenant as countRunningForTenantData, countRunningForWorkflow as countRunningForWorkflowData, } from "@data/automationRuns";
import { listAutomationLogs as listLogsData, insertAutomationLog as insertLogData, } from "@data/automationLogs";
export async function listWorkflows(tenantId, filter) {
    return listWorkflowsData(tenantId, filter);
}
export async function getWorkflow(workflowId, tenantId) {
    return getWorkflowData(workflowId, tenantId);
}
export async function createWorkflow(tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g;
    return upsertWorkflowData(tenantId, {
        name: input.name,
        description: (_a = input.description) !== null && _a !== void 0 ? _a : null,
        status: (_b = input.status) !== null && _b !== void 0 ? _b : "draft",
        trigger: input.trigger,
        actions: input.actions,
        concurrency_limit: (_c = input.concurrencyLimit) !== null && _c !== void 0 ? _c : null,
        retry_max: (_d = input.retryMax) !== null && _d !== void 0 ? _d : 3,
        retry_backoff_ms: (_e = input.retryBackoffMs) !== null && _e !== void 0 ? _e : 1000,
        tags: (_f = input.tags) !== null && _f !== void 0 ? _f : [],
        created_by: (_g = input.createdBy) !== null && _g !== void 0 ? _g : null,
    });
}
export async function updateWorkflow(workflowId, tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const existing = await getWorkflowData(workflowId, tenantId);
    if (!existing)
        throw new Error("AUTOMATION_WORKFLOW_NOT_FOUND");
    return upsertWorkflowData(tenantId, {
        id: existing.id,
        name: (_a = input.name) !== null && _a !== void 0 ? _a : existing.name,
        description: input.description === undefined ? existing.description : input.description,
        status: (_b = input.status) !== null && _b !== void 0 ? _b : existing.status,
        trigger: (_c = input.trigger) !== null && _c !== void 0 ? _c : existing.trigger,
        actions: (_d = input.actions) !== null && _d !== void 0 ? _d : existing.actions,
        concurrency_limit: input.concurrencyLimit === undefined
            ? existing.concurrency_limit
            : input.concurrencyLimit,
        retry_max: (_e = input.retryMax) !== null && _e !== void 0 ? _e : existing.retry_max,
        retry_backoff_ms: (_f = input.retryBackoffMs) !== null && _f !== void 0 ? _f : existing.retry_backoff_ms,
        tags: (_g = input.tags) !== null && _g !== void 0 ? _g : existing.tags,
        created_at: existing.created_at,
        created_by: existing.created_by,
    });
}
export async function deleteWorkflow(workflowId, tenantId) {
    await deleteWorkflowData(workflowId, tenantId);
}
export async function listRuns(tenantId, filter, opts) {
    return listRunsData(tenantId, filter, opts);
}
export async function getRun(runId, tenantId) {
    return getRunData(runId, tenantId);
}
export async function upsertRun(tenantId, input) {
    return upsertRunData(tenantId, input);
}
export async function logAutomation(tenantId, input) {
    var _a, _b, _c, _d, _e;
    return insertLogData(tenantId, {
        run_id: (_a = input.runId) !== null && _a !== void 0 ? _a : null,
        workflow_id: (_b = input.workflowId) !== null && _b !== void 0 ? _b : null,
        action_id: (_c = input.actionId) !== null && _c !== void 0 ? _c : null,
        level: (_d = input.level) !== null && _d !== void 0 ? _d : "info",
        message: input.message,
        data: (_e = input.data) !== null && _e !== void 0 ? _e : null,
    });
}
export async function listLogs(tenantId, filter) {
    return listLogsData(tenantId, filter);
}
export async function touchWorkflowLastRun(workflowId, tenantId, status) {
    await updateWorkflowRunMetadata(workflowId, tenantId, new Date().toISOString(), status);
}
export async function countRunningForTenant(tenantId) {
    return countRunningForTenantData(tenantId);
}
export async function countRunningForWorkflow(tenantId, workflowId) {
    return countRunningForWorkflowData(tenantId, workflowId);
}
