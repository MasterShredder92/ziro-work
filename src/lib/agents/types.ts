export type AgentID = string;
export type EventName = string;
export type TaskName = string;

export interface AgentContext {
  tenantId: string;
  userId?: string;
  role?: string;
  page?: string;
  data?: any;
  tools?: any;
  supabase?: any;
}

export interface AgentEvent {
  name: EventName;
  payload: any;
  timestamp: number;
}

export interface AgentTask {
  name: TaskName;
  payload: any;
  createdAt: number;
}

export interface AgentDefinition {
  id: AgentID;
  name: string;
  description: string;
  run: (ctx: AgentContext) => Promise<void>;
  onEvent?: (event: AgentEvent, ctx: AgentContext) => Promise<void>;
  onTask?: (task: AgentTask, ctx: AgentContext) => Promise<void>;
}

export interface ToolDefinition {
  name: string;
  run: (args: any, ctx: AgentContext) => Promise<any>;
}

export interface MemoryStore {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
}

