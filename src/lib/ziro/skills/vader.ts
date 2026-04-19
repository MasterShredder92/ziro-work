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

function resolveChannel(raw: string): string {
  if (hasKeyword(raw, ["email"])) return "email";
  if (hasKeyword(raw, ["sms", "text"])) return "sms";
  if (hasKeyword(raw, ["call", "phone"])) return "call";
  return "email";
}

function splitSubjectBody(raw: string): { subject: string; body: string } {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return { subject: "", body: "" };
  if (lines.length === 1) {
    const first = lines[0];
    return {
      subject: first.length > 80 ? `${first.slice(0, 77)}...` : first,
      body: first,
    };
  }
  return {
    subject: lines[0].length > 80 ? `${lines[0].slice(0, 77)}...` : lines[0],
    body: lines.slice(1).join("\n"),
  };
}

function buildMessageSkill(
  action: string,
  recipientKind: "family" | "teacher" | "student",
  title: string,
  description: string,
): SkillDefinition {
  return {
    title,
    description,
    async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
      const tokens = parseTokens(args.input);
      const channel = resolveChannel(tokens.raw);
      const { subject, body } = splitSubjectBody(tokens.raw);
      const hasRecipient = !!(tokens.id || tokens.name || tokens.email || tokens.phone);
      return {
        result: {
          action,
          status: hasRecipient ? "ready" : "needs_recipient",
          message: {
            tenantId: args.tenantId,
            recipientKind,
            recipientId: tokens.id,
            recipientName: tokens.name,
            recipientEmail: tokens.email,
            recipientPhone: tokens.phone,
            channel,
            subject,
            body,
            sentBy: args.profileId,
          },
        },
        metadata: baseMeta(args, { tokens }),
      };
    },
  };
}

const messageFamily = buildMessageSkill(
  "message_family",
  "family",
  "Message Family",
  "Draft and send a message to a family account.",
);

const messageTeacher = buildMessageSkill(
  "message_teacher",
  "teacher",
  "Message Teacher",
  "Draft and send a message to a teacher.",
);

const messageStudent = buildMessageSkill(
  "message_student",
  "student",
  "Message Student",
  "Draft and send a message to a student.",
);

const inboxSummary: SkillDefinition = {
  title: "Inbox Summary",
  description: "Summarize unread and recent inbox activity for triage.",
  async handler(args: SkillHandlerInput): Promise<SkillHandlerOutput> {
    const tokens = parseTokens(args.input);
    const windowDays = hasKeyword(tokens.raw, ["week"]) ? 7 : hasKeyword(tokens.raw, ["month"]) ? 30 : 1;
    return {
      result: {
        action: "inbox_summary",
        scope: {
          tenantId: args.tenantId,
          profileId: args.profileId,
          windowDays,
        },
        segments: [
          { key: "unread", filter: { read: false } },
          { key: "needs_reply", filter: { awaiting_response: true } },
          { key: "recent_threads", filter: { windowDays } },
        ],
        metrics: [
          "unread_count",
          "awaiting_reply_count",
          "avg_response_minutes",
          "top_senders",
        ],
      },
      metadata: baseMeta(args, { tokens, windowDays }),
    };
  },
};

export const vader: SkillPack = {
  messageFamily,
  messageTeacher,
  messageStudent,
  inboxSummary,
};

export default vader;
