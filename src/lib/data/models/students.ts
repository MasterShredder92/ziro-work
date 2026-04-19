import type { DbId, IsoDateTime } from "@/lib/data/core";

export type StudentStatus = "active" | "paused" | "inactive";
export type StudentOnboardingStage = "new" | "first_week" | "active" | "at_risk";

export interface Student {
  id: DbId;
  tenant_id: string;
  created_at: IsoDateTime;

  family_id: DbId | null;
  teacher_id: DbId | null;

  name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null; // YYYY-MM-DD

  status: StudentStatus;

  enrollment_date: IsoDateTime | null;
  onboarding_stage: StudentOnboardingStage | null;
  last_attendance_at: IsoDateTime | null;
  attendance_streak: number;
  churn_risk: string | null;

  notes: string | null;
  archived_at: IsoDateTime | null;
}

export type StudentInsert = Omit<Student, "id" | "created_at"> & {
  id?: DbId;
  created_at?: IsoDateTime;
};

export type StudentUpdate = Partial<
  Omit<Student, "id" | "tenant_id" | "created_at">
>;

