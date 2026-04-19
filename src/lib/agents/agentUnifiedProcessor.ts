import { processNext } from "./agentQueueProcessor";
import { processNextAction } from "./agentActionProcessor";

export async function processNextUnified(): Promise<
  { type: "task" | "action"; agentId: string } | null
> {
  const taskAgentId = await processNext();
  if (taskAgentId) return { type: "task", agentId: taskAgentId };

  const actionAgentId = await processNextAction();
  if (actionAgentId) return { type: "action", agentId: actionAgentId };

  return null;
}

