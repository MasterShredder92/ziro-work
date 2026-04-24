import type { DbId, IsoDateTime } from "@/lib/data/core";
export type StudentStatus = "active" | "paused" | "inactive";
export type StudentOnboardingStage = "new" | "first_week" | "active" | "at_risk";
export interface Student {
  id: DbId;
  tenant_id: string;
  created_at: IsoDateTime;
  family_id: DbId | null;
  teacher_id: DbId | null;
  location_id: DbId | null;
  profile_id: DbId | null;
  // Identity
  name: string;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  phone?: string | null;
  instrument: string | null;
  date_of_birth: string | null; // YYYY-MM-DD
  // Learning profile
  bio: string | null;
  goals: string | null;
  learning_style: string | null;
  experience: string | null;
  experience_level: string | null;
  photo_url: string | null;
  // Enrollment
  status: StudentStatus;
  enrollment_date: IsoDateTime | null;
  start_date: string | null;
  end_date: string | null;
  lesson_day_of_week: string | null;
  blocks_per_week: number | null;
  sessions_per_month: number | null;
  // Tracking
  onboarding_stage: StudentOnboardingStage | null;
  last_attendance_at: IsoDateTime | null;
  attendance_streak: number;
  churn_risk: string | null;
  total_lessons_taken: number | null;
  total_fifth_weeks: number | null;
  total_callouts: number | null;
  // Notes (legacy single-field)
  notes: string | null;
  teacher_notes: string | null;
  // Exit
  archived_at: IsoDateTime | null;
  exit_reason: string | null;
  exit_notes: string | null;
  may_return: string | null;
  reactivation_date: string | null;
  // Timestamps
  updated_at: IsoDateTime | null;
}
export type StudentInsert = Omit<Student, "id" | "created_at"> & {
  id?: DbId;
  created_at?: IsoDateTime;
};
export type StudentUpdate = Partial<
  Omit<Student, "id" | "tenant_id" | "created_at">
>;

// Student note (structured notes with author/timestamp)
export interface StudentNote {
  id: DbId;
  tenant_id: string;
  student_id: DbId;
  author_id: DbId | null;
  author_name: string | null;
  author_role: string | null;
  body: string;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}
export type StudentNoteInsert = Omit<StudentNote, "id" | "created_at" | "updated_at"> & {
  id?: DbId;
};
