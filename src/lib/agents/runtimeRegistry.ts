import type { AgentDefinition } from "./types";

const runtimeRegistry = new Map<string, AgentDefinition>();

export function registerAgent(agent: AgentDefinition) {
  runtimeRegistry.set(agent.id, agent);
}

export function getAgent(agentId: string): AgentDefinition | null {
  return runtimeRegistry.get(agentId) ?? null;
}

export function listAgents(): AgentDefinition[] {
  return Array.from(runtimeRegistry.values());
}

