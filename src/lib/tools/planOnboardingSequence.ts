import type { Student } from "../types/students";

export type OnboardingPlan = {
  next_action_type: "welcome" | "check_in" | "retention_nudge" | "none";
  template_id: string | null;
};

/**
 * Legacy-safe onboarding planner that does NOT depend on `student.onboarding_stage`.
 * Uses enrollment recency and attendance streak to decide the next message.
 */
export function planOnboardingSequence(student: Student): OnboardingPlan {
  const enrolledAtRaw = student.enrollment_date ?? null;
  if (!enrolledAtRaw) {
    return { next_action_type: "none", template_id: null };
  }

  const enrolledAt = new Date(enrolledAtRaw);
  const now = new Date();
  const days =
    Number.isFinite(enrolledAt.getTime())
      ? Math.floor((now.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

  // Day 0–2: welcome
  if (days != null && days <= 2) {
    return { next_action_type: "welcome", template_id: "welcome_new_student" };
  }

  // First week check-in (low streak or recent no-shows typically show up here later via retention).
  if (days != null && days <= 7 && (student.attendance_streak ?? 0) <= 1) {
    return { next_action_type: "check_in", template_id: "first_week_checkin" };
  }

  // If churn risk already flagged, use retention nudge template.
  if ((student.churn_risk ?? "").toLowerCase() === "high") {
    return { next_action_type: "retention_nudge", template_id: "retention_high_risk" };
  }

  return { next_action_type: "none", template_id: null };
}

