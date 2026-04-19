import { runAgentTask } from "./agentRunner";
import { dequeue, getQueue } from "./taskQueue";

export async function processNext(): Promise<string | null> {
  const queue = getQueue();
  if (queue.length === 0) return null;

  const item = dequeue();
  if (!item) return null;

  const agentId = item.name;

  await runAgentTask(agentId, async () => {
    // Minimal processor: no agent dispatch here; caller provides executable tasks via queue payload.
    // If payload contains a callable task, run it; otherwise no-op.
    const payload =
      item.payload && typeof item.payload === "object"
        ? (item.payload as Record<string, unknown>)
        : null;
    const maybeTask = payload?.task;
    if (typeof maybeTask === "function") {
      return await maybeTask();
    }
    return null;
  });

  return agentId;
}

export async function processAll(): Promise<void> {
  while (getQueue().length > 0) {
    await processNext();
  }
}

