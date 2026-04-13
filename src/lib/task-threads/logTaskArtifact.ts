import { getServiceClient } from "@/lib/supabase";
import type { ArtifactType } from "@/types/orchestrator";

/**
 * Log an artifact produced by a task run.
 */
export async function logTaskArtifact(
  taskId: string,
  runId: string | null,
  artifactType: ArtifactType,
  title: string,
  urlOrPath?: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("task_artifacts")
    .insert({
      task_id: taskId,
      run_id: runId,
      artifact_type: artifactType,
      title,
      url_or_path: urlOrPath || null,
      metadata: metadata || {},
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[ARTIFACT] Failed to log artifact for task ${taskId}: ${error.message}`);
    return null;
  }

  return data.id;
}

/**
 * Log a task failure for diagnostics.
 */
export async function logTaskFailure(
  taskId: string,
  runId: string | null,
  failureStage: string,
  errorMessage: string | null,
  recoverable: boolean,
  recoveryAction?: string,
  errorCode?: string
): Promise<string | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("task_failures")
    .insert({
      task_id: taskId,
      run_id: runId,
      failure_stage: failureStage,
      error_code: errorCode || null,
      error_message: errorMessage,
      recoverable,
      recovery_action: recoveryAction || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[FAILURE] Failed to log failure for task ${taskId}: ${error.message}`);
    return null;
  }

  return data.id;
}
