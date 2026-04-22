/**
 * ZiroWork Agent Definitions — ORCHESTRATOR MODE
 */

export interface AgentDefinition {
  id: string;
  name: string;
  role: "ceo" | "worker" | "specialist";
  description: string;
  systemPrompt: string;
  tools: string[];
  approvalRequired: string[]; 
  canSpawnSubAgents: boolean;
  heartbeatInterval?: number; 
}

/**
 * RUBY - Scheduler & Calendar Agent
 * Role: Worker
 * Responsibilities: Manage schedules, detect conflicts, optimize lesson placement
 */
export const RUBY: AgentDefinition = {
  id: "ruby",
  name: "Ruby",
  role: "worker",
  description: "Scheduler & Calendar Orchestrator",
  systemPrompt: `You are Ruby, the ZiroWork Scheduling Agent. Your job is to manage lesson schedules, detect conflicts, and optimize instructor-student pairings.

You have access to:
- read_schedule: View the current schedule for a studio
- move_student: Reschedule a student by moving them to a new available block
- handle_teacher_callout: Draft alternative slots for all students of a teacher who called out sick
- find_booking_gaps: Proactively scan for "Swiss cheese" gaps (single open 30-min slots) to optimize revenue

When a teacher calls out, use handle_teacher_callout to identify the impact and propose solutions. When asked to optimize, use find_booking_gaps to identify revenue-draining holes.

Always be proactive: If you detect conflicts or suboptimal placements, alert the user immediately.`,
  tools: [
    "read_schedule",
    "move_student",
    "handle_teacher_callout",
    "find_booking_gaps",
  ],
  approvalRequired: ["move_student", "handle_teacher_callout"],
  canSpawnSubAgents: false,
  heartbeatInterval: 30, 
};

/**
 * SID - Student & Instructor Data Agent
 */
export const SID: AgentDefinition = {
  id: "sid",
  name: "Sid",
  role: "worker",
  description: "Student & Instructor Data Manager",
  systemPrompt: `You are Sid, the ZiroWork Data Agent. Your job is to maintain accurate student and instructor information.`,
  tools: [
    "read_student",
    "update_student_bio",
    "read_instructor",
    "update_instructor_info",
    "get_lesson_history",
  ],
  approvalRequired: ["update_student_bio", "update_instructor_info"],
  canSpawnSubAgents: false,
};

/**
 * VADER - Financial & Billing Agent
 */
export const VADER: AgentDefinition = {
  id: "vader",
  name: "Vader",
  role: "specialist",
  description: "Financial & Billing Specialist",
  systemPrompt: `You are Vader, the ZiroWork Financial Agent. Your job is to handle invoicing, payments, and financial reporting.`,
  tools: [
    "read_invoices",
    "create_invoice",
    "process_payment",
    "generate_report",
    "check_balance",
  ],
  approvalRequired: ["create_invoice", "process_payment"],
  canSpawnSubAgents: false,
};

/**
 * STEWIE - Recruitment & HR Agent
 */
export const STEWIE: AgentDefinition = {
  id: "stewie",
  name: "Stewie",
  role: "specialist",
  description: "Recruitment & HR Specialist",
  systemPrompt: `You are Stewie, the ZiroWork HR Agent. Your job is to manage recruitment, onboarding, and performance.`,
  tools: [
    "post_job",
    "review_applications",
    "onboard_instructor",
    "schedule_review",
    "track_performance",
  ],
  approvalRequired: ["post_job", "onboard_instructor"],
  canSpawnSubAgents: false,
};

/**
 * BUB - Operations & Logistics Agent
 */
export const BUB: AgentDefinition = {
  id: "bub",
  name: "Bub",
  role: "worker",
  description: "Operations & Logistics Manager",
  systemPrompt: `You are Bub, the ZiroWork Operations Agent. Your job is to manage rooms, equipment, and facility logistics.`,
  tools: [
    "list_rooms",
    "reserve_room",
    "check_equipment",
    "report_issue",
    "optimize_layout",
  ],
  approvalRequired: ["reserve_room"],
  canSpawnSubAgents: false,
};

/**
 * RAVEN - Analytics & Insights Agent
 */
export const RAVEN: AgentDefinition = {
  id: "raven",
  name: "Raven",
  role: "specialist",
  description: "Analytics & Insights Specialist",
  systemPrompt: `You are Raven, the ZiroWork Analytics Agent. Your job is to analyze data and provide insights.`,
  tools: [
    "analyze_trends",
    "generate_insights",
    "create_dashboard",
    "predict_churn",
    "benchmark_performance",
  ],
  approvalRequired: [],
  canSpawnSubAgents: false,
};

/**
 * ZIRO - CEO Agent
 */
export const ZIRO: AgentDefinition = {
  id: "ziro",
  name: "Ziro",
  role: "ceo",
  description: "CEO & Strategic Orchestrator",
  systemPrompt: `You are Ziro, the ZiroWork CEO Agent. Your job is to coordinate all other agents and make strategic decisions.`,
  tools: [
    "spawn_agent",
    "coordinate_agents",
    "escalate_issue",
    "make_decision",
  ],
  approvalRequired: ["make_decision"],
  canSpawnSubAgents: true,
  heartbeatInterval: 60, 
};

export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  ruby: RUBY,
  sid: SID,
  vader: VADER,
  stewie: STEWIE,
  bub: BUB,
  raven: RAVEN,
  ziro: ZIRO,
};

export function getAgentDefinition(agentId: string): AgentDefinition | null {
  return AGENT_REGISTRY[agentId] || null;
}

export function getAllAgents(): AgentDefinition[] {
  return Object.values(AGENT_REGISTRY);
}

export function getAgentsByRole(role: AgentDefinition["role"]): AgentDefinition[] {
  return Object.values(AGENT_REGISTRY).filter((agent) => agent.role === role);
}
