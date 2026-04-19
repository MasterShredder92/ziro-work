import type { DashboardMetrics } from "@/components/dashboard/computeDashboardMetrics";
import type { StudentSignals } from "@/components/dashboard/useStudentSignals";
import { formatShortNumber, formatUsdFromCents } from "@/components/dashboard/dashboardFormat";
import {
  getOptionalAdminHourlyUsd,
  getOptionalEnrollmentUsd,
  getOptionalHoursPerEnrollment,
} from "@/components/dashboard/impactEstimates";

export type AgentLine = {
  text: string;
  /** When true, show muted helper that estimates need env-based defaults */
  isEstimate?: boolean;
};

export function linesForAgent(
  id: string,
  metrics: DashboardMetrics,
  signals: StudentSignals,
): AgentLine[] {
  const enrollUsd = getOptionalEnrollmentUsd();
  const adminHour = getOptionalAdminHourlyUsd();
  const hoursPerEn = getOptionalHoursPerEnrollment();

  switch (id) {
    case "star": {
      const lines: AgentLine[] = [];
      if (enrollUsd != null && metrics.enrollmentsThisWeek > 0) {
        const rev = metrics.enrollmentsThisWeek * enrollUsd;
        lines.push({
          text: `About ${formatUsdFromCents(Math.round(rev * 100))} in new enrollments this week (uses NEXT_PUBLIC_EST_ENROLLMENT_USD if you set it).`,
          isEstimate: true,
        });
      }
      lines.push({
        text: `This week: ${formatShortNumber(metrics.leadsThisWeek)} new leads and ${formatShortNumber(metrics.enrollmentsThisWeek)} enrollments logged.`,
      });
      lines.push({
        text: "STAR lines up the work so you open the right list first.",
      });
      if (adminHour != null && metrics.enrollmentsThisWeek > 0) {
        const low = metrics.enrollmentsThisWeek * hoursPerEn * adminHour;
        const hi = metrics.enrollmentsThisWeek * (hoursPerEn + 0.5) * adminHour;
        lines.push({
          text: `Rough admin time saved vs doing it all by hand: about ${formatUsdFromCents(Math.round(low * 100))}–${formatUsdFromCents(Math.round(hi * 100))} (uses hourly + hours/enrollment env).`,
          isEstimate: true,
        });
      }
      return lines;
    }
    case "bub": {
      return [
        {
          text: `Outstanding invoices: ${formatUsdFromCents(metrics.outstanding)}. Collected this month: ${formatUsdFromCents(metrics.paidThisMonth)}.`,
        },
        {
          text: "Bub is the money snapshot — who owes you and what already landed in the bank.",
        },
      ];
    }
    case "sid": {
      const lines: AgentLine[] = [
        {
          text: `Students who look at-risk right now: ${formatShortNumber(signals.atRiskStudents)}. Churn signals (7 days): ${formatShortNumber(metrics.churnThisWeek)}.`,
        },
        {
          text: "Sid focuses on keeping families — who needs a call before they quit.",
        },
      ];
      return lines;
    }
    case "ruby": {
      return [
        {
          text: "Ruby watches the calendar: open spots, overlaps, and who is double-booked.",
        },
        { text: "Start on the main schedule view to fix conflicts fast." },
      ];
    }
    case "stewie": {
      return [
        {
          text: `Follow-up work waiting: ${formatShortNumber(signals.pendingEnrollments)} students still in “new” onboarding.`,
        },
        {
          text: "Stewie nudges so trials and callbacks do not get forgotten.",
        },
      ];
    }
    case "vader": {
      return [
        {
          text: "Vader lines up texts and emails to teachers and families in one thread.",
        },
        { text: "Open messages when you need to answer without hunting in five apps." },
      ];
    }
    case "ziro": {
      return [
        {
          text: "Ziro answers plain questions about what a screen does and what to tap next.",
        },
        { text: "Use Ziro when you are stuck — no fancy words required." },
      ];
    }
    default:
      return [{ text: "Here to help with your school’s daily work." }];
  }
}

/** Ziro sits above the team on the dashboard org chart. */
export const DASHBOARD_LEADER_ID = "ziro" as const;

/** Specialists shown under the leader (same data as before; new layout only). */
export const DASHBOARD_TEAM_ORDER = ["star", "bub", "sid", "ruby", "stewie", "vader"] as const;

/** Full roster order (e.g. exports); leader first, then team. */
export const AGENT_CARD_ORDER = [
  DASHBOARD_LEADER_ID,
  ...DASHBOARD_TEAM_ORDER,
] as const;

export type AgentCardLink = { label: string; href: string };

export function primaryLinkForAgent(id: string): AgentCardLink {
  switch (id) {
    case "star":
      return { label: "Open lead work", href: "/lifecycle/lead-work" };
    case "bub":
      return { label: "View invoices", href: "/invoices" };
    case "sid":
      return { label: "See students", href: "/students" };
    case "ruby":
      return { label: "Open schedule", href: "/schedule" };
    case "stewie":
      return { label: "Enrollment queue", href: "/lifecycle/enrollment" };
    case "vader":
      return { label: "Open messages", href: "/messages" };
    case "ziro":
      return { label: "Help & settings", href: "/settings" };
    default:
      return { label: "Dashboard", href: "/" };
  }
}

/** One chat-backed action that matches page intelligence skills (real pipeline keys). */
export function askActionForAgent(id: string): { label: string; action: string; payload: unknown } | null {
  switch (id) {
    case "star":
      return { label: "Ask about hot leads", action: "summon", payload: { focus: "hotLeads" } };
    case "bub":
      return { label: "Ask about money due", action: "summon", payload: { focus: "outstanding" } };
    case "sid":
      return { label: "Ask who might leave", action: "summon", payload: { focus: "atRisk" } };
    case "ruby":
      return { label: "Ask about schedule gaps", action: "summon", payload: { focus: "availability" } };
    case "stewie":
      return { label: "Ask about follow-ups", action: "summon", payload: { focus: "followups" } };
    case "vader":
      return { label: "Ask who to message", action: "summon", payload: { focus: "inbox" } };
    case "ziro":
      return { label: "Ask how this works", action: "summon", payload: { focus: "help" } };
    default:
      return null;
  }
}
