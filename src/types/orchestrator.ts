// ── Orchestrator V1 Types ──

export type Runtime = "claude_code" | "browser" | "api" | "manual";
export type TaskRunStatus = "pending" | "running" | "complete" | "failed" | "failed_permanent";
export type ReviewVerdict = "success" | "partial" | "failure" | "needs_review";

// ── Skills ──

export interface Skill {
  id: string;
  slug: string;
  name: string;
  description: string;
  prompt_fragment: string;
  runtime: Runtime;
  tags: string[];
  created_at: string;
}

// ── Agent Templates ──

export interface AgentTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  base_prompt: string;
  supported_runtimes: Runtime[];
  max_skills: number;
  task_types: string[];
  is_active: boolean;
  created_at: string;
}

export interface AgentTemplateSkill {
  id: string;
  template_id: string;
  skill_id: string;
  priority: number;
}

// ── Task Runs ──

export interface TaskRun {
  id: string;
  task_id: string;
  template_id: string | null;
  agent_id: string | null;
  runtime: Runtime;
  skill_ids: string[];
  composed_prompt: string;
  status: TaskRunStatus;
  result: string | null;
  tokens_used: number | null;
  duration_ms: number | null;
  created_at: string;
  completed_at: string | null;
}

// ── STAR Reviews ──

export interface StarReview {
  id: string;
  run_id: string;
  summary: string;
  what_worked: string[];
  what_failed: string[];
  next_action: string | null;
  verdict: ReviewVerdict;
  created_at: string;
}

// ── Routing ──

export interface RouteDecision {
  template: AgentTemplate | null;
  skills: Skill[];
  runtime: Runtime;
  score: number;
  reason: string;
}

export interface ClassifiedTask {
  task_type: string;
  keywords: string[];
  suggested_runtime: Runtime;
}

export interface ProposeNewTemplate {
  proposed: true;
  task_type: string;
  suggested_name: string;
  suggested_skills: string[];
  reason: string;
}
