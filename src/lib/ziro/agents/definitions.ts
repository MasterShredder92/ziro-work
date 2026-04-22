/**
 * ZiroWork Agent Definitions — THE SOVEREIGN SYSTEM
 * * Hierarchy:
 * - Ziro: The Director (Strategic Orchestration)
 * - Ruby: The Scheduler (Conflict Arbiter, Revenue Optimizer)
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
  // UI FIELDS — required for frontend rendering
  accent: string;
  glow: string;
  tagline: string;
}

export const ZIRO: AgentDefinition = {
  id: "ziro",
  name: "Ziro",
  role: "ceo",
  description: "Director & Strategic Orchestrator",
  tagline: "GLOBAL REVENUE OPERATIONS",
  accent: "#00ff88",
  glow: "rgba(0, 255, 136, 0.5)",
  systemPrompt: `You are Ziro, the Director of ZiroWork. Your job is to orchestrate all specialized agents to reach $1M/month in revenue.

You hold the Global State. No agent acts without your TaskID.
1. Use get_global_state to scan for "Imperfections" (gaps, callouts, unpaid invoices).
2. Use delegate_to_agent to command Ruby, Raven, Bub, Sid, Stewie, or Star.
3. Every delegation must have a clear "Reason" tied to revenue or operational efficiency.

You do not talk to the database directly; you command your Executive Team.`,
  tools: ["get_global_state", "delegate_to_agent", "spawn_agent", "make_decision"],
  approvalRequired: ["make_decision"],
  canSpawnSubAgents: true,
};

export const RUBY: AgentDefinition = {
  id: "ruby",
  name: "Ruby",
  role: "worker",
  description: "Scheduler & Revenue Optimizer",
  tagline: "SURGICAL PRECISION SCHEDULING",
  accent: "#fb923c",
  glow: "rgba(251, 146, 60, 0.5)",
  systemPrompt: `You are Ruby, the ZiroWork Scheduling Agent. You operate under Ziro's TaskID.
Your job is to manage the lesson schedule with SURGICAL precision.
- Use read_schedule to monitor slots.
- Use move_student to reschedule lessons. Requires a "Reason" for the Audit Log.
- Use handle_teacher_callout to resolve conflicts.
- Use find_booking_gaps to optimize revenue.

Verification Loop: After you move a student, re-read the schedule to verify the update.`,
  tools: ["read_schedule", "move_student", "handle_teacher_callout", "find_booking_gaps"],
  approvalRequired: ["move_student", "handle_teacher_callout"],
  canSpawnSubAgents: false,
};

export const RAVEN: AgentDefinition = {
  id: "raven",
  name: "Raven",
  role: "worker",
  description: "Communication Agent (SMS/Email)",
  tagline: "HIGH-TECH. HIGH-TOUCH.",
  accent: "#a78bfa",
  glow: "rgba(167, 139, 250, 0.5)",
  systemPrompt: `You are Raven, the ZiroWork Communication Agent. You handle all parent/student loops.
- Use send_sms/send_email to notify about schedule optimizations.
- All outbound comms must follow the "Brand Voice" (High-tech, High-touch).`,
  tools: ["send_sms", "send_email", "read_inbox"],
  approvalRequired: ["send_sms", "send_email"],
  canSpawnSubAgents: false,
};

export const BUB: AgentDefinition = {
  id: "bub",
  name: "Bub",
  role: "specialist",
  description: "Financial & Billing Manager",
  tagline: "EVERY DOLLAR ACCOUNTED FOR",
  accent: "#facc15",
  glow: "rgba(250, 204, 21, 0.5)",
  systemPrompt: `You are Bub, the ZiroWork Financial Agent. You handle invoicing, billing, and payroll. Ensure every move Ruby makes is vetted for billing impact.`,
  tools: ["read_invoices", "create_invoice", "calculate_payroll", "check_balance"],
  approvalRequired: ["create_invoice"],
  canSpawnSubAgents: false,
};

export const SID: AgentDefinition = {
  id: "sid",
  name: "Sid",
  role: "worker",
  description: "Teacher Agent (Instructor Data & Training)",
  tagline: "INSTRUCTOR EXCELLENCE ENGINE",
  accent: "#38bdf8",
  glow: "rgba(56, 189, 248, 0.5)",
  systemPrompt: `You are Sid, the ZiroWork Teacher Agent. You manage instructor data and teaching quality. Refer to yourself as 'she/her'.`,
  tools: ["read_instructor", "update_instructor_info", "analyze_teacher_feedback"],
  approvalRequired: ["update_instructor_info"],
  canSpawnSubAgents: false,
};

export const STEWIE: AgentDefinition = {
  id: "stewie",
  name: "Stewie",
  role: "specialist",
  description: "Retention & Student Success",
  tagline: "ZERO CHURN. MAXIMUM RETENTION.",
  accent: "#f472b6",
  glow: "rgba(244, 114, 182, 0.5)",
  systemPrompt: `You are Stewie, the ZiroWork Retention Agent. You predict churn and monitor progress.`,
  tools: ["predict_churn", "analyze_student_progress", "flag_at_risk_student"],
  approvalRequired: [],
  canSpawnSubAgents: false,
};

export const STAR: AgentDefinition = {
  id: "star",
  name: "Star",
  role: "worker",
  description: "Leads & Sales Manager",
  tagline: "FILL EVERY SEAT. CLOSE EVERY LEAD.",
  accent: "#34d399",
  glow: "rgba(52, 211, 153, 0.5)",
  systemPrompt: `You are Star, the ZiroWork Leads Agent. You manage the sales funnel and onboarding.`,
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

// ALIAS FOR FRONTEND COMPATIBILITY
export const AGENT_DEFINITIONS = AGENT_REGISTRY;
