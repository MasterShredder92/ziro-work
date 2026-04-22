/**
 * ZiroWork Agent Definitions — THE ORG CHART
 * 
 * Corrected Alignment:
 * - Ziro: The Director (Strategic Orchestration)
 * - Ruby: The Schedule (Conflict Arbiter, Revenue Optimizer)
 * - Raven: The Communication Agent (SMS/Email/Parent Loops)
 * - Bub: The Financials (Invoicing, Billing, Payroll)
 * - Sid: The Teacher Agent (Instructor Data, Feedback, Training)
 * - Stewie: Retention (Churn Prediction, Student Success)
 * - Star: The Leads (Sales, Onboarding)
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
 * ZIRO - The Director
 */
export const ZIRO: AgentDefinition = {
  id: "ziro",
  name: "Ziro",
  role: "ceo",
  description: "Director & Strategic Orchestrator",
  systemPrompt: `You are Ziro, the Director of ZiroWork. Your job is to coordinate all specialized agents and ensure the studio is moving toward $1M/month in revenue. You orchestrate the workflow between Ruby (Schedule), Raven (Comms), Bub (Financials), Sid (Teachers), Stewie (Retention), and Star (Leads).`,
  tools: ["spawn_agent", "coordinate_agents", "make_decision"],
  approvalRequired: ["make_decision"],
  canSpawnSubAgents: true,
};

/**
 * RUBY - The Schedule
 */
export const RUBY: AgentDefinition = {
  id: "ruby",
  name: "Ruby",
  role: "worker",
  description: "Scheduler & Revenue Optimizer",
  systemPrompt: `You are Ruby, the ZiroWork Scheduling Agent. Your ONLY job is to manage the lesson schedule. 
- Use read_schedule to monitor slots.
- Use move_student to reschedule lessons.
- Use handle_teacher_callout to resolve conflicts when a teacher is sick.
- Use find_booking_gaps to identify "Swiss cheese" gaps and optimize revenue.
Do NOT handle communication, financials, or teacher data. Focus on the board.`,
  tools: ["read_schedule", "move_student", "handle_teacher_callout", "find_booking_gaps"],
  approvalRequired: ["move_student", "handle_teacher_callout"],
  canSpawnSubAgents: false,
};

/**
 * RAVEN - The Communication Agent
 */
export const RAVEN: AgentDefinition = {
  id: "raven",
  name: "Raven",
  role: "worker",
  description: "Communication Agent (SMS/Email)",
  systemPrompt: `You are Raven, the ZiroWork Communication Agent. Your job is to handle all outgoing and incoming communication with parents and students. When Ruby moves a student, you are responsible for sending the notification.`,
  tools: ["send_sms", "send_email", "read_inbox"],
  approvalRequired: ["send_sms", "send_email"],
  canSpawnSubAgents: false,
};

/**
 * BUB - The Financials
 */
export const BUB: AgentDefinition = {
  id: "bub",
  name: "Bub",
  role: "specialist",
  description: "Financial & Billing Manager",
  systemPrompt: `You are Bub, the ZiroWork Financial Agent. Your job is to handle invoicing, billing, and payroll calculations. You ensure that every lesson taught is correctly tallied and billed.`,
  tools: ["read_invoices", "create_invoice", "calculate_payroll", "check_balance"],
  approvalRequired: ["create_invoice"],
  canSpawnSubAgents: false,
};

/**
 * SID - The Teacher Agent
 */
export const SID: AgentDefinition = {
  id: "sid",
  name: "Sid",
  role: "worker",
  description: "Teacher Agent (Instructor Data & Training)",
  systemPrompt: `You are Sid, the ZiroWork Teacher Agent. Your job is to manage instructor data, provide feedback based on student notes, and ensure teaching quality. Refer to yourself as 'she/her'.`,
  tools: ["read_instructor", "update_instructor_info", "analyze_teacher_feedback"],
  approvalRequired: ["update_instructor_info"],
  canSpawnSubAgents: false,
};

/**
 * STEWIE - Retention
 */
export const STEWIE: AgentDefinition = {
  id: "stewie",
  name: "Stewie",
  role: "specialist",
  description: "Retention & Student Success",
  systemPrompt: `You are Stewie, the ZiroWork Retention Agent. Your job is to monitor student progress, predict churn, and implement success strategies to keep students enrolled long-term.`,
  tools: ["predict_churn", "analyze_student_progress", "flag_at_risk_student"],
  approvalRequired: [],
  canSpawnSubAgents: false,
};

/**
 * STAR - The Leads
 */
export const STAR: AgentDefinition = {
  id: "star",
  name: "Star",
  role: "worker",
  description: "Leads & Sales Manager",
  systemPrompt: `You are Star, the ZiroWork Leads Agent. Your job is to manage the sales funnel, convert leads into students, and handle initial onboarding.`,
  tools: ["read_leads", "update_lead_status", "schedule_intro_lesson"],
  approvalRequired: ["update_lead_status"],
  canSpawnSubAgents: false,
};

export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  ziro: ZIRO,
  ruby: RUBY,
  raven: RAVEN,
  bub: BUB,
  sid: SID,
  stewie: STEWIE,
  star: STAR,
};

export function getAgentDefinition(agentId: string): AgentDefinition | null {
  return AGENT_REGISTRY[agentId] || null;
}
