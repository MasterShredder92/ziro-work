export type OnboardingStage = "new" | "first_week" | "active" | "at_risk";

export interface Student {
  id: string;
  tenant_id?: string;
  name?: string;
  email?: string;

  enrollment_date: string | null;
  onboarding_stage: OnboardingStage | null;
  last_attendance_at: string | null;
  attendance_streak: number;
  churn_risk: string | null;

  [key: string]: unknown;
}
