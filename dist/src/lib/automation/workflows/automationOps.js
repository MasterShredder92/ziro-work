import "server-only";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { createWorkflowForTenant, deleteWorkflowForTenant, runWorkflowManually, updateWorkflowForTenant, } from "./service";
import { listWorkflows as listWorkflowsQuery } from "./queries";
import { dispatchTrigger } from "./triggers";
import { runAction } from "./actions";
export async function createWorkflow(input) {
    var _a;
    const tenantId = ((_a = input.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    const rest = Object.assign({}, input);
    delete rest.tenantId;
    return createWorkflowForTenant(tenantId, rest);
}
export async function updateWorkflow(workflowId, input) {
    var _a;
    const tenantId = ((_a = input.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    const rest = Object.assign({}, input);
    delete rest.tenantId;
    return updateWorkflowForTenant(workflowId, tenantId, rest);
}
export async function deleteWorkflow(workflowId, tenantId) {
    const resolvedTenantId = (tenantId === null || tenantId === void 0 ? void 0 : tenantId.trim()) || DEFAULT_TENANT_ID;
    return deleteWorkflowForTenant(workflowId, resolvedTenantId);
}
export async function listWorkflows(tenantId) {
    const resolvedTenantId = (tenantId === null || tenantId === void 0 ? void 0 : tenantId.trim()) || DEFAULT_TENANT_ID;
    return listWorkflowsQuery(resolvedTenantId);
}
export async function runWorkflow(workflowId, input = {}) {
    var _a, _b, _c;
    const tenantId = ((_a = input.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    return runWorkflowManually(workflowId, tenantId, {
        payload: (_b = input.payload) !== null && _b !== void 0 ? _b : {},
        triggeredBy: (_c = input.triggeredBy) !== null && _c !== void 0 ? _c : null,
    });
}
export async function evaluateTriggers(input) {
    var _a, _b, _c;
    const tenantId = ((_a = input.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    return dispatchTrigger({
        tenantId,
        triggerType: input.triggerType,
        payload: (_b = input.payload) !== null && _b !== void 0 ? _b : {},
        triggeredBy: (_c = input.triggeredBy) !== null && _c !== void 0 ? _c : null,
    });
}
export async function executeActions(input) {
    var _a, _b;
    const tenantId = ((_a = input.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    const ctx = {
        tenantId,
        workflowId: input.workflowId,
        runId: input.runId,
        triggerType: input.triggerType,
        payload: input.payload,
        triggeredBy: (_b = input.triggeredBy) !== null && _b !== void 0 ? _b : null,
    };
    const results = [];
    for (const action of input.actions) {
        const result = await runAction(action, ctx);
        results.push(Object.assign({ actionId: action.id, type: action.type }, result));
    }
    return results;
}
