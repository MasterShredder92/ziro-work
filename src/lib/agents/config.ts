import type { AgentConfig, AgentName } from "./types";

export const AGENT_CONFIGS: Record<AgentName, AgentConfig> = {
  ZIRO: {
    name: "ZIRO",
    title: "Studio Director",
    hourlyRate: 75,
    reportsTo: null,
    description: "Central orchestrator. Routes all events to the correct agent. Never performs tasks directly.",
    color: "#00ff88",
  },
  RAVEN: {
    name: "RAVEN",
    title: "Communications Coordinator",
    hourlyRate: 35,
    reportsTo: "ZIRO",
    description: "All outbound communications. The only agent that contacts families.",
    color: "#a78bfa",
  },
  RUBY: {
    name: "RUBY",
    title: "Scheduling Coordinator",
    hourlyRate: 32,
    reportsTo: "ZIRO",
    description: "Manages all session bookings, rescheduling, and cancellations.",
    color: "#f472b6",
  },
  BUB: {
    name: "BUB",
    title: "Billing Coordinator",
    hourlyRate: 40,
    reportsTo: "ZIRO",
    description: "Handles invoices, payments, and billing records.",
    color: "#34d399",
  },
  ROUSEY: {
    name: "ROUSEY",
    title: "Financial Auditor",
    hourlyRate: 65,
    reportsTo: "BUB",
    description: "Financial integrity check on BUB before anything reaches ZIRO.",
    color: "#fbbf24",
  },
  VADER: {
    name: "VADER",
    title: "Curriculum Director",
    hourlyRate: 58,
    reportsTo: "ZIRO",
    description: "Teacher coordination, lesson plans, and progress tracking.",
    color: "#60a5fa",
  },
  STAR: {
    name: "STAR",
    title: "Intake Coordinator",
    hourlyRate: 38,
    reportsTo: "ZIRO",
    description: "Lead capture, qualification, and pipeline management.",
    color: "#fb923c",
  },
  SID: {
    name: "SID",
    title: "Client Relations Manager",
    hourlyRate: 45,
    reportsTo: "ZIRO",
    description: "Student and family profiles, emotional context layer.",
    color: "#e879f9",
  },
  STEWIE: {
    name: "STEWIE",
    title: "Retention Specialist",
    hourlyRate: 42,
    reportsTo: "ZIRO",
    description: "Churn detection and proactive retention outreach.",
    color: "#38bdf8",
  },
};

export const AGENT_ORDER: AgentName[] = [
  "ZIRO",
  "RAVEN",
  "RUBY",
  "BUB",
  "ROUSEY",
  "VADER",
  "STAR",
  "SID",
  "STEWIE",
];

export function calcTaskCost(
  agentName: AgentName,
  durationMs: number
): number {
  const config = AGENT_CONFIGS[agentName];
  if (!config || !durationMs) return 0;
  return (config.hourlyRate / 3600) * (durationMs / 1000);
}
