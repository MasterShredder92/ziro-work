import type { Student } from "../types/students";

export type RetentionPlan = {
  next_action_type: "check_in" | "retention_nudge" | "none";
  template_id: string | null;
};

/**
 * Legacy-safe retention planner that does NOT depend on `student.onboarding_stage`.
 * Uses missed lessons + churn risk to decide the next action.
 */
export function planRetentionSequence(student: Student, missedInLast30Days?: number): RetentionPlan {
  const missed = missedInLast30Days ?? 0;
  const churnRisk = (student.churn_risk ?? "").toLowerCase();

  if (missed >= 3 || churnRisk === "high") {
    return { next_action_type: "retention_nudge", template_id: "retention_high_risk" };
  }

  if (missed >= 1) {
    return { next_action_type: "check_in", template_id: "attendance_checkin" };
  }

  return { next_action_type: "none", template_id: null };
}

