import * as agentState from "./stateTracker";

export function markRunning(agentId: string) {
  agentState.setAgentState(agentId, { status: "running", lastRun: Date.now() });
}

export function markIdle(agentId: string) {
  agentState.setAgentState(agentId, { status: "idle" });
}

export function markError(agentId: string) {
  agentState.setAgentState(agentId, { status: "error", lastError: Date.now() });
}

