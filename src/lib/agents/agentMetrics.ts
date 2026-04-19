export type AgentMetrics = {
  runs: number;
  errors: number;
  lastRun: number | null;
  lastError: number | null;
};

const metrics: Record<string, AgentMetrics> = {};

function defaultMetrics(): AgentMetrics {
  return { runs: 0, errors: 0, lastRun: null, lastError: null };
}

function ensure(agentId: string): AgentMetrics {
  metrics[agentId] ??= defaultMetrics();
  return metrics[agentId];
}

export function recordAgentRun(agentId: string) {
  const m = ensure(agentId);
  m.runs += 1;
  m.lastRun = Date.now();
}

export function recordAgentError(agentId: string) {
  const m = ensure(agentId);
  m.errors += 1;
  m.lastError = Date.now();
}

export function getAgentMetrics(agentId: string): AgentMetrics {
  return metrics[agentId] ? { ...metrics[agentId] } : defaultMetrics();
}

export function getAllAgentMetrics(): Record<string, AgentMetrics> {
  const copy: Record<string, AgentMetrics> = {};
  for (const [id, m] of Object.entries(metrics)) {
    copy[id] = { ...m };
  }
  return copy;
}

export function clearAgentMetrics() {
  for (const key of Object.keys(metrics)) delete metrics[key];
}

