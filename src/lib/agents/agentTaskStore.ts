import type { AgentTask } from "./agentTaskTypes";

const tasks: Record<string, AgentTask> = {};

export function saveTask(task: AgentTask): void {
  tasks[task.id] = task;
}

export function getTask(taskId: string): AgentTask | null {
  return tasks[taskId] ?? null;
}

export function getAllTasks(): AgentTask[] {
  return Object.values(tasks);
}

export function clearTasks(): void {
  for (const key of Object.keys(tasks)) {
    delete tasks[key];
  }
}

