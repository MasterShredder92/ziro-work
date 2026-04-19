import eventBus from "./eventBus";
import { addHistoryEvent } from "./agentHistory";

export function emitAgentEvent(agentId: string, event: string, meta?: unknown): void {
  try {
    eventBus.emit("agent_event", { agentId, event, meta: meta ?? null });
  } catch {
    // bridge must not throw
  }

  try {
    addHistoryEvent(agentId, event, meta);
  } catch {
    // history is best-effort; must not throw
  }
}

