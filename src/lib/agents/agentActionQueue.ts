import type { AgentAction } from "./agentActionTypes";

type QueueItem = { agentId: string; action: AgentAction };

const queue: QueueItem[] = [];

export function enqueueAction(agentId: string, action: AgentAction): void {
  queue.push({ agentId, action });
}

export function dequeueAction(): QueueItem | null {
  return queue.shift() ?? null;
}

export function peekAction(): QueueItem | null {
  return queue[0] ?? null;
}

export function clearActionQueue(): void {
  queue.length = 0;
}

export function getActionQueue(): QueueItem[] {
  return [...queue];
}

