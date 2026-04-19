export type AgentTask = {
  id: string;
  agentId: string;
  payload: unknown;
  createdAt: number;
};

export type AgentTaskResult = {
  taskId: string;
  ok: true;
  result: unknown;
  finishedAt: number;
};

export type AgentTaskError = {
  taskId: string;
  ok: false;
  error: unknown;
  finishedAt: number;
};

