import { enqueue as enqueueRaw } from "./taskQueue";

/**
 * Minimal scheduler wrapper over the in-memory task queue.
 * Does not execute tasks; only enqueues.
 */
export function enqueue(agentId: string, task: () => Promise<unknown>) {
  enqueueRaw({
    name: agentId,
    payload: { task },
    createdAt: Date.now(),
  });
}

