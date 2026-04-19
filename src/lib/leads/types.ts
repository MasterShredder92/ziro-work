import type {
  AIConversation,
  Family,
  Lead,
  Student,
} from "@/lib/types/entities";

export type LeadTimelineItemType =
  | "lead_created"
  | "lead_updated"
  | "stage_changed"
  | "note"
  | "conversation"
  | "follow_up"
  | "conversion";

export interface LeadTimelineItem {
  id: string;
  leadId: string;
  tenantId: string;
  type: LeadTimelineItemType;
  at: string;
  title: string;
  detail: string | null;
  source: string | null;
  actorId: string | null;
  metadata: Record<string, unknown>;
}

export interface LeadQualificationSignals {
  hasEmail: boolean;
  hasPhone: boolean;
  hasName: boolean;
  hasInstrument: boolean;
  hasGoals: boolean;
  hasPreferredTimes: boolean;
  respondedRecently: boolean;
  engagedConversations: number;
}

export type LeadQualificationTier = "hot" | "warm" | "cold";

export interface LeadQualification {
  leadId: string;
  score: number;
  tier: LeadQualificationTier;
  signals: LeadQualificationSignals;
  recommendedAction:
    | "promote_to_student"
    | "schedule_followup"
    | "nurture"
    | "needs_info";
  scoredAt: string;
  reasons: string[];
}

export interface LeadSourceStat {
  source: string;
  total: number;
  open: number;
  converted: number;
  lost: number;
  conversionRate: number;
}

export interface LeadSourceStats {
  total: number;
  bySource: LeadSourceStat[];
  generatedAt: string;
}

export interface LeadRow extends Lead {
  age_days: number;
  last_activity_at: string | null;
  qualification_tier: LeadQualificationTier | null;
  qualification_score: number | null;
}

export interface LeadFilters {
  stage?: string;
  source?: string;
  assignedTo?: string;
  locationId?: string;
  search?: string;
}

export interface LeadDashboardData {
  tenantId: string;
  leads: LeadRow[];
  sourceStats: LeadSourceStats;
  totals: {
    all: number;
    open: number;
    converted: number;
    hot: number;
    warm: number;
    cold: number;
  };
  generatedAt: string;
}

export interface LeadDetail {
  lead: Lead;
  family: Family | null;
  convertedStudent: Student | null;
  qualification: LeadQualification;
  timeline: LeadTimelineItem[];
  conversations: AIConversation[];
}

export interface LeadSurfaceData {
  tenantId: string;
  detail: LeadDetail;
  generatedAt: string;
}

export interface LeadDisplayProfile {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  initials: string;
  stage: string;
  source: string | null;
  instrument: string | null;
}

export function toLeadDisplayProfile(lead: Lead): LeadDisplayProfile {
  const row = lead as unknown as Record<string, unknown>;
  const first = (row["first_name"] as string | undefined) ?? "";
  const last = (row["last_name"] as string | undefined) ?? "";
  const parent = (row["parent_name"] as string | undefined) ?? "";
  const studentName = (row["student_name"] as string | undefined) ?? "";
  const email = (row["email"] as string | null | undefined) ?? null;
  const phone = (row["phone"] as string | null | undefined) ?? null;
  const instrument =
    (row["instrument"] as string | null | undefined) ?? null;
  const source = (row["source"] as string | null | undefined) ?? null;
  const stage = (row["stage"] as string | undefined) ?? "new";
  const fullName =
    `${first} ${last}`.trim() ||
    studentName ||
    parent ||
    email ||
    lead.id;
  const initials =
    ((first[0] ?? "") + (last[0] ?? "")).toUpperCase() ||
    (parent[0] ?? studentName[0] ?? "L").toUpperCase();
  return {
    id: lead.id,
    fullName,
    email,
    phone,
    initials: initials.slice(0, 2),
    stage,
    source,
    instrument,
  };
}
