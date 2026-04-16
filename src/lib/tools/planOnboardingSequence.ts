import type { Student } from "../types/students";

export type OnboardingPlan = {
  next_action_type: "welcome" | "check_in" | "retention_nudge" | "none";
  template_id: string | null;
};

export function planOnboardingSequence(student: Student): OnboardingPlan {
  const stage = student.onboarding_stage ?? "new";

  if (stage === "new") {
    return {
      next_action_type: "welcome",
      template_id: "welcome_new_student",
    };
  }

  if (stage === "first_week") {
    return {
      next_action_type: "check_in",
      template_id: "first_week_checkin",
    };
  }

  if (stage === "at_risk") {
    return {
      next_action_type: "retention_nudge",
      template_id: "retention_nudge",
    };
  }

  return {
    next_action_type: "none",
    template_id: null,
  };
}
