export type TrialStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "no_show"
  | "lost"
  | "enrolled";

export type TrialInactivityBucket = "fresh" | "upcoming" | "stale" | "dead";

/** Row from `trials`; `time` is the legacy schedule column from Supabase. */
export interface Trial {
  id: string;
  tenant_id?: string;
  lead_id: string | null;
  scheduled_at: string;
  /** Legacy column; prefer `scheduled_at` when present. */
  time?: string | null;
  last_reminded_at: string | null;
  status: TrialStatus;
  inactivity_bucket: TrialInactivityBucket | null;
  attended: boolean | null;
  enrollment_decision: string | null;
  [key: string]: unknown;
}
