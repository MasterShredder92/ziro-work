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

function parseDuration(input: string): number {
  const m = input.match(/(\d{1,3})\s?(min|mins|minute|minutes|hr|hrs|hour|hours)/i);
  if (!m) return 30;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("hr") || unit.startsWith("hour")) return n * 60;
  return n;
}

const findAvailability: SkillDefinition = {
  title: "Find Availability",
  description: "Find open slots for a teacher or student within a timeframe.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    const duration = parseDuration(tokens.raw);
    return {
      result: {
        action: "find_availability",
        query: {
          tenantId: args.tenantId,
          teacherId: tokens.id,
          date: tokens.date,
          time: tokens.time,
          durationMinutes: duration,
          keywords: tokens.keywords,
        },
        sort: [{ field: "start_at", direction: "asc" }],
      },
      metadata: baseMeta(args, { tokens, duration }),
    };
  },
};

const addBlock: SkillDefinition = {
  title: "Add Schedule Block",
  description: "Create an availability or block-out entry on the schedule.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    const duration = parseDuration(tokens.raw);
    const blockType = hasKeyword(tokens.raw, ["off", "unavailable", "block"]) ? "unavailable" : "available";
    const ready = !!tokens.date && !!tokens.time;
    return {
      result: {
        action: "add_block",
        status: ready ? "ready" : "needs_datetime",
        block: {
          tenantId: args.tenantId,
          teacherId: tokens.id,
          date: tokens.date,
          startTime: tokens.time,
          durationMinutes: duration,
          blockType,
          createdBy: args.profileId,
        },
      },
      metadata: baseMeta(args, { tokens, duration }),
    };
  },
};

const detectConflicts: SkillDefinition = {
  title: "Detect Conflicts",
  description: "Check for overlapping schedule entries across teachers and students.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    const duration = parseDuration(tokens.raw);
    return {
      result: {
        action: "detect_conflicts",
        scope: {
          tenantId: args.tenantId,
          teacherId: tokens.id,
          date: tokens.date,
          time: tokens.time,
          durationMinutes: duration,
        },
        rules: [
          "teacher_overlap",
          "student_overlap",
          "resource_double_booking",
          "outside_teacher_availability",
        ],
      },
      metadata: baseMeta(args, { tokens, duration }),
    };
  },
};

const suggestSchedule: SkillDefinition = {
  title: "Suggest Schedule",
  description: "Propose schedule options for a new student based on preferences.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    const duration = parseDuration(tokens.raw);
    const weekdays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const preferredDays = weekdays.filter((d) => tokens.keywords.some((k) => k.startsWith(d)));
    const prefersAfternoon = hasKeyword(tokens.raw, ["afternoon", "after school", "evening"]);
    const prefersMorning = hasKeyword(tokens.raw, ["morning", "before school"]);
    return {
      result: {
        action: "suggest_schedule",
        preferences: {
          tenantId: args.tenantId,
          studentId: tokens.id,
          preferredDays,
          timeOfDay: prefersMorning ? "morning" : prefersAfternoon ? "afternoon" : "any",
          lessonLength: duration,
        },
        strategy: "weighted_round_robin",
        horizonDays: 14,
      },
      metadata: baseMeta(args, { tokens, duration }),
    };
  },
};

const teacherLoadReport: SkillDefinition = {
  title: "Teacher Load Report",
  description: "Summarize teaching load across teachers for a given window.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    const windowDays = hasKeyword(tokens.raw, ["month"]) ? 30 : hasKeyword(tokens.raw, ["quarter"]) ? 90 : 7;
    return {
      result: {
        action: "teacher_load_report",
        window: {
          tenantId: args.tenantId,
          days: windowDays,
          endDate: tokens.date,
        },
        metrics: [
          "scheduled_hours",
          "taught_hours",
          "no_show_hours",
          "utilization_pct",
          "avg_students_per_day",
        ],
        groupBy: "teacher_id",
      },
      metadata: baseMeta(args, { tokens }),
    };
  },
};

export const ruby: SkillPack = {
  findAvailability,
  addBlock,
  detectConflicts,
  suggestSchedule,
  teacherLoadReport,
};

export default ruby;
