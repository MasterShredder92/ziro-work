/**
 * Agent Savings Tally
 *
 * Hourly rates are based on US national averages (April 2026) from
 * BLS, ZipRecruiter, Indeed, Glassdoor, and Salary.com.
 * Each rate represents what a business owner would pay a human
 * to perform the equivalent role.
 */

export type AgentId = "ziro" | "star" | "bub" | "stewie" | "ruby" | "vader" | "sid";

export interface AgentRateConfig {
  agentId: AgentId;
  displayName: string;
  roleEquivalent: string;
  hourlyRateUsd: number;
  rateSource: string;
}

export const AGENT_RATE_CONFIG: Record<AgentId, AgentRateConfig> = {
  ziro: {
    agentId: "ziro",
    displayName: "Ziro",
    roleEquivalent: "Operations Manager",
    hourlyRateUsd: 45,
    rateSource: "Operations Manager median, US national average",
  },
  star: {
    agentId: "star",
    displayName: "Star",
    roleEquivalent: "Lead Generation / CRM Specialist",
    hourlyRateUsd: 35,
    rateSource: "ZipRecruiter $31.86 · Salary.com $35 · Glassdoor $47 — blended avg",
  },
  bub: {
    agentId: "bub",
    displayName: "Bub",
    roleEquivalent: "Bookkeeper / Billing Specialist",
    hourlyRateUsd: 25,
    rateSource: "BLS $23.66/hr · Taxfyle avg $25 · Upwork $15–$25 — blended avg",
  },
  stewie: {
    agentId: "stewie",
    displayName: "Stewie",
    roleEquivalent: "Student Retention Specialist",
    hourlyRateUsd: 25,
    rateSource: "ZipRecruiter $29.50 · Indeed $17.89 · Salary.com $18 — blended avg",
  },
  ruby: {
    agentId: "ruby",
    displayName: "Ruby",
    roleEquivalent: "Scheduling Coordinator",
    hourlyRateUsd: 21,
    rateSource: "ZipRecruiter $20.06 · Indeed $21.30 · PayScale $20.17 — blended avg",
  },
  vader: {
    agentId: "vader",
    displayName: "Vader",
    roleEquivalent: "Curriculum Coordinator",
    hourlyRateUsd: 35,
    rateSource: "Glassdoor $39 · Salary.com $39 · NSTA $26.37 — blended avg",
  },
  sid: {
    agentId: "sid",
    displayName: "Sid the Kid",
    roleEquivalent: "Family / Parent Liaison",
    hourlyRateUsd: 25,
    rateSource: "ZipRecruiter $25.30 · Salary.com $27 — blended avg",
  },
};

export interface AgentTask {
  id: string;
  agentId: AgentId;
  taskType: string;
  description: string;
  minutesSpent: number;
  completedAt: string; // ISO date string
  ownerTasksRequired: number; // how many human tasks this required
}

/** Calculate dollar value saved for a single task */
export function taskSavedUsd(task: AgentTask): number {
  const rate = AGENT_RATE_CONFIG[task.agentId]?.hourlyRateUsd ?? 25;
  return (task.minutesSpent / 60) * rate;
}

export interface AgentSummary {
  agentId: AgentId;
  displayName: string;
  roleEquivalent: string;
  hourlyRateUsd: number;
  rateSource: string;
  totalTasks: number;
  totalMinutes: number;
  totalSavedUsd: number;
  ownerTasksRequired: number;
  tasks: AgentTask[];
}

export interface PeriodSummary {
  label: string;
  startDate: string;
  endDate: string;
  agents: AgentSummary[];
  totalSavedUsd: number;
  totalTasks: number;
  totalOwnerTasks: number;
}

/** Build per-agent summaries from a list of tasks */
export function buildAgentSummaries(tasks: AgentTask[]): AgentSummary[] {
  const byAgent: Record<string, AgentTask[]> = {};
  for (const task of tasks) {
    if (!byAgent[task.agentId]) byAgent[task.agentId] = [];
    byAgent[task.agentId].push(task);
  }

  return (Object.keys(AGENT_RATE_CONFIG) as AgentId[]).map((agentId) => {
    const cfg = AGENT_RATE_CONFIG[agentId];
    const agentTasks = byAgent[agentId] ?? [];
    const totalMinutes = agentTasks.reduce((s, t) => s + t.minutesSpent, 0);
    const totalSavedUsd = agentTasks.reduce((s, t) => s + taskSavedUsd(t), 0);
    const ownerTasksRequired = agentTasks.reduce((s, t) => s + t.ownerTasksRequired, 0);
    return {
      agentId,
      displayName: cfg.displayName,
      roleEquivalent: cfg.roleEquivalent,
      hourlyRateUsd: cfg.hourlyRateUsd,
      rateSource: cfg.rateSource,
      totalTasks: agentTasks.length,
      totalMinutes,
      totalSavedUsd,
      ownerTasksRequired,
      tasks: agentTasks.sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      ),
    };
  });
}

/** Build a period summary (week or month) */
export function buildPeriodSummary(
  label: string,
  startDate: string,
  endDate: string,
  allTasks: AgentTask[],
): PeriodSummary {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const periodTasks = allTasks.filter((t) => {
    const d = new Date(t.completedAt).getTime();
    return d >= start && d <= end;
  });
  const agents = buildAgentSummaries(periodTasks);
  return {
    label,
    startDate,
    endDate,
    agents,
    totalSavedUsd: agents.reduce((s, a) => s + a.totalSavedUsd, 0),
    totalTasks: agents.reduce((s, a) => s + a.totalTasks, 0),
    totalOwnerTasks: agents.reduce((s, a) => s + a.ownerTasksRequired, 0),
  };
}

// ─── Seed data (realistic examples until real DB table exists) ────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const SEED_TASKS: AgentTask[] = [
  // Star — leads
  { id: "s1",  agentId: "star",   taskType: "lead_follow_up",       description: "Sent follow-up SMS to 3 new leads from website inquiry form",                minutesSpent: 12, completedAt: daysAgo(0),  ownerTasksRequired: 0 },
  { id: "s2",  agentId: "star",   taskType: "lead_scoring",         description: "Scored and ranked 8 leads by likelihood to enroll",                          minutesSpent: 8,  completedAt: daysAgo(1),  ownerTasksRequired: 0 },
  { id: "s3",  agentId: "star",   taskType: "trial_scheduled",      description: "Confirmed trial lesson for Kayla M. — matched with available teacher slot",  minutesSpent: 15, completedAt: daysAgo(2),  ownerTasksRequired: 1 },
  { id: "s4",  agentId: "star",   taskType: "lead_follow_up",       description: "Re-engaged 2 cold leads (14+ days no response) with personalized message",   minutesSpent: 10, completedAt: daysAgo(3),  ownerTasksRequired: 0 },
  { id: "s5",  agentId: "star",   taskType: "crm_update",           description: "Updated 12 family CRM records with latest contact info from intake forms",   minutesSpent: 20, completedAt: daysAgo(5),  ownerTasksRequired: 0 },
  { id: "s6",  agentId: "star",   taskType: "lead_follow_up",       description: "Sent Google review request to 5 families (30-day milestone)",                minutesSpent: 6,  completedAt: daysAgo(7),  ownerTasksRequired: 0 },
  { id: "s7",  agentId: "star",   taskType: "enrollment_packet",    description: "Prepared enrollment packet and welcome email for 2 new students",            minutesSpent: 18, completedAt: daysAgo(9),  ownerTasksRequired: 1 },
  { id: "s8",  agentId: "star",   taskType: "lead_follow_up",       description: "Sent follow-up to 4 leads who clicked trial booking link but didn't confirm", minutesSpent: 8,  completedAt: daysAgo(12), ownerTasksRequired: 0 },

  // Bub — financials
  { id: "b1",  agentId: "bub",    taskType: "invoice_reconcile",    description: "Reconciled 47 Square invoices against expected billing for April",            minutesSpent: 35, completedAt: daysAgo(1),  ownerTasksRequired: 0 },
  { id: "b2",  agentId: "bub",    taskType: "overdue_alert",        description: "Flagged 8 families with overdue balances and drafted collection messages",    minutesSpent: 20, completedAt: daysAgo(2),  ownerTasksRequired: 1 },
  { id: "b3",  agentId: "bub",    taskType: "credit_adjustment",    description: "Applied $420 in credits for 3 teacher callout adjustments",                  minutesSpent: 15, completedAt: daysAgo(3),  ownerTasksRequired: 0 },
  { id: "b4",  agentId: "bub",    taskType: "monthly_report",       description: "Generated March financial summary: collected, outstanding, credits issued",   minutesSpent: 25, completedAt: daysAgo(4),  ownerTasksRequired: 0 },
  { id: "b5",  agentId: "bub",    taskType: "no_card_alert",        description: "Identified 35 active families with no card on file — sent reminder sequence", minutesSpent: 12, completedAt: daysAgo(6),  ownerTasksRequired: 0 },
  { id: "b6",  agentId: "bub",    taskType: "invoice_reconcile",    description: "Matched 22 Square payments to student accounts",                             minutesSpent: 18, completedAt: daysAgo(10), ownerTasksRequired: 0 },
  { id: "b7",  agentId: "bub",    taskType: "payroll_prep",         description: "Compiled teacher lesson counts for payroll period ending Apr 15",            minutesSpent: 30, completedAt: daysAgo(14), ownerTasksRequired: 1 },

  // Stewie — retention
  { id: "st1", agentId: "stewie", taskType: "churn_flag",           description: "Flagged 4 students as at-risk based on 2+ consecutive absences",             minutesSpent: 10, completedAt: daysAgo(0),  ownerTasksRequired: 1 },
  { id: "st2", agentId: "stewie", taskType: "retention_outreach",   description: "Sent retention check-in to 6 families with declining attendance",            minutesSpent: 15, completedAt: daysAgo(2),  ownerTasksRequired: 0 },
  { id: "st3", agentId: "stewie", taskType: "progress_report",      description: "Generated weekly progress reports for 602 active students",                  minutesSpent: 45, completedAt: daysAgo(3),  ownerTasksRequired: 0 },
  { id: "st4", agentId: "stewie", taskType: "monthly_family_report", description: "Sent monthly family reports to 510 families (attendance + teacher notes)",  minutesSpent: 60, completedAt: daysAgo(5),  ownerTasksRequired: 0 },
  { id: "st5", agentId: "stewie", taskType: "churn_flag",           description: "Identified 2 students who paused lessons — initiated win-back sequence",     minutesSpent: 8,  completedAt: daysAgo(7),  ownerTasksRequired: 0 },
  { id: "st6", agentId: "stewie", taskType: "milestone_alert",      description: "Sent 50-lesson milestone messages to 3 students",                            minutesSpent: 6,  completedAt: daysAgo(9),  ownerTasksRequired: 0 },

  // Ruby — scheduling
  { id: "r1",  agentId: "ruby",   taskType: "schedule_conflict",    description: "Resolved 2 double-booking conflicts in Bellevue schedule",                   minutesSpent: 12, completedAt: daysAgo(1),  ownerTasksRequired: 0 },
  { id: "r2",  agentId: "ruby",   taskType: "reschedule",           description: "Rescheduled 5 lessons after teacher callout — notified all families",        minutesSpent: 20, completedAt: daysAgo(2),  ownerTasksRequired: 0 },
  { id: "r3",  agentId: "ruby",   taskType: "availability_scan",    description: "Scanned 4 locations for open time slots — updated availability board",       minutesSpent: 10, completedAt: daysAgo(4),  ownerTasksRequired: 0 },
  { id: "r4",  agentId: "ruby",   taskType: "reschedule",           description: "Processed 3 makeup lesson requests and found matching open slots",           minutesSpent: 15, completedAt: daysAgo(6),  ownerTasksRequired: 1 },
  { id: "r5",  agentId: "ruby",   taskType: "schedule_conflict",    description: "Flagged 1 teacher with 6+ hours scheduled on same day — suggested split",    minutesSpent: 8,  completedAt: daysAgo(8),  ownerTasksRequired: 1 },

  // Vader — teacher/curriculum
  { id: "v1",  agentId: "vader",  taskType: "teacher_note_digest",  description: "Compiled and formatted 38 teacher lesson notes for family reports",         minutesSpent: 25, completedAt: daysAgo(3),  ownerTasksRequired: 0 },
  { id: "v2",  agentId: "vader",  taskType: "curriculum_flag",      description: "Flagged 3 students who haven't progressed past beginner level in 6+ months", minutesSpent: 10, completedAt: daysAgo(5),  ownerTasksRequired: 1 },
  { id: "v3",  agentId: "vader",  taskType: "teacher_message",      description: "Drafted and sent sub coverage request to 4 available teachers",             minutesSpent: 12, completedAt: daysAgo(7),  ownerTasksRequired: 0 },
  { id: "v4",  agentId: "vader",  taskType: "performance_review",   description: "Compiled monthly teacher performance metrics (attendance, ratings)",        minutesSpent: 30, completedAt: daysAgo(10), ownerTasksRequired: 0 },

  // Sid — student/family
  { id: "si1", agentId: "sid",    taskType: "onboarding",           description: "Completed onboarding flow for 2 new families — sent welcome packet",        minutesSpent: 20, completedAt: daysAgo(2),  ownerTasksRequired: 0 },
  { id: "si2", agentId: "sid",    taskType: "family_message",       description: "Responded to 6 family inquiries via SMS — answered schedule questions",     minutesSpent: 18, completedAt: daysAgo(3),  ownerTasksRequired: 0 },
  { id: "si3", agentId: "sid",    taskType: "profile_update",       description: "Updated contact info for 14 families from returned SMS confirmations",      minutesSpent: 15, completedAt: daysAgo(5),  ownerTasksRequired: 0 },
  { id: "si4", agentId: "sid",    taskType: "fifth_week_notice",    description: "Sent fifth-week makeup bank reminders to 22 eligible students",             minutesSpent: 10, completedAt: daysAgo(7),  ownerTasksRequired: 0 },
  { id: "si5", agentId: "sid",    taskType: "google_review_request", description: "Sent Google review request to 8 families at 30-day milestone",            minutesSpent: 8,  completedAt: daysAgo(9),  ownerTasksRequired: 0 },

  // Ziro — orchestration
  { id: "z1",  agentId: "ziro",   taskType: "orchestration",        description: "Coordinated lead handoff from Star to Sid after trial lesson confirmed",    minutesSpent: 5,  completedAt: daysAgo(2),  ownerTasksRequired: 0 },
  { id: "z2",  agentId: "ziro",   taskType: "orchestration",        description: "Routed overdue alert from Bub to Sid for family communication",             minutesSpent: 3,  completedAt: daysAgo(4),  ownerTasksRequired: 0 },
  { id: "z3",  agentId: "ziro",   taskType: "system_check",         description: "Daily system health check — all 7 agents operational, 0 errors",           minutesSpent: 2,  completedAt: daysAgo(0),  ownerTasksRequired: 0 },
  { id: "z4",  agentId: "ziro",   taskType: "orchestration",        description: "Triggered monthly report sequence across Stewie, Bub, and Sid",             minutesSpent: 4,  completedAt: daysAgo(5),  ownerTasksRequired: 0 },
];
