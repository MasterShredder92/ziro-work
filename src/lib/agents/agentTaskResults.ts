import type { AgentTaskError, AgentTaskResult } from "./agentTaskTypes";

const results: Record<string, AgentTaskResult | AgentTaskError> = {};

export function saveTaskResult(result: AgentTaskResult | AgentTaskError): void {
  results[result.taskId] = result;
}

export function getTaskResult(taskId: string): AgentTaskResult | AgentTaskError | null {
  return results[taskId] ?? null;
}

export function getAllTaskResults(): (AgentTaskResult | AgentTaskError)[] {
  return Object.values(results);
}

export function clearTaskResults(): void {
  for (const key of Object.keys(results)) {
    delete results[key];
  }
}

