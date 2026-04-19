export type AgentHistoryEntry = {
  agentId: string;
  event: string;
  meta: unknown;
  timestamp: number;
};

const history: AgentHistoryEntry[] = [];

export function addHistoryEvent(agentId: string, event: string, meta?: unknown) {
  history.push({
    agentId,
    event,
    meta: meta ?? null,
    timestamp: Date.now(),
  });
}

export function getHistoryForAgent(agentId: string): AgentHistoryEntry[] {
  return history.filter((h) => h.agentId === agentId).map((h) => ({ ...h }));
}

export function getAllHistory(): AgentHistoryEntry[] {
  return history.map((h) => ({ ...h }));
}

export function clearHistory() {
  history.length = 0;
}

