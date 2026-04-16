import { AgentTask } from "./types";

const queue: AgentTask[] = [];

export function enqueue(task: AgentTask) {
  queue.push(task);
}

export function dequeue(): AgentTask | undefined {
  return queue.shift();
}

export function getQueue() {
  return queue;
}

