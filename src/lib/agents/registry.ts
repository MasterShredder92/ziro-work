import { AgentDefinition, AgentID } from "./types";

const agents: Record<AgentID, AgentDefinition> = {};

export function registerAgent(agent: AgentDefinition) {
  agents[agent.id] = agent;
}

export function getAgent(id: AgentID): AgentDefinition | undefined {
  return agents[id];
}

export function getAgentById(id: AgentID): AgentDefinition | undefined {
  return agents[id];
}

export function listAgents() {
  return Object.values(agents);
}

