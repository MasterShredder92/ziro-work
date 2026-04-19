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

const addLead: SkillDefinition = {
  title: "Add Lead",
  description: "Capture a new lead from a natural-language description.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    const lead = {
      name: tokens.name,
      email: tokens.email,
      phone: tokens.phone,
      notes: tokens.raw || null,
      source: "chat",
      status: "new",
      capturedBy: args.profileId,
      tenantId: args.tenantId,
    };
    const required = ["name", "email", "phone"] as const;
    const missing = required.filter((k) => !lead[k]);
    return {
      result: {
        action: "add_lead",
        status: missing.length === 0 ? "captured" : "needs_info",
        lead,
        missing,
      },
      metadata: baseMeta(args, { tokens }),
    };
  },
};

const hotLeads: SkillDefinition = {
  title: "Hot Leads",
  description: "Summarize the most engaged leads for follow-up prioritization.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    const windowDays = tokens.keywords.includes("month") ? 30 : tokens.keywords.includes("week") ? 7 : 14;
    return {
      result: {
        action: "hot_leads",
        criteria: {
          windowDays,
          signalKeywords: tokens.keywords,
          minEngagementScore: 70,
        },
        ordering: [
          { field: "engagement_score", direction: "desc" },
          { field: "last_touch_at", direction: "desc" },
        ],
      },
      metadata: baseMeta(args, { tokens }),
    };
  },
};

const qualifyLead: SkillDefinition = {
  title: "Qualify Lead",
  description: "Score a lead against qualification criteria and recommend next action.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    const signals = {
      hasEmail: !!tokens.email,
      hasPhone: !!tokens.phone,
      hasName: !!tokens.name,
      mentionsBudget: hasKeyword(tokens.raw, ["budget", "afford", "pay", "price"]),
      mentionsTimeline: hasKeyword(tokens.raw, ["soon", "week", "month", "asap", "today"]),
      mentionsInterest: hasKeyword(tokens.raw, ["interested", "want", "ready", "lesson", "class"]),
    };
    const weight: Record<keyof typeof signals, number> = {
      hasEmail: 10,
      hasPhone: 10,
      hasName: 5,
      mentionsBudget: 25,
      mentionsTimeline: 25,
      mentionsInterest: 25,
    };
    const score = (Object.keys(signals) as Array<keyof typeof signals>)
      .reduce((acc, k) => acc + (signals[k] ? weight[k] : 0), 0);
    const tier = score >= 80 ? "hot" : score >= 50 ? "warm" : "cold";
    const nextAction = tier === "hot" ? "promote_to_student" : tier === "warm" ? "schedule_followup" : "nurture";
    return {
      result: {
        action: "qualify_lead",
        leadId: tokens.id,
        score,
        tier,
        signals,
        nextAction,
      },
      metadata: baseMeta(args, { tokens }),
    };
  },
};

const promoteLead: SkillDefinition = {
  title: "Promote Lead",
  description: "Promote a qualified lead to a student and prepare onboarding intent.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    const ready = !!tokens.id || (!!tokens.name && (!!tokens.email || !!tokens.phone));
    return {
      result: {
        action: "promote_lead",
        status: ready ? "ready" : "needs_lead_reference",
        leadId: tokens.id,
        target: {
          name: tokens.name,
          email: tokens.email,
          phone: tokens.phone,
          tenantId: args.tenantId,
        },
        onboarding: {
          createStudent: true,
          createFamily: !!tokens.name,
          scheduleIntro: true,
        },
      },
      metadata: baseMeta(args, { tokens }),
    };
  },
};

const findLeadDuplicates: SkillDefinition = {
  title: "Find Lead Duplicates",
  description: "Identify candidate duplicates using email, phone, and name similarity.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    const checks: Array<{ field: string; value: string; strategy: string }> = [];
    if (tokens.email) checks.push({ field: "email", value: tokens.email, strategy: "exact_lower" });
    if (tokens.phone) checks.push({ field: "phone", value: tokens.phone.replace(/\D/g, ""), strategy: "digits_only" });
    if (tokens.name) checks.push({ field: "name", value: tokens.name, strategy: "trigram_similarity" });
    return {
      result: {
        action: "find_lead_duplicates",
        checks,
        threshold: 0.7,
        scope: { tenantId: args.tenantId },
      },
      metadata: baseMeta(args, { tokens }),
    };
  },
};

export const star: SkillPack = {
  addLead,
  hotLeads,
  qualifyLead,
  promoteLead,
  findLeadDuplicates,
};

export default star;
