import type { AgentAction } from "./agentActionTypes";

export function createAction(agentId: string, name: string, input: unknown): AgentAction {
  return {
    id: crypto.randomUUID(),
    agentId,
    name,
    input,
    createdAt: Date.now(),
  };
}

