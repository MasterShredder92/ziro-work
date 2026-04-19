import { normalizeAgentId } from "./types";

type QueuedTask = { agentId: string; task: () => Promise<unknown> };

const queue: QueuedTask[] = [];

export function submitTask(agentId: string, task: () => Promise<unknown>): void {
  const id = normalizeAgentId(agentId);
  if (!id) return;
  queue.push({ agentId: id, task });
}

export function takeNextTask(): QueuedTask | null {
  return queue.shift() ?? null;
}

export function getQueuedTaskCount(): number {
  return queue.length;
}

