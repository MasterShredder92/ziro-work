import { getAllTaskResults, getTaskResult } from "./agentTaskResults";
import type { AgentTaskError, AgentTaskResult } from "./agentTaskTypes";

export function fetchTaskResult(taskId: string): AgentTaskResult | AgentTaskError | null {
  return getTaskResult(taskId);
}

export function fetchAllTaskResults(): (AgentTaskResult | AgentTaskError)[] {
  return getAllTaskResults();
}
