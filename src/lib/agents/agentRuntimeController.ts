import { processNext } from "./agentQueueProcessor";
import { markIdle } from "./agentLifecycle";
import { emitAgentEvent } from "./agentEventBusBridge";

export async function runNextTask(): Promise<void> {
  const agentId = await processNext();
  if (!agentId) return;

  markIdle(agentId);
  emitAgentEvent(agentId, "task_completed");
}

