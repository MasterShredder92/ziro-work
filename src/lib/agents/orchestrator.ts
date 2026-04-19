import { publish } from "./eventBus";
import { getAgent } from "./registry";
import { loadAgentPersonality } from "./personality";
import { getActionsForAgent } from "./actions";
import { normalizeAgentId } from "./types";

export async function runAgentAction(
  agentId: string,
  actionId: string,
  params?: unknown
): Promise<
  | { ok: true; result: { actionId: string; params: unknown } }
  | { ok: false; error: string }
> {
  const normalizedAgentId = normalizeAgentId(agentId);
  const normalizedActionId = typeof actionId === "string" ? actionId.trim() : "";

  if (!normalizedAgentId) {
    return { ok: false, error: "Invalid agentId" };
  }
  if (!normalizedActionId) {
    return { ok: false, error: "Invalid actionId" };
  }

  const agent = getAgent(normalizedAgentId);
  const personality = await loadAgentPersonality(normalizedAgentId);
  const actions = await getActionsForAgent(normalizedAgentId);

  const action = actions.find((a) => a.id === normalizedActionId) ?? null;

  if (!action) {
    return { ok: false, error: `Unknown action '${normalizedActionId}' for agent '${normalizedAgentId}'` };
  }

  const startPayload = {
    agentId: normalizedAgentId,
    actionId: normalizedActionId,
    params: params ?? null,
    agent,
    personality,
    action,
    timestamp: Date.now(),
  };

  try {
    publish("agent:action:start", startPayload);

    const result = { actionId: normalizedActionId, params };

    publish("agent:action:success", {
      ...startPayload,
      result,
      timestamp: Date.now(),
    });

    return { ok: true, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    publish("agent:action:error", {
      ...startPayload,
      error: message,
      timestamp: Date.now(),
    });
    return { ok: false, error: message };
  }
}

export async function runAgentEvent(
  agentId: string,
  eventName: string,
  payload?: unknown
): Promise<{ ok: true }> {
  const normalizedAgentId = normalizeAgentId(agentId);
  const name = typeof eventName === "string" ? eventName.trim() : "";

  if (!normalizedAgentId || !name) {
    return { ok: true };
  }

  const agent = getAgent(normalizedAgentId);
  const personality = await loadAgentPersonality(normalizedAgentId);
  const actions = await getActionsForAgent(normalizedAgentId);

  publish(name, {
    agentId: normalizedAgentId,
    agent,
    personality,
    actions,
    payload: payload ?? null,
    timestamp: Date.now(),
  });

  return { ok: true };
}
