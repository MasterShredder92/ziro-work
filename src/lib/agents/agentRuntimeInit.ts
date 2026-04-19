import { loadAllAgentManifests } from "./agentRegistryLoader";
import { addHistoryEvent } from "./agentHistory";

export function initAgentRuntime(): void {
  loadAllAgentManifests();
  addHistoryEvent("system", "runtime_initialized");
}

export function initAgentRuntime(): void {
  // Intentionally minimal: runtime is initialized by importing modules.
}

