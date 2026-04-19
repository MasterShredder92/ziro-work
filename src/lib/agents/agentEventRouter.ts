import * as eventBus from "./eventBus";
import { addHistoryEvent } from "./agentHistory";
import { recordAgentError, recordAgentRun } from "./agentMetrics";
import { normalizeAgentId } from "./types";

type AgentEventPayload = {
  agentId: string;
  event: string;
  meta?: unknown;
};

async function tryLifecycle(method: "markRunning" | "markIdle" | "markError", agentId: string) {
  try {
    const mod: unknown = await import("./agentLifecycle");
    const fn = (mod as Record<string, unknown>)[method];
    if (typeof fn === "function") (fn as (id: string) => void)(agentId);
  } catch {
    // optional
  }
}

export function initAgentEventRouter(): void {
  eventBus.subscribe("agent_event", (payload: AgentEventPayload) => {
    try {
      const agentId = normalizeAgentId(payload?.agentId ?? "");
      const event = typeof payload?.event === "string" ? payload.event : "";
      const meta = payload?.meta ?? null;
      if (!agentId || !event) return;

      addHistoryEvent(agentId, event, meta);

      if (event === "task_success") {
        recordAgentRun(agentId);
        void tryLifecycle("markIdle", agentId);
      }

      if (event === "task_error") {
        recordAgentError(agentId);
        void tryLifecycle("markError", agentId);
      }
    } catch {
      // must not throw
    }
  });
}

