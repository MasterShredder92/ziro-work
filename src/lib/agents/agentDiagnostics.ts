import { getLogs } from "./logger";
import { getAllAgentMetrics } from "./agentMetrics";
import { getAllHistory } from "./agentHistory";
import { getAllAgentStates } from "./agentState";

type DiagnosticsSnapshot = {
  logs: ReturnType<typeof getLogs>;
  metrics: ReturnType<typeof getAllAgentMetrics>;
  history: ReturnType<typeof getAllHistory>;
  states: Record<string, unknown>;
};

export function getDiagnosticsSnapshot(): DiagnosticsSnapshot {
  return {
    logs: getLogs(),
    metrics: getAllAgentMetrics(),
    history: getAllHistory(),
    states: getAllAgentStates() || {},
  };
}

