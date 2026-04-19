import type { AgentAction } from "./agentActionTypes";

const actions: Record<string, AgentAction> = {};

export function saveAction(action: AgentAction): void {
  actions[action.id] = action;
}

export function getActionById(actionId: string): AgentAction | null {
  return actions[actionId] ?? null;
}

export function getAllActions(): AgentAction[] {
  return Object.values(actions);
}

export function clearActions(): void {
  for (const k of Object.keys(actions)) delete actions[k];
}

