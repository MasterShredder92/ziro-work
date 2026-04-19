export type AgentAction = {
  id: string;
  agentId: string;
  name: string;
  input: unknown;
  createdAt: number;
};

export type AgentActionResult = {
  actionId: string;
  ok: true;
  output: unknown;
  finishedAt: number;
};

export type AgentActionError = {
  actionId: string;
  ok: false;
  error: unknown;
  finishedAt: number;
};

