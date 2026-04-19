import { runSafe } from "./agentSandbox";
import { executeTool } from "./toolExecutor";
import { recordAgentError, recordAgentRun } from "./agentMetrics";
import { addHistoryEvent } from "./agentHistory";

export async function runAgentTask(
  agentId: string,
  task: () => Promise<unknown>
): Promise<void> {
  const result = await runSafe(async () => {
    void executeTool; // available for tool-using tasks (not invoked by this minimal runner)
    return await task();
  });

  if (result.ok) {
    recordAgentRun(agentId);
    addHistoryEvent(agentId, "task_success");
    return;
  }

  recordAgentError(agentId);
  addHistoryEvent(agentId, "task_error", result.error);
}

