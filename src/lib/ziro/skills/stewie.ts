import type { SkillDefinition, SkillHandlerInput, SkillHandlerOutput, SkillPack } from "./types";
import { hasKeyword, parseTokens } from "./parse";

function baseMeta(args: SkillHandlerInput, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    tenantId: args.tenantId,
    profileId: args.profileId,
    conversationId: args.conversationId,
    ...extra,
  };
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function resolveDueDate(raw: string, explicitDate: string | null): string {
  if (explicitDate) return explicitDate;
  const today = new Date();
  if (hasKeyword(raw, ["tomorrow"])) return addDays(today, 1).toISOString().slice(0, 10);
  if (hasKeyword(raw, ["next week"])) return addDays(today, 7).toISOString().slice(0, 10);
  if (hasKeyword(raw, ["today"])) return today.toISOString().slice(0, 10);
  const m = raw.match(/in\s+(\d{1,3})\s+(day|days|week|weeks)/i);
  if (m) {
    const n = Number(m[1]);
    const days = m[2].toLowerCase().startsWith("week") ? n * 7 : n;
    return addDays(today, days).toISOString().slice(0, 10);
  }
  return addDays(today, 3).toISOString().slice(0, 10);
}

function resolveChannel(raw: string): string {
  if (hasKeyword(raw, ["email"])) return "email";
  if (hasKeyword(raw, ["text", "sms"])) return "sms";
  if (hasKeyword(raw, ["call", "phone"])) return "call";
  return "task";
}

const scheduleFollowup: SkillDefinition = {
  title: "Schedule Follow-up",
  description: "Schedule a follow-up task tied to a lead, family, or student.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    const dueAt = resolveDueDate(tokens.raw, tokens.date);
    const channel = resolveChannel(tokens.raw);
    return {
      result: {
        action: "schedule_followup",
        followup: {
          tenantId: args.tenantId,
          subjectId: tokens.id,
          subjectName: tokens.name,
          dueAt,
          channel,
          note: tokens.raw,
          ownerId: args.profileId,
          status: "pending",
        },
      },
      metadata: baseMeta(args, { tokens }),
    };
  },
};

const listFollowups: SkillDefinition = {
  title: "List Follow-ups",
  description: "List upcoming follow-ups for a window and owner.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    const windowDays = hasKeyword(tokens.raw, ["week"]) ? 7 : hasKeyword(tokens.raw, ["month"]) ? 30 : 3;
    return {
      result: {
        action: "list_followups",
        filters: {
          tenantId: args.tenantId,
          ownerId: args.profileId,
          subjectId: tokens.id,
          status: ["pending", "in_progress"],
          windowDays,
        },
        ordering: [
          { field: "due_at", direction: "asc" },
          { field: "priority", direction: "desc" },
        ],
      },
      metadata: baseMeta(args, { tokens, windowDays }),
    };
  },
};

const overdueFollowups: SkillDefinition = {
  title: "Overdue Follow-ups",
  description: "Flag follow-ups whose due date has passed without completion.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    return {
      result: {
        action: "overdue_followups",
        filters: {
          tenantId: args.tenantId,
          ownerId: args.profileId,
          status: ["pending", "in_progress"],
          dueBefore: new Date().toISOString().slice(0, 10),
        },
        escalation: {
          afterDays: 3,
          action: "notify_owner",
          afterDaysHard: 7,
          hardAction: "notify_manager",
        },
      },
      metadata: baseMeta(args, { tokens }),
    };
  },
};

const followupSummary: SkillDefinition = {
  title: "Follow-up Summary",
  description: "Summarize follow-up workload and outcomes.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    const windowDays = hasKeyword(tokens.raw, ["month"]) ? 30 : hasKeyword(tokens.raw, ["quarter"]) ? 90 : 7;
    return {
      result: {
        action: "followup_summary",
        scope: {
          tenantId: args.tenantId,
          ownerId: args.profileId,
          windowDays,
        },
        metrics: [
          "opened_count",
          "closed_count",
          "overdue_count",
          "avg_completion_hours",
          "conversion_rate",
        ],
        groupBy: ["channel", "status"],
      },
      metadata: baseMeta(args, { tokens, windowDays }),
    };
  },
};

export const stewie: SkillPack = {
  scheduleFollowup,
  listFollowups,
  overdueFollowups,
  followupSummary,
};

export default stewie;
