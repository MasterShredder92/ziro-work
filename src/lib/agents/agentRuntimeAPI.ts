import { submitTask } from "./agentOrchestratorBridge";
import { runNextTask } from "./agentRuntimeController";
import { getRuntimeStatus } from "./agentRuntimeStatus";

export function queueTask(agentId: string, task: () => Promise<unknown>): void {
  submitTask(agentId, task);
}

export async function runOne(): Promise<void> {
  await runNextTask();
}

export function getStatus(): ReturnType<typeof getRuntimeStatus> {
  return getRuntimeStatus();
}

