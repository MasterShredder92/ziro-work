import {
  listLeads as listLeadsData,
  getLeadById as getLeadByIdData,
  type LeadFilter,
} from "@data/leads";
import { listAIConversations } from "@data/aiConversations";
import { listStudents, getStudentById } from "@data/students";
import { listFamilies, getFamilyById } from "@data/families";
import type {
  AIConversation,
  Family,
  Lead,
  Student,
} from "@/lib/types/entities";
import type {
  LeadFilters,
  LeadQualification,
  LeadQualificationSignals,
  LeadQualificationTier,
  LeadRow,
  LeadSourceStat,
  LeadSourceStats,
  LeadTimelineItem,
} from "./types";

const DAY_MS = 1000 * 60 * 60 * 24;
const ACTIVE_STAGES = new Set([
  "new",
  "contacted",
  "qualified",
  "trial",
  "negotiating",
  "assigned",
  "intake",
]);

function daysBetween(fromIso: string | null | undefined, to: Date): number {
  if (!fromIso) return 0;
  const from = new Date(fromIso).getTime();
  if (!Number.isFinite(from)) return 0;
  return Math.max(0, Math.floor((to.getTime() - from) / DAY_MS));
}

function toLeadFilter(filters?: LeadFilters): LeadFilter | undefined {
  if (!filters) return undefined;
  const f: LeadFilter = {};
  if (filters.stage) f.stage = filters.stage;
  if (filters.source) f.source = filters.source;
  if (filters.assignedTo) f.assigned_to = filters.assignedTo;
  if (filters.locationId) f.location_id = filters.locationId;
  return Object.keys(f).length > 0 ? f : undefined;
}

function matchesSearch(lead: Lead, search?: string): boolean {
  if (!search) return true;
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const row = lead as unknown as Record<string, unknown>;
  const haystack = [
    row.first_name,
    row.last_name,
    row.parent_name,
    row.student_name,
    row.email,
    row.phone,
    row.instrument,
    row.source,
    row.how_heard,
  ]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .map((v) => v.toLowerCase());
  return haystack.some((h) => h.includes(q));
}

function scoreLead(
  lead: Lead,
  meta: { conversationCount: number; lastActivityAt: string | null },
): LeadQualification {
  const row = lead as unknown as Record<string, unknown>;
  const hasEmail = typeof row.email === "string" && row.email.length > 0;
  const hasPhone = typeof row.phone === "string" && row.phone.length > 0;
  const hasName =
    typeof row.first_name === "string" && (row.first_name as string).length > 0;
  const hasInstrument =
    typeof row.instrument === "string" && (row.instrument as string).length > 0;
  const hasGoals =
    typeof row.goals === "string" && (row.goals as string).length > 0;
  const hasPreferredTimes =
    (Array.isArray(row.preferred_days) && (row.preferred_days as unknown[]).length > 0) ||
    (typeof row.preferred_times === "string" &&
      (row.preferred_times as string).length > 0);

  const lastContact =
    (row.last_contact_at as string | null | undefined) ??
    meta.lastActivityAt ??
    null;
  const respondedRecently = lastContact
    ? daysBetween(lastContact, new Date()) <= 7
    : false;

  const signals: LeadQualificationSignals = {
    hasEmail,
    hasPhone,
    hasName,
    hasInstrument,
    hasGoals,
    hasPreferredTimes,
    respondedRecently,
    engagedConversations: meta.conversationCount,
  };

  const weight: Record<keyof LeadQualificationSignals, number> = {
    hasEmail: 10,
    hasPhone: 10,
    hasName: 5,
    hasInstrument: 15,
    hasGoals: 15,
    hasPreferredTimes: 10,
    respondedRecently: 20,
    engagedConversations: 0,
  };
  let score = 0;
  (Object.keys(weight) as Array<keyof LeadQualificationSignals>).forEach(
    (key) => {
      const value = signals[key];
      if (key === "engagedConversations") {
        score += Math.min(15, Number(value) * 5);
      } else if (value) {
        score += weight[key];
      }
    },
  );
  score = Math.min(100, score);

  const tier: LeadQualificationTier =
    score >= 80 ? "hot" : score >= 50 ? "warm" : "cold";

  const recommendedAction: LeadQualification["recommendedAction"] =
    tier === "hot"
      ? "promote_to_student"
      : tier === "warm"
        ? "schedule_followup"
        : hasEmail || hasPhone
          ? "nurture"
          : "needs_info";

  const reasons: string[] = [];
  if (!hasEmail) reasons.push("No email on file");
  if (!hasPhone) reasons.push("No phone on file");
  if (!hasInstrument) reasons.push("Instrument not captured");
  if (!hasGoals) reasons.push("Goals/motivation not captured");
  if (!respondedRecently) reasons.push("No recent contact in last 7 days");
  if (meta.conversationCount === 0)
    reasons.push("No conversations recorded yet");

  return {
    leadId: lead.id,
    score,
    tier,
    signals,
    recommendedAction,
    scoredAt: new Date().toISOString(),
    reasons,
  };
}

function lastActivityAt(
  lead: Lead,
  conversations: AIConversation[],
): string | null {
  const row = lead as unknown as Record<string, unknown>;
  const candidates: Array<string | null | undefined> = [
    row.last_contact_at as string | null | undefined,
    row.updated_at as string | null | undefined,
    row.created_at as string | null | undefined,
  ];
  for (const c of conversations) {
    candidates.push(c.updated_at ?? c.created_at ?? null);
  }
  let best: number | null = null;
  for (const v of candidates) {
    if (!v) continue;
    const t = new Date(v).getTime();
    if (!Number.isFinite(t)) continue;
    if (best == null || t > best) best = t;
  }
  return best != null ? new Date(best).toISOString() : null;
}

export async function listLeads(
  tenantId: string,
  filters?: LeadFilters,
): Promise<LeadRow[]> {
  const rows = await listLeadsData(tenantId, toLeadFilter(filters), {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  const filtered = rows.filter((l) => matchesSearch(l, filters?.search));
  const now = new Date();
  return filtered.map((lead) => {
    const qualification = scoreLead(lead, {
      conversationCount: 0,
      lastActivityAt: null,
    });
    return {
      ...lead,
      age_days: daysBetween(lead.created_at, now),
      last_activity_at: lastActivityAt(lead, []),
      qualification_tier: qualification.tier,
      qualification_score: qualification.score,
    };
  });
}

export async function getLeadById(
  leadId: string,
  tenantId: string,
): Promise<Lead | null> {
  return getLeadByIdData(leadId, tenantId);
}

export async function getLeadConversations(
  leadId: string,
  lead: Lead,
  tenantId: string,
): Promise<AIConversation[]> {
  const rows = await listAIConversations(
    tenantId,
    undefined,
    { orderBy: "updated_at", ascending: false, limit: 50 },
  );
  const row = lead as unknown as Record<string, unknown>;
  const email = (row.email as string | null | undefined) ?? null;
  const phone = (row.phone as string | null | undefined) ?? null;
  return rows.filter((c) => {
    const ctx = (c as unknown as Record<string, unknown>).context;
    if (ctx && typeof ctx === "object") {
      const ctxRec = ctx as Record<string, unknown>;
      if (ctxRec.leadId === leadId) return true;
      if (email && ctxRec.email === email) return true;
      if (phone && ctxRec.phone === phone) return true;
    }
    const title = (c as unknown as { title?: string | null }).title;
    if (typeof title === "string" && title.includes(leadId)) return true;
    return false;
  });
}

export async function getLeadTimeline(
  leadId: string,
  tenantId: string,
): Promise<LeadTimelineItem[]> {
  const lead = await getLeadById(leadId, tenantId);
  if (!lead) return [];
  const conversations = await getLeadConversations(leadId, lead, tenantId);
  const row = lead as unknown as Record<string, unknown>;
  const items: LeadTimelineItem[] = [];

  if (lead.created_at) {
    items.push({
      id: `${leadId}:created`,
      leadId,
      tenantId,
      type: "lead_created",
      at: lead.created_at,
      title: "Lead created",
      detail:
        (row.source as string | null | undefined) ??
        (row.how_heard as string | null | undefined) ??
        null,
      source: (row.source as string | null | undefined) ?? null,
      actorId: null,
      metadata: { stage: row.stage ?? null },
    });
  }

  if (lead.updated_at && lead.updated_at !== lead.created_at) {
    items.push({
      id: `${leadId}:updated`,
      leadId,
      tenantId,
      type: "lead_updated",
      at: lead.updated_at,
      title: "Lead updated",
      detail: null,
      source: null,
      actorId: (row.assigned_to as string | null | undefined) ?? null,
      metadata: {},
    });
  }

  const notes = (row.notes as string | null | undefined) ?? null;
  if (notes && notes.trim().length > 0) {
    items.push({
      id: `${leadId}:note`,
      leadId,
      tenantId,
      type: "note",
      at: lead.updated_at ?? lead.created_at ?? new Date().toISOString(),
      title: "Note",
      detail: notes,
      source: "leads.notes",
      actorId: (row.assigned_to as string | null | undefined) ?? null,
      metadata: {},
    });
  }

  const personality = (row.personality_notes as string | null | undefined) ?? null;
  if (personality && personality.trim().length > 0) {
    items.push({
      id: `${leadId}:personality`,
      leadId,
      tenantId,
      type: "note",
      at: lead.updated_at ?? lead.created_at ?? new Date().toISOString(),
      title: "Personality notes",
      detail: personality,
      source: "leads.personality_notes",
      actorId: null,
      metadata: {},
    });
  }

  const lastContactAt = (row.last_contact_at as string | null | undefined) ?? null;
  if (lastContactAt) {
    items.push({
      id: `${leadId}:last-contact`,
      leadId,
      tenantId,
      type: "follow_up",
      at: lastContactAt,
      title: "Most recent contact",
      detail:
        (row.next_action as string | null | undefined) ??
        "Follow-up completed",
      source: "leads.last_contact_at",
      actorId: (row.assigned_to as string | null | undefined) ?? null,
      metadata: {
        followUpCount: row.follow_up_count ?? 0,
      },
    });
  }

  const nextFollowUpAt =
    (row.next_follow_up_at as string | null | undefined) ?? null;
  if (nextFollowUpAt) {
    items.push({
      id: `${leadId}:next-follow-up`,
      leadId,
      tenantId,
      type: "follow_up",
      at: nextFollowUpAt,
      title: "Next follow-up",
      detail:
        (row.next_action as string | null | undefined) ??
        "Follow-up scheduled",
      source: "leads.next_follow_up_at",
      actorId: (row.assigned_to as string | null | undefined) ?? null,
      metadata: { scheduled: true },
    });
  }

  if (lead.converted_student_id) {
    items.push({
      id: `${leadId}:converted`,
      leadId,
      tenantId,
      type: "conversion",
      at: lead.updated_at ?? new Date().toISOString(),
      title: "Converted to student",
      detail: `Student ${lead.converted_student_id}`,
      source: "leads.converted_student_id",
      actorId: (row.assigned_to as string | null | undefined) ?? null,
      metadata: { studentId: lead.converted_student_id },
    });
  }

  for (const conv of conversations) {
    const convRow = conv as unknown as Record<string, unknown>;
    const title =
      (convRow.title as string | null | undefined) ??
      (convRow.source as string | null | undefined) ??
      "Conversation";
    items.push({
      id: `${leadId}:conv:${conv.id}`,
      leadId,
      tenantId,
      type: "conversation",
      at:
        (convRow.updated_at as string | null | undefined) ??
        (convRow.created_at as string | null | undefined) ??
        new Date().toISOString(),
      title,
      detail: (convRow.client_route as string | null | undefined) ?? null,
      source: "ai_conversations",
      actorId: (convRow.profile_id as string | null | undefined) ?? null,
      metadata: { conversationId: conv.id },
    });
  }

  items.sort((a, b) => {
    const ta = new Date(a.at).getTime();
    const tb = new Date(b.at).getTime();
    if (!Number.isFinite(ta) && !Number.isFinite(tb)) return 0;
    if (!Number.isFinite(ta)) return 1;
    if (!Number.isFinite(tb)) return -1;
    return tb - ta;
  });

  return items;
}

export async function getLeadSourceStats(
  tenantId: string,
): Promise<LeadSourceStats> {
  const rows = await listLeadsData(tenantId, undefined, {
    orderBy: "created_at",
    ascending: false,
    limit: 1000,
  });
  const map = new Map<string, LeadSourceStat>();
  for (const lead of rows) {
    const r = lead as unknown as Record<string, unknown>;
    const src =
      (r.source as string | null | undefined) ??
      (r.how_heard as string | null | undefined) ??
      "unknown";
    const stage = (r.stage as string | null | undefined) ?? "new";
    const stat = map.get(src) ?? {
      source: src,
      total: 0,
      open: 0,
      converted: 0,
      lost: 0,
      conversionRate: 0,
    };
    stat.total += 1;
    if (lead.converted_student_id) stat.converted += 1;
    else if (stage === "lost") stat.lost += 1;
    else if (ACTIVE_STAGES.has(stage)) stat.open += 1;
    map.set(src, stat);
  }
  const bySource = Array.from(map.values()).map((s) => ({
    ...s,
    conversionRate: s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0,
  }));
  bySource.sort((a, b) => b.total - a.total);
  return {
    total: rows.length,
    bySource,
    generatedAt: new Date().toISOString(),
  };
}

export async function getLeadQualification(
  leadId: string,
  tenantId: string,
): Promise<LeadQualification | null> {
  const lead = await getLeadByIdData(leadId, tenantId);
  if (!lead) return null;
  const conversations = await getLeadConversations(leadId, lead, tenantId);
  return scoreLead(lead, {
    conversationCount: conversations.length,
    lastActivityAt: lastActivityAt(lead, conversations),
  });
}

export async function getLeadFamily(
  lead: Lead,
  tenantId: string,
): Promise<Family | null> {
  const familyId = (lead as unknown as Record<string, unknown>).family_id as
    | string
    | null
    | undefined;
  if (!familyId) return null;
  try {
    const fam = await getFamilyById(familyId, tenantId);
    return (fam as Family | null) ?? null;
  } catch {
    return null;
  }
}

export async function getLeadConvertedStudent(
  lead: Lead,
  tenantId: string,
): Promise<Student | null> {
  if (!lead.converted_student_id) return null;
  try {
    return await getStudentById(lead.converted_student_id, tenantId);
  } catch {
    return null;
  }
}

export async function listLeadFamilies(
  tenantId: string,
): Promise<Family[]> {
  return listFamilies(tenantId, undefined, { limit: 500 });
}

export async function listLeadStudents(
  tenantId: string,
): Promise<Student[]> {
  return listStudents(tenantId, undefined, { limit: 500 });
}

export {
  scoreLead,
  lastActivityAt,
};
