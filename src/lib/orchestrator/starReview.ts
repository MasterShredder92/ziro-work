import type { ReviewVerdict, StarReview } from "@/types/orchestrator";
import { getServiceClient } from "@/lib/supabase";

interface ReviewInput {
  runId: string;
  taskTitle: string;
  taskDescription: string;
  result: string;
  success: boolean;
  durationMs: number | null;
}

export function generateReview(input: ReviewInput): Omit<StarReview, "id" | "created_at"> {
  const { result, success, taskTitle } = input;
  const resultLower = (result || "").toLowerCase();

  // Determine verdict
  let verdict: ReviewVerdict;
  if (success) {
    // Check for partial signals in output
    const hasWarnings =
      resultLower.includes("warning") ||
      resultLower.includes("skipped") ||
      resultLower.includes("partial");
    verdict = hasWarnings ? "partial" : "success";
  } else {
    verdict = "failure";
  }

  // Extract what worked / what failed from result text
  const what_worked: string[] = [];
  const what_failed: string[] = [];

  if (success) {
    what_worked.push(`Task "${taskTitle}" completed successfully`);
    if (resultLower.includes("commit")) {
      what_worked.push("Changes committed to git");
    }
    if (resultLower.includes("verified") || resultLower.includes("verification")) {
      what_worked.push("Verification checks passed");
    }
  } else {
    what_failed.push(`Task "${taskTitle}" failed`);
    // Try to extract error signal
    const errorLines = result
      .split("\n")
      .filter((l) => /error|failed|exception|cannot/i.test(l))
      .slice(0, 3);
    what_failed.push(...errorLines);
  }

  // Determine next action
  let next_action: string | null = null;
  if (verdict === "failure") {
    next_action = "Review error output. Consider retry with more specific instructions.";
  } else if (verdict === "partial") {
    next_action = "Review warnings and verify full functionality manually.";
  } else {
    next_action = resultLower.includes("ready to push")
      ? "Ready for deployment. Tell STAR to push when ready."
      : null;
  }

  // Build summary
  const durationStr = input.durationMs
    ? ` (${Math.round(input.durationMs / 1000)}s)`
    : "";
  const summary =
    verdict === "success"
      ? `Task completed successfully${durationStr}. ${what_worked.join(". ")}.`
      : verdict === "partial"
        ? `Task completed with warnings${durationStr}. Review recommended.`
        : `Task failed${durationStr}. ${what_failed[0] || "Unknown error"}.`;

  return {
    run_id: input.runId,
    summary,
    what_worked,
    what_failed,
    next_action,
    verdict,
  };
}

export async function saveReview(
  review: Omit<StarReview, "id" | "created_at">
): Promise<string | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("star_reviews")
    .insert(review)
    .select("id")
    .single();

  if (error) {
    console.error(`[REVIEW] Failed to save review: ${error.message}`);
    return null;
  }

  console.log(`[REVIEW] Saved review ${data.id} — verdict: ${review.verdict}`);
  return data.id;
}
