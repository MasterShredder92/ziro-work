import { getAllAgentStates } from "./agentState";
import { getAllAgentMetrics } from "./agentMetrics";
import { getAllHistory, type AgentHistoryEntry } from "./agentHistory";
import { getLogs } from "./logger";

export function getRuntimeStatus(): {
  states: Record<string, unknown>;
  metrics: unknown;
  history: AgentHistoryEntry[];
  logs: ReturnType<typeof getLogs>;
} {
  return {
    states: getAllAgentStates(),
    metrics: getAllAgentMetrics(),
    history: getAllHistory(),
    logs: getLogs(),
  };
}

