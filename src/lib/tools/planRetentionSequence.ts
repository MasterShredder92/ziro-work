import type { Student } from "../types/students";

export type RetentionPlan = {
  next_action_type: "check_in" | "retention_nudge" | "none";
  template_id: string | null;
};

export function planRetentionSequence(
  student: Student,
  missedInLast30Days?: number
): RetentionPlan {
  const missed = missedInLast30Days ?? 0;

  if (missed >= 3 || student.onboarding_stage === "at_risk" || student.churn_risk === "high") {
    return {
      next_action_type: "retention_nudge",
      template_id: "retention_high_risk",
    };
  }

  if (student.onboarding_stage === "first_week") {
    return {
      next_action_type: "check_in",
      template_id: "first_week_attendance_checkin",
    };
  }

  return {
    next_action_type: "none",
    template_id: null,
  };
}
