import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { createWorkflow, deleteWorkflow, getRun, getWorkflow, listLogs, listRuns, listWorkflows, updateWorkflow, } from "./queries";
import { cancelRun, enqueueRun, retryDeadLetter } from "./runtime";
function kpisFor(workflows, runs) {
    const total = workflows.length;
    const active = workflows.filter((w) => w.status === "active").length;
    const paused = workflows.filter((w) => w.status === "paused").length;
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const recent = runs.filter((r) => new Date(r.created_at).getTime() >= cutoff);
    const succeeded = recent.filter((r) => r.status === "succeeded").length;
    const failed = recent.filter((r) => r.status === "failed" || r.status === "dead_letter").length;
    const deadLetter = runs.filter((r) => r.status === "dead_letter").length;
    const finished = runs.filter((r) => typeof r.duration_ms === "number" && r.duration_ms >= 0);
    const avgDurationMs = finished.length === 0
        ? 0
        : Math.round(finished.reduce((a, r) => { var _a; return a + ((_a = r.duration_ms) !== null && _a !== void 0 ? _a : 0); }, 0) / finished.length);
    const closed = recent.filter((r) => r.status === "succeeded" || r.status === "failed" || r.status === "dead_letter");
    const successRatePct = closed.length === 0 ? 0 : Math.round((succeeded / closed.length) * 100);
    return {
        totalWorkflows: total,
        activeWorkflows: active,
        pausedWorkflows: paused,
        runsLast24h: recent.length,
        successRatePct,
        failureCountLast24h: failed,
        deadLetterCount: deadLetter,
        avgDurationMs,
    };
}
export async function getAutomationDashboard(tenantId) {
    await assertTenantAccess(tenantId);
    const [workflows, recentRuns] = await Promise.all([
        listWorkflows(tenantId),
        listRuns(tenantId, undefined, { limit: 100 }),
    ]);
    const failures = recentRuns.filter((r) => r.status === "failed" || r.status === "dead_letter");
    return {
        tenantId,
        generatedAt: new Date().toISOString(),
        workflows,
        recentRuns: recentRuns.slice(0, 25),
        failures: failures.slice(0, 25),
        kpis: kpisFor(workflows, recentRuns),
    };
}
export async function getWorkflowSurface(workflowId, tenantId) {
    await assertTenantAccess(tenantId);
    const workflow = await getWorkflow(workflowId, tenantId);
    if (!workflow)
        return null;
    const recentRuns = await listRuns(tenantId, { workflowId }, { limit: 50 });
    return { workflow, recentRuns };
}
export async function getRunSurface(runId, tenantId) {
    await assertTenantAccess(tenantId);
    const run = await getRun(runId, tenantId);
    if (!run)
        return null;
    const [workflow, logs] = await Promise.all([
        getWorkflow(run.workflow_id, tenantId),
        listLogs(tenantId, { runId }),
    ]);
    return { run, workflow, logs };
}
export async function createWorkflowForTenant(tenantId, input) {
    await assertTenantAccess(tenantId);
    return createWorkflow(tenantId, input);
}
export async function updateWorkflowForTenant(workflowId, tenantId, input) {
    await assertTenantAccess(tenantId);
    return updateWorkflow(workflowId, tenantId, input);
}
export async function deleteWorkflowForTenant(workflowId, tenantId) {
    await assertTenantAccess(tenantId);
    await deleteWorkflow(workflowId, tenantId);
}
export async function runWorkflowManually(workflowId, tenantId, opts = {}) {
    var _a, _b, _c, _d, _e;
    await assertTenantAccess(tenantId);
    const workflow = await getWorkflow(workflowId, tenantId);
    if (!workflow)
        throw new Error("AUTOMATION_WORKFLOW_NOT_FOUND");
    return enqueueRun({
        tenantId,
        workflowId,
        triggerType: (_b = (_a = workflow.trigger) === null || _a === void 0 ? void 0 : _a.type) !== null && _b !== void 0 ? _b : "manual.invoke",
        payload: (_c = opts.payload) !== null && _c !== void 0 ? _c : {},
        triggeredBy: (_d = opts.triggeredBy) !== null && _d !== void 0 ? _d : null,
        maxAttempts: (_e = workflow.retry_max) !== null && _e !== void 0 ? _e : 3,
    });
}
export async function cancelRunForTenant(runId, tenantId) {
    await assertTenantAccess(tenantId);
    return cancelRun(runId, tenantId);
}
export async function retryRunForTenant(runId, tenantId) {
    await assertTenantAccess(tenantId);
    return retryDeadLetter(runId, tenantId);
}
