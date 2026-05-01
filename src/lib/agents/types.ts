export type AgentName =
  | "ZIRO"
  | "RAVEN"
  | "RUBY"
  | "BUB"
  | "ROUSEY"
  | "VADER"
  | "STAR"
  | "SID"
  | "STEWIE";

export type AgentStatus =
  | "idle"
  | "running"
  | "complete"
  | "failed"
  | "stub";

export interface AgentConfig {
  name: AgentName;
  title: string;
  hourlyRate: number;
  reportsTo: AgentName | null;
  description: string;
  color: string;
}

export interface AgentEvent {
  id: string;
  event_id: string;
  event_type: string;
  agent_assigned: AgentName;
  status: AgentStatus;
  input_summary: string | null;
  output_summary: string | null;
  duration_ms: number | null;
  tokens_used: number | null;
  error_message: string | null;
  created_at: string;
  cost_usd: number;
}

export interface AgentStats {
  agent: AgentName;
  config: AgentConfig;
  status: AgentStatus;
  tasksThisMonth: number;
  totalDurationMs: number;
  totalCostUsd: number;
  lastActiveAt: string | null;
  recentEvents: AgentEvent[];
}

export interface CrewDashboardData {
  agents: AgentStats[];
  totalSavedThisMonth: number;
  totalTasksThisMonth: number;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
}

export interface AgentFilterPeriod {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
}
