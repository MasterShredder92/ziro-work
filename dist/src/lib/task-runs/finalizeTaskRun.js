import { getServiceClient } from "@/lib/supabase";
// Finalize a task_runs row on completion or failure
export async function finalizeTaskRun(input) {
    const supabase = getServiceClient();
    const status = input.success ? "complete" : "failed";
    const now = new Date().toISOString();
    // Update task_runs
    const { error: runError } = await supabase
        .from("task_runs")
        .update({
        status,
        result_snapshot: input.resultSnapshot,
        duration_ms: input.durationMs,
        tokens_in: input.tokensIn || null,
        tokens_out: input.tokensOut || null,
        estimated_cost: input.estimatedCost || null,
        error_message: input.errorMessage || null,
        completed_at: now,
    })
        .eq("id", input.runId);
    if (runError) {
        console.error(`[TASK_RUN] Failed to finalize run ${input.runId}: ${runError.message}`);
    }
    // Update failure_stage on agent_tasks if failed
    if (!input.success && input.failureStage) {
        await supabase
            .from("agent_tasks")
            .update({
            failure_stage: input.failureStage,
            updated_at: now,
        })
            .eq("id", input.taskId);
    }
    console.log(`[TASK_RUN] Finalized run ${input.runId} — ${status} (${input.durationMs || 0}ms)`);
}
