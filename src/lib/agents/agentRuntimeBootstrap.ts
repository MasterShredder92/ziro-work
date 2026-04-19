import { addHistoryEvent } from "./agentHistory";
import { initAgentEventRouter } from "./agentEventRouter";
import { initAgentRuntime } from "./agentRuntimeInit";

export function bootstrapAgents(): void {
  initAgentRuntime();
  initAgentEventRouter();
  addHistoryEvent("system", "runtime_bootstrapped");
  addHistoryEvent("system", "unified_runtime_ready");
}

