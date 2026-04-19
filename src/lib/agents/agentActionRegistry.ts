import { normalizeAgentId } from "./types";

type Handler = (input: unknown) => Promise<unknown>;

const actions: Record<string, Record<string, Handler>> = {};

export function registerAction(
  agentId: string,
  name: string,
  handler: Handler
): void {
  const id = normalizeAgentId(agentId);
  const actionName = typeof name === "string" ? name.trim() : "";
  if (!id || !actionName) return;

  actions[id] ??= {};
  actions[id][actionName] = handler;
}

export function getAction(agentId: string, name: string): Handler | null {
  const id = normalizeAgentId(agentId);
  const actionName = typeof name === "string" ? name.trim() : "";
  if (!id || !actionName) return null;

  return actions[id]?.[actionName] ?? null;
}

export function getAllActions(): Record<string, Record<string, Handler>> {
  const out: Record<string, Record<string, Handler>> = {};
  for (const [agentId, map] of Object.entries(actions)) {
    out[agentId] = { ...map };
  }
  return out;
}

export function clearActions(): void {
  for (const k of Object.keys(actions)) delete actions[k];
}

