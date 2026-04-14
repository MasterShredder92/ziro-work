// ── Orchestrator Types — matches live Ziro Work Supabase schema ──

export type Runtime = "claude_code" | "browser" | "api" | "manual";

export type TaskCategory = "code" | "crm" | "outreach" | "content" | "analytics" | "ops";

export type TaskRunStatus = "pending" | "running" | "complete" | "failed" | "failed_permanent";

export type ReviewVerdict = "approved" | "retry" | "escalate" | "needs_human";

export type ReviewStatus = "approved" | "retry" | "escalate" | "needs_human" | null;

export type AgentMode = "persistent" | "ephemeral";

// ── Skills ──

export type SkillApprovalStatus = "draft" | "pending_approval" | "approved" | "rejected";

export interface Skill {
  id: string;
  key: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  system_prompt_fragment: string;
  prompt_fragment: string;
  preferred_runtime: Runtime;
  runtime: Runtime;
  allowed_tools: string[];
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  cost_tier: number;
  risk_tier: number;
  tags: string[];
  is_active: boolean;
  approval_status: SkillApprovalStatus;
  proposed_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  business_context: string;
  version: number;
  created_at: string;
  updated_at: string;
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
  business_context: string;
  created_at: string;
}

export interface AgentTemplateSkill {
  id: string;
  template_id: string;
  skill_id: string;
  priority: number;
}

// ── Zirorbs (agent clusters under Star) ──

export type ZirorbFamily = "core" | "vertical";

export interface Zirorb {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  family: ZirorbFamily;
  accent_color: string;
  sort_order: number;
  /** Organization board X (0–100), null = client auto layout */
  board_x?: number | null;
  board_y?: number | null;
  created_at: string;
  updated_at: string;
}

// ── Agents (extended) ──

export interface Agent {
  id: string;
  slug: string;
  name: string;
  role: string;
  status: string;
  system_prompt: string | null;
  color: string;
  position_x: number;
  position_y: number;
  template_id: string | null;
  mode: AgentMode | null;
  current_load: number;
  last_heartbeat_at: string | null;
  created_by: string | null;
  reason_created: string | null;
  approved_by: string | null;
  is_visible_in_ui: boolean;
  is_archived: boolean;
  business_context: string;
  updated_at: string | null;
  created_at: string;
  // Profile fields
  purpose: string | null;
  instructions: string | null;
  usage_triggers: string[];
  auto_use_by_star: boolean;
  profile_summary: string | null;
  owner_type: string;
  /** FK to zirorbs; absent or null means unassigned in UI */
  zirorb_id?: string | null;
  /** Order within a Zirorb on the org board */
  zirorb_sort?: number;
}

// ── Agent Tasks (extended) ──

export interface AgentTask {
  id: string;
  agent_id: string;
  title: string;
  description: string | null;
  status: string;
  result: string | null;
  created_at: string;
  completed_at: string | null;
  retry_count: number;
  updated_at: string | null;
  task_type: TaskCategory | null;
  goal_id: string | null;
  project_id: string | null;
  agent_template_id: string | null;
  skill_ids: string[] | null;
  runtime: Runtime | null;
  budget_tokens: number | null;
  budget_dollars: number | null;
  priority: number | null;
  review_summary: string | null;
  review_status: ReviewStatus;
  artifact_urls: string[] | null;
  failure_stage: string | null;
  started_at: string | null;
}

// ── Task Runs ──

export interface TaskRun {
  id: string;
  task_id: string | null;
  template_id: string | null;
  agent_id: string | null;
  runtime: Runtime;
  skill_ids: string[];
  composed_prompt: string | null;
  status: TaskRunStatus;
  result: string | null;
  duration_ms: number | null;
  attempt_number: number;
  worker_id: string | null;
  input_snapshot: string | null;
  result_snapshot: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  estimated_cost: number | null;
  error_message: string | null;
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

// ── Task Threads ──

export type ThreadStatus = "open" | "closed" | "archived";
export type SenderType = "user" | "star" | "agent" | "system";
export type MessageType = "instruction" | "tool_call" | "result" | "error" | "review" | "status";
export type ArtifactType = "file" | "url" | "screenshot" | "log" | "diff" | "report" | "other";

export interface TaskThread {
  id: string;
  task_id: string;
  agent_id: string | null;
  parent_chat_id: string | null;
  thread_title: string;
  started_at: string;
  ended_at: string | null;
  status: ThreadStatus;
  summary: string | null;
  created_at: string;
}

export interface TaskMessage {
  id: string;
  thread_id: string;
  sender_type: SenderType;
  sender_name: string | null;
  message_type: MessageType;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TaskArtifact {
  id: string;
  task_id: string;
  run_id: string | null;
  artifact_type: ArtifactType;
  title: string;
  url_or_path: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TaskFailure {
  id: string;
  task_id: string;
  run_id: string | null;
  failure_stage: string;
  error_code: string | null;
  error_message: string | null;
  recoverable: boolean;
  recovery_action: string | null;
  created_at: string;
}

// ── Routing ──

export interface RouteDecision {
  template: AgentTemplate;
  skills: Skill[];
  runtime: Runtime;
  score: number;
  reason: string;
}

export interface RouteFallback {
  template: null;
  skills: [];
  runtime: Runtime;
  score: 0;
  reason: string;
}

export interface ClassifiedTask {
  task_type: TaskCategory;
  keywords: string[];
  suggested_runtime: Runtime;
}

export interface TemplateProposal {
  proposed: true;
  task_type: TaskCategory;
  suggested_name: string;
  suggested_skills: string[];
  reason: string;
}

export type RouteResult = RouteDecision | RouteFallback | TemplateProposal;

// Type guard helpers
export function isRouteDecision(r: RouteResult): r is RouteDecision {
  return !("proposed" in r) && "template" in r && r.template !== null;
}

export function isTemplateProposal(r: RouteResult): r is TemplateProposal {
  return "proposed" in r && r.proposed === true;
}
