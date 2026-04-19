import type { Lead } from "@/lib/types/entities";
import {
  listLeads,
  updateLead,
} from "@data/leads";
import { getTeachersForTenant, type Teacher } from "@data/teachers";
import type {
  AutoActionDefinition,
  AutoActionPack,
  AutoActionResult,
} from "../types";

const STALE_DAYS = 7;
const ACTIVE_STAGES = ["new", "contacted", "qualified", "nurturing", "hot"];

function toIsoDaysAgo(now: Date, days: number): string {
  const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

function getLastActivityIso(lead: Lead): string | null {
  const candidates = [
    lead.last_contact_at,
    lead.updated_at,
    lead.created_at,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  return null;
}

function getLeadFullName(lead: Lead): string {
  const first = (lead.first_name ?? "").trim();
  const last = (lead.last_name ?? "").trim();
  const name = [first, last].filter(Boolean).join(" ").trim();
  if (name.length > 0) return name;
  if (typeof lead.student_name === "string" && lead.student_name.trim().length > 0) {
    return lead.student_name.trim();
  }
  return "Unnamed lead";
}

async function fetchCandidateLeads(tenantId: string): Promise<Lead[]> {
  const collected: Lead[] = [];
  for (const stage of ACTIVE_STAGES) {
    const rows = await listLeads(tenantId, { stage }, { limit: 500, ascending: false });
    if (rows.length > 0) collected.push(...rows);
  }
  const seen = new Set<string>();
  const unique: Lead[] = [];
  for (const row of collected) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    unique.push(row);
  }
  return unique;
}

export const detectStaleLeads: AutoActionDefinition = {
  key: "detectStaleLeads",
  description: "Flag leads with no activity in the last 7 days.",
  async handler(ctx): Promise<AutoActionResult> {
    const cutoff = toIsoDaysAgo(ctx.now, STALE_DAYS);
    const cutoffTime = new Date(cutoff).getTime();
    const leads = await fetchCandidateLeads(ctx.tenantId);
    const stale = leads
      .map((lead) => {
        const activity = getLastActivityIso(lead);
        const activityTime = activity ? new Date(activity).getTime() : 0;
        return { lead, activity, activityTime };
      })
      .filter(({ activityTime }) => activityTime > 0 && activityTime <= cutoffTime)
      .map(({ lead, activity }) => ({
        id: lead.id,
        name: getLeadFullName(lead),
        stage: lead.stage,
        assigned_to: lead.assigned_to ?? null,
        last_activity_at: activity,
      }));

    return {
      triggered: stale.length > 0,
      details: {
        thresholdDays: STALE_DAYS,
        cutoff,
        count: stale.length,
        leads: stale,
      },
    };
  },
};

export const detectHotLeads: AutoActionDefinition = {
  key: "detectHotLeads",
  description: "Flag leads in the hot stage with no scheduled follow up.",
  async handler(ctx): Promise<AutoActionResult> {
    const hot = await listLeads(
      ctx.tenantId,
      { stage: "hot" },
      { limit: 500, ascending: false },
    );
    const nowTime = ctx.now.getTime();
    const missing = hot
      .filter((lead) => {
        const nextIso = lead.next_follow_up_at;
        if (!nextIso) return true;
        const t = new Date(nextIso).getTime();
        if (!Number.isFinite(t)) return true;
        return t < nowTime;
      })
      .map((lead) => ({
        id: lead.id,
        name: getLeadFullName(lead),
        assigned_to: lead.assigned_to ?? null,
        next_follow_up_at: lead.next_follow_up_at ?? null,
        last_contact_at: lead.last_contact_at ?? null,
      }));

    return {
      triggered: missing.length > 0,
      details: {
        count: missing.length,
        leads: missing,
      },
    };
  },
};

function pickActiveTeachers(teachers: Teacher[]): Teacher[] {
  return teachers.filter((teacher) => {
    const status = (teacher.status ?? teacher["status"]) as unknown;
    if (status === null || status === undefined) return true;
    if (typeof status !== "string") return true;
    const normalized = status.toLowerCase();
    return normalized === "" || normalized === "active";
  });
}

export const autoAssignLeads: AutoActionDefinition = {
  key: "autoAssignLeads",
  description: "Assign unassigned leads to active teachers via round-robin.",
  async handler(ctx): Promise<AutoActionResult> {
    const leads = await fetchCandidateLeads(ctx.tenantId);
    const unassigned = leads.filter(
      (lead) => !lead.assigned_to && !lead.assigned_teacher_id,
    );
    if (unassigned.length === 0) {
      return {
        triggered: false,
        details: { reason: "no_unassigned_leads", assigned: 0 },
      };
    }

    const { data: teachers, error } = await getTeachersForTenant(ctx.tenantId);
    if (error || !teachers) {
      return {
        triggered: false,
        details: {
          reason: "teachers_fetch_failed",
          error: error ?? "unknown",
          unassigned: unassigned.length,
        },
      };
    }

    const active = pickActiveTeachers(teachers);
    if (active.length === 0) {
      return {
        triggered: false,
        details: { reason: "no_active_teachers", unassigned: unassigned.length },
      };
    }

    const assignments: Array<{
      leadId: string;
      teacherId: string;
      leadName: string;
    }> = [];

    for (let i = 0; i < unassigned.length; i += 1) {
      const lead = unassigned[i];
      const teacher = active[i % active.length];
      try {
        await updateLead(lead.id, ctx.tenantId, {
          assigned_teacher_id: teacher.id,
        });
        assignments.push({
          leadId: lead.id,
          teacherId: teacher.id,
          leadName: getLeadFullName(lead),
        });
      } catch (err) {
        assignments.push({
          leadId: lead.id,
          teacherId: teacher.id,
          leadName: getLeadFullName(lead) + " (failed)",
        });
        void err;
      }
    }

    return {
      triggered: assignments.length > 0,
      details: {
        assigned: assignments.length,
        total: unassigned.length,
        assignments,
      },
    };
  },
};

export const leadAutoActions: AutoActionPack = {
  key: "leads",
  description: "Lead lifecycle automations.",
  actions: [detectStaleLeads, detectHotLeads, autoAssignLeads],
};
