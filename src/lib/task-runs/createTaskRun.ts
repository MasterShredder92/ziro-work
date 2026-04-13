import { getServiceClient } from "@/lib/supabase";
import type { Runtime } from "@/types/orchestrator";

export interface CreateTaskRunInput {
  taskId: string;
  templateId: string | null;
  agentId: string | null;
  runtime: Runtime;
  skillIds: string[];
  composedPrompt: string | null;
  attemptNumber: number;
  workerId?: string;
  inputSnapshot?: string;
}

// Create a task_runs row when execution begins
export async function createTaskRun(input: CreateTaskRunInput): Promise<string | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("task_runs")
    .insert({
      task_id: input.taskId,
      template_id: input.templateId,
      agent_id: input.agentId,
      runtime: input.runtime,
      skill_ids: input.skillIds,
      composed_prompt: input.composedPrompt,
      status: "running",
      attempt_number: input.attemptNumber,
      worker_id: input.workerId || null,
      input_snapshot: input.inputSnapshot || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[TASK_RUN] Failed to create: ${error.message}`);
    return null;
  }

  console.log(`[TASK_RUN] Created run ${data.id} for task ${input.taskId} (attempt ${input.attemptNumber})`);
  return data.id;
}

// Update agent_tasks.started_at when execution begins
export async function markTaskStarted(taskId: string): Promise<void> {
  const supabase = getServiceClient();

  await supabase
    .from("agent_tasks")
    .update({
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);
}
