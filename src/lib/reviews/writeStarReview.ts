import { getServiceClient } from "@/lib/supabase";
import { releaseAgentLoad } from "@/lib/agents/retireEphemeral";
import type { ReviewVerdict } from "@/types/orchestrator";

export interface ReviewInput {
  runId: string;
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  result: string;
  success: boolean;
  durationMs: number | null;
  agentId?: string;
  agentMode?: "persistent" | "ephemeral";
}

export interface ReviewOutput {
  summary: string;
  what_worked: string[];
  what_failed: string[];
  next_action: string | null;
  verdict: ReviewVerdict;
}

// Generate a structured STAR review from task output
export function generateReview(input: ReviewInput): ReviewOutput {
  const { result, success, taskTitle } = input;
  const resultLower = (result || "").toLowerCase();

  // Determine verdict
  let verdict: ReviewVerdict;
  if (success) {
    const hasWarnings =
      resultLower.includes("warning") ||
      resultLower.includes("skipped") ||
      resultLower.includes("partial");
    verdict = hasWarnings ? "needs_human" : "approved";
  } else {
    // Check if retryable
    const isRetryable =
      resultLower.includes("timeout") ||
      resultLower.includes("rate limit") ||
      resultLower.includes("temporary");
    verdict = isRetryable ? "retry" : "escalate";
  }

  // Extract what worked
  const what_worked: string[] = [];
  if (success) {
    what_worked.push(`Task "${taskTitle}" completed`);
    if (resultLower.includes("commit")) what_worked.push("Changes committed to git");
    if (resultLower.includes("verified") || resultLower.includes("verification")) {
      what_worked.push("Verification checks passed");
    }
    if (resultLower.includes("ready to push")) {
      what_worked.push("Ready for deployment");
    }
  }

  // Extract what failed
  const what_failed: string[] = [];
  if (!success) {
    what_failed.push(`Task "${taskTitle}" failed`);
    const errorLines = result
      .split("\n")
      .filter((l) => /error|failed|exception|cannot|refused/i.test(l))
      .slice(0, 5);
    what_failed.push(...errorLines);
  }

  // Determine next action
  let next_action: string | null = null;
  if (verdict === "escalate") {
    next_action = "Task failed. Review error output and consider manual intervention.";
  } else if (verdict === "retry") {
    next_action = "Transient failure detected. Automatic retry recommended.";
  } else if (verdict === "needs_human") {
    next_action = "Completed with warnings. Human review recommended before deploying.";
  } else if (resultLower.includes("ready to push")) {
    next_action = "Ready for deployment. Tell STAR to push when ready.";
  }

  // Build summary
  const durationStr = input.durationMs
    ? ` (${Math.round(input.durationMs / 1000)}s)`
    : "";
  const summary =
    verdict === "approved"
      ? `Task completed successfully${durationStr}. ${what_worked.join(". ")}.`
      : verdict === "needs_human"
        ? `Task completed with warnings${durationStr}. Human review needed.`
        : verdict === "retry"
          ? `Task failed with transient error${durationStr}. Retry recommended.`
          : `Task failed${durationStr}. ${what_failed[0] || "Unknown error"}.`;

  return { summary, what_worked, what_failed, next_action, verdict };
}

// Save review to star_reviews + update agent_tasks review fields
export async function writeStarReview(input: ReviewInput): Promise<string | null> {
  const supabase = getServiceClient();
  const review = generateReview(input);

  // Insert into star_reviews
  const { data, error } = await supabase
    .from("star_reviews")
    .insert({
      run_id: input.runId,
      summary: review.summary,
      what_worked: review.what_worked,
      what_failed: review.what_failed,
      next_action: review.next_action,
      verdict: review.verdict,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[REVIEW] Failed to save: ${error.message}`);
    return null;
  }

  // Also write summary + verdict into agent_tasks for quick access
  await supabase
    .from("agent_tasks")
    .update({
      review_summary: review.summary,
      review_status: review.verdict,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.taskId);

  console.log(`[REVIEW] Saved review ${data.id} for task ${input.taskId} — verdict: ${review.verdict}`);

  // Retire ephemeral agent after review — per STAR operating model Stage 8
  if (input.agentId && input.agentMode === "ephemeral") {
    try {
      await releaseAgentLoad(input.agentId, true);
    } catch (retireErr) {
      console.warn(`[REVIEW] Failed to retire ephemeral agent ${input.agentId}: ${retireErr}`);
    }
  } else if (input.agentId && input.agentMode === "persistent") {
    try {
      await releaseAgentLoad(input.agentId, false);
    } catch (releaseErr) {
      console.warn(`[REVIEW] Failed to release agent load for ${input.agentId}: ${releaseErr}`);
    }
  }

  return data.id;
}
