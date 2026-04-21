import "server-only";
import { logAudit } from "@/lib/audit/log";
import { runAction } from "./actions";
import { countRunningForTenant, countRunningForWorkflow, getRun, getWorkflow, listLogs, logAutomation, touchWorkflowLastRun, upsertRun, } from "./queries";
import { enqueueJob } from "@/lib/queue/queries";
const DEFAULT_TENANT_CONCURRENCY = 20;
function nowIso() {
    return new Date().toISOString();
}
function computeBackoffMs(attempt, baseMs) {
    const clamped = Math.max(0, attempt);
    return Math.min(60000, baseMs * Math.pow(2, clamped));
}
export async function enqueueRun(input) {
    var _a, _b, _c;
    const workflow = await getWorkflow(input.workflowId, input.tenantId);
    if (!workflow)
        throw new Error("AUTOMATION_WORKFLOW_NOT_FOUND");
    if (workflow.status !== "active")
        throw new Error("AUTOMATION_WORKFLOW_INACTIVE");
    const tenantRunning = await countRunningForTenant(input.tenantId);
    if (tenantRunning >= DEFAULT_TENANT_CONCURRENCY) {
        await logAudit("automation.run.throttled_tenant", {
            tenantId: input.tenantId,
            workflowId: input.workflowId,
            running: tenantRunning,
        });
    }
    if (workflow.concurrency_limit && workflow.concurrency_limit > 0) {
        const wfRunning = await countRunningForWorkflow(input.tenantId, input.workflowId);
        if (wfRunning >= workflow.concurrency_limit) {
            await logAudit("automation.run.throttled_workflow", {
                tenantId: input.tenantId,
                workflowId: input.workflowId,
                running: wfRunning,
                limit: workflow.concurrency_limit,
            });
        }
    }
    const run = await upsertRun(input.tenantId, {
        workflow_id: input.workflowId,
        trigger_type: input.triggerType,
        status: "queued",
        payload: input.payload,
        steps: [],
        attempt: 0,
        max_attempts: (_b = (_a = input.maxAttempts) !== null && _a !== void 0 ? _a : workflow.retry_max) !== null && _b !== void 0 ? _b : 3,
        started_at: nowIso(),
        finished_at: null,
        duration_ms: null,
        error: null,
        triggered_by: (_c = input.triggeredBy) !== null && _c !== void 0 ? _c : null,
    });
    await logAutomation(input.tenantId, {
        runId: run.id,
        workflowId: run.workflow_id,
        level: "info",
        message: "Run enqueued",
        data: { triggerType: run.trigger_type },
    });
    const queued = await enqueueJob({
        tenantId: input.tenantId,
        kind: "automation.run",
        payload: {
            runId: run.id,
            tenantId: input.tenantId,
            workflowId: run.workflow_id,
        },
        priority: 50,
    });
    if (!queued) {
        // Queue table may not be available in some environments; fallback to direct execution.
        void executeRun(run.id, input.tenantId).catch(async (err) => {
            await logAutomation(input.tenantId, {
                runId: run.id,
                workflowId: run.workflow_id,
                level: "error",
                message: "Run executor crashed",
                data: { error: err instanceof Error ? err.message : String(err) },
            });
        });
    }
    return run;
}
function findActionById(actions, id) {
    var _a;
    if (!id)
        return null;
    return (_a = actions.find((a) => a.id === id)) !== null && _a !== void 0 ? _a : null;
}
function nextActionAfter(actions, current, branchOverride) {
    var _a;
    if (branchOverride !== undefined && branchOverride !== null) {
        return findActionById(actions, branchOverride);
    }
    if (current.next) {
        return findActionById(actions, current.next);
    }
    const idx = actions.findIndex((a) => a.id === current.id);
    if (idx >= 0 && idx + 1 < actions.length)
        return (_a = actions[idx + 1]) !== null && _a !== void 0 ? _a : null;
    return null;
}
export async function executeRun(runId, tenantId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const startRun = await getRun(runId, tenantId);
    if (!startRun)
        throw new Error("AUTOMATION_RUN_NOT_FOUND");
    if (startRun.status === "cancelled")
        return startRun;
    const workflow = await getWorkflow(startRun.workflow_id, tenantId);
    if (!workflow) {
        return finishRun(startRun, tenantId, "failed", {
            message: "Workflow not found",
            code: "WORKFLOW_NOT_FOUND",
        });
    }
    let run = await upsertRun(tenantId, Object.assign(Object.assign({}, startRun), { status: "running", attempt: startRun.attempt + 1 }));
    await logAutomation(tenantId, {
        runId: run.id,
        workflowId: run.workflow_id,
        level: "info",
        message: `Starting attempt ${run.attempt} of ${run.max_attempts}`,
    });
    const actions = (_a = workflow.actions) !== null && _a !== void 0 ? _a : [];
    if (actions.length === 0) {
        return finishRun(run, tenantId, "succeeded");
    }
    const ctx = {
        tenantId,
        workflowId: workflow.id,
        runId: run.id,
        triggerType: run.trigger_type,
        payload: run.payload,
        triggeredBy: run.triggered_by,
    };
    let current = (_b = actions[0]) !== null && _b !== void 0 ? _b : null;
    const steps = [...run.steps];
    while (current) {
        const stepStart = Date.now();
        const step = {
            actionId: current.id,
            type: current.type,
            status: "running",
            startedAt: nowIso(),
            attempt: run.attempt,
        };
        steps.push(step);
        run = await upsertRun(tenantId, Object.assign(Object.assign({}, run), { steps }));
        await logAutomation(tenantId, {
            runId: run.id,
            workflowId: run.workflow_id,
            actionId: current.id,
            level: "info",
            message: `Executing action ${current.type}`,
        });
        const result = await runAction(current, ctx);
        const finishedAt = nowIso();
        const durationMs = Date.now() - stepStart;
        const lastStep = steps[steps.length - 1];
        lastStep.finishedAt = finishedAt;
        lastStep.durationMs = durationMs;
        lastStep.output = result.output;
        lastStep.error = (_c = result.error) !== null && _c !== void 0 ? _c : null;
        if (!result.ok) {
            lastStep.status = "failed";
            run = await upsertRun(tenantId, Object.assign(Object.assign({}, run), { steps, error: (_d = result.error) !== null && _d !== void 0 ? _d : { message: "Action failed" } }));
            await logAutomation(tenantId, {
                runId: run.id,
                workflowId: run.workflow_id,
                actionId: current.id,
                level: "error",
                message: `Action ${current.type} failed`,
                data: result.error,
            });
            const onError = (_e = current.onError) !== null && _e !== void 0 ? _e : "fail";
            if (onError === "continue") {
                current = nextActionAfter(actions, current);
                continue;
            }
            if (onError === "retry" && run.attempt < run.max_attempts) {
                const backoff = computeBackoffMs(run.attempt, (_f = workflow.retry_backoff_ms) !== null && _f !== void 0 ? _f : 1000);
                await logAutomation(tenantId, {
                    runId: run.id,
                    workflowId: run.workflow_id,
                    level: "warn",
                    message: `Retry scheduled in ${backoff}ms`,
                });
                const queued = await upsertRun(tenantId, Object.assign(Object.assign({}, run), { status: "queued", steps }));
                setTimeout(() => {
                    void executeRun(queued.id, tenantId).catch(() => undefined);
                }, backoff);
                return queued;
            }
            if (run.attempt >= run.max_attempts) {
                return finishRun(run, tenantId, "dead_letter", (_g = result.error) !== null && _g !== void 0 ? _g : null);
            }
            return finishRun(run, tenantId, "failed", (_h = result.error) !== null && _h !== void 0 ? _h : null);
        }
        lastStep.status = "succeeded";
        run = await upsertRun(tenantId, Object.assign(Object.assign({}, run), { steps }));
        if (typeof result.delayMs === "number" && result.delayMs > 0) {
            await logAutomation(tenantId, {
                runId: run.id,
                workflowId: run.workflow_id,
                actionId: current.id,
                level: "info",
                message: `Delaying ${result.delayMs}ms`,
            });
            await new Promise((resolve) => setTimeout(resolve, result.delayMs));
        }
        current = nextActionAfter(actions, current, (_j = result.branchTo) !== null && _j !== void 0 ? _j : undefined);
    }
    return finishRun(run, tenantId, "succeeded");
}
async function finishRun(run, tenantId, status, error) {
    var _a;
    const finishedAt = nowIso();
    const started = new Date(run.started_at).getTime();
    const durationMs = Math.max(0, Date.now() - started);
    const finished = await upsertRun(tenantId, Object.assign(Object.assign({}, run), { status, finished_at: finishedAt, duration_ms: durationMs, error: (_a = error !== null && error !== void 0 ? error : run.error) !== null && _a !== void 0 ? _a : null }));
    await touchWorkflowLastRun(run.workflow_id, tenantId, status);
    await logAutomation(tenantId, {
        runId: finished.id,
        workflowId: finished.workflow_id,
        level: status === "succeeded" ? "info" : "error",
        message: `Run ${status}`,
        data: error ? error : undefined,
    });
    return finished;
}
export async function cancelRun(runId, tenantId) {
    const run = await getRun(runId, tenantId);
    if (!run)
        return null;
    if (run.status === "succeeded" || run.status === "failed")
        return run;
    const cancelled = await upsertRun(tenantId, Object.assign(Object.assign({}, run), { status: "cancelled", finished_at: nowIso() }));
    await logAutomation(tenantId, {
        runId: cancelled.id,
        workflowId: cancelled.workflow_id,
        level: "warn",
        message: "Run cancelled",
    });
    return cancelled;
}
export async function retryDeadLetter(runId, tenantId) {
    const run = await getRun(runId, tenantId);
    if (!run)
        return null;
    if (run.status !== "dead_letter" && run.status !== "failed")
        return run;
    const workflow = await getWorkflow(run.workflow_id, tenantId);
    if (!workflow)
        return null;
    const requeued = await upsertRun(tenantId, Object.assign(Object.assign({}, run), { status: "queued", attempt: 0, steps: [], finished_at: null, duration_ms: null, error: null, started_at: nowIso() }));
    void executeRun(requeued.id, tenantId).catch(() => undefined);
    return requeued;
}
export async function getRunLogs(runId, tenantId) {
    return listLogs(tenantId, { runId });
}
export const __RUNTIME_CONCURRENCY_LIMIT = DEFAULT_TENANT_CONCURRENCY;
