import type { AgentTask } from "./agentTaskTypes";

export function createTask(agentId: string, payload: unknown): AgentTask {
  return {
    id: crypto.randomUUID(),
    agentId,
    payload,
    createdAt: Date.now(),
  };
}

