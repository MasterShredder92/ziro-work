export type LeadStatus =
  | "new"
  | "contacted"
  | "trial_scheduled"
  | "enrolled"
  | "lost";

export type InactivityBucket = "fresh" | "warm" | "cold" | "dead";

/** Row shape from `leads` (Supabase) plus fields agents may reference. */
export interface Lead {
  id: string;
  tenant_id?: string;
  created_at: string;
  last_contacted_at: string | null;
  status: LeadStatus;
  inactivity_bucket: InactivityBucket | null;
  email?: string | null;
  name?: string | null;
  full_name?: string | null;
  [key: string]: unknown;
}
