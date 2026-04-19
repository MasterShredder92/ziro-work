import { normalizeAgentId } from "./types";

const stateByAgentId = new Map<string, unknown>();

export function setAgentState(agentId: string, state: unknown): void {
  const id = normalizeAgentId(agentId);
  if (!id) return;
  stateByAgentId.set(id, state);
}

export function getAgentState(agentId: string): unknown | null {
  const id = normalizeAgentId(agentId);
  if (!id) return null;
  return stateByAgentId.has(id) ? stateByAgentId.get(id) : null;
}

export function clearAgentState(agentId: string): void {
  const id = normalizeAgentId(agentId);
  if (!id) return;
  stateByAgentId.delete(id);
}

export function getAllAgentStates(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [id, state] of stateByAgentId.entries()) {
    out[id] = state;
  }
  return out;
}

