import { normalizeAgentId } from "./types";

export type AgentAction = {
  id: string;
  name: string;
  description: string;
  params?: Record<string, unknown>;
};

/**
 * Static per-agent action catalog.
 * Keyed by normalized agent id (see `normalizeAgentId`).
 */
export const AgentActionSchema: Record<string, AgentAction[]> = {
  ziro: [
    {
      id: "summarize",
      name: "Summarize",
      description: "Summarize the current context into next steps and key risks.",
      params: { maxBullets: 6 },
    },
    {
      id: "triage",
      name: "Triage",
      description: "Identify the most likely root cause and a minimal verification plan.",
      params: { scope: "codebase" },
    },
  ],
  star: [
    {
      id: "route_task",
      name: "Route task",
      description: "Decompose work into streams and propose ownership by agent.",
      params: { parallelism: "auto" },
    },
  ],
};

export async function getActionsForAgent(agentId: string): Promise<AgentAction[]> {
  const key = normalizeAgentId(agentId);
  if (!key) return [];
  return AgentActionSchema[key] || [];
}

