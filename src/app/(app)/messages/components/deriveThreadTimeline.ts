import type { Message } from "@/lib/messaging/types";
import {
  isLikelySystemMessage,
  splitIntoSenderRuns,
  type DayBucket,
} from "./threadConversationUtils";

export type ThreadTimelineEventType =
  | "threadCreated"
  | "firstOutbound"
  | "firstInbound"
  | "firstAttachment"
  | "firstTemplate"
  | "firstTest"
  | "system"
  | "message"
  | "reaction"
  | "pin"
  | "edit"
  | "edit-undo"
  | "delete";

/** Spec-aligned record; used for milestones + metadata. */
export type ThreadTimelineEventRecord = {
  type: ThreadTimelineEventType;
  messageId?: string;
  date: string;
  timestamp: number;
  reaction?: string;
};

export type ThreadTimelinePulseEvent = {
  type: "reaction" | "pin" | "edit" | "edit-undo" | "delete";
  messageId: string;
  reaction?: string;
  timestamp: string;
};

export type ThreadMilestoneRow = {
  messageId: string;
  timestamp: number;
  date: string;
  tooltip: string;
};

function ts(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

function channelLabel(channel: Message["channelType"]): string {
  if (channel === "email") return "email";
  if (channel === "sms") return "SMS";
  if (channel === "in_app") return "in-app";
  if (channel === "push") return "push";
  return channel;
}

export function isMessageTestMessage(message: Message): boolean {
  const ext = message as Message & { isTest?: boolean; is_test?: boolean };
  if (ext.isTest === true || ext.is_test === true) return true;
  const sub = message.subject?.trim() ?? "";
  if (sub.startsWith("[Test]")) return true;
  return false;
}

/** Dot color priority: system → test → template → direction. */
export function messageDotTailwindClass(message: Message, currentProfileId: string): string {
  if (isLikelySystemMessage(message)) return "bg-yellow-500";
  if (isMessageTestMessage(message)) return "bg-purple-500";
  if (message.templateId) return "bg-teal-500";
  if (message.senderId === currentProfileId) return "bg-blue-500";
  return "bg-zinc-500";
}

export function formatMessageTimelineTitle(
  message: Message,
  currentProfileId: string,
): string {
  const direction = message.senderId === currentProfileId ? "Outbound" : "Inbound";
  const ch = channelLabel(message.channelType);
  const d = new Date(message.createdAt);
  const datePart = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timePart = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (isLikelySystemMessage(message)) {
    return `System • ${datePart}, ${timePart}`;
  }
  if (isMessageTestMessage(message)) {
    return `Test message • ${datePart}, ${timePart}`;
  }
  if (message.templateId) {
    return `Template ${direction.toLowerCase()} ${ch} • ${datePart}, ${timePart}`;
  }
  return `${direction} ${ch} • ${datePart}, ${timePart}`;
}

export function formatDayTimelineTitle(dayKey: string, label: string): string {
  if (label.trim()) return label;
  return dayKey;
}

export function buildOrderedMessageIds(days: DayBucket[]): string[] {
  const ids: string[] = [];
  for (const day of days) {
    for (const run of splitIntoSenderRuns(day.messages)) {
      for (const m of run) {
        ids.push(m.id);
      }
    }
  }
  return ids;
}

function pushMilestone(
  map: Map<string, ThreadMilestoneRow>,
  messageId: string,
  iso: string,
  line: string,
) {
  const prev = map.get(messageId);
  const timestamp = ts(iso);
  const date = iso;
  if (!prev) {
    map.set(messageId, { messageId, timestamp, date, tooltip: line });
    return;
  }
  prev.tooltip = `${prev.tooltip}\n${line}`;
  if (timestamp < prev.timestamp) {
    prev.timestamp = timestamp;
    prev.date = date;
  }
}

/**
 * Derives ordered ids, per-message records, and thread-level milestone anchors
 * (merged by message row for compact markers).
 */
export function deriveThreadTimeline(
  messages: Message[],
  currentProfileId: string,
  days: DayBucket[],
  pulseEvents: ThreadTimelinePulseEvent[] = [],
): {
  orderedMessageIds: string[];
  messageById: Map<string, Message>;
  /** Extra marker (amber) keyed by message id — excludes plain `system` (yellow dot covers it). */
  milestoneByMessageId: Map<string, ThreadMilestoneRow>;
  /** Includes `system` rows for data consumers / tooltips. */
  rawEvents: ThreadTimelineEventRecord[];
} {
  const sorted = [...messages].sort(
    (a, b) => ts(a.createdAt) - ts(b.createdAt),
  );

  const rawEvents: ThreadTimelineEventRecord[] = [];
  const milestoneByMessageId = new Map<string, ThreadMilestoneRow>();

  const record = (e: ThreadTimelineEventRecord, milestoneLine?: string) => {
    rawEvents.push(e);
    if (!e.messageId || !milestoneLine) return;
    pushMilestone(milestoneByMessageId, e.messageId, e.date, milestoneLine);
  };

  if (sorted.length === 0) {
    return {
      orderedMessageIds: buildOrderedMessageIds(days),
      messageById: new Map(),
      milestoneByMessageId,
      rawEvents,
    };
  }

  const first = sorted[0]!;
  record(
    {
      type: "threadCreated",
      messageId: first.id,
      date: first.createdAt,
      timestamp: ts(first.createdAt),
    },
    `Thread created • ${new Date(first.createdAt).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })}`,
  );

  for (const m of sorted) {
    if (isLikelySystemMessage(m)) {
      rawEvents.push({
        type: "system",
        messageId: m.id,
        date: m.createdAt,
        timestamp: ts(m.createdAt),
      });
    }
  }

  for (const m of sorted) {
    rawEvents.push({
      type: "message",
      messageId: m.id,
      date: m.createdAt,
      timestamp: ts(m.createdAt),
    });
  }

  const firstOutbound = sorted.find(
    (m) => m.senderId === currentProfileId && !isLikelySystemMessage(m),
  );
  if (firstOutbound) {
    record(
      {
        type: "firstOutbound",
        messageId: firstOutbound.id,
        date: firstOutbound.createdAt,
        timestamp: ts(firstOutbound.createdAt),
      },
      `First outbound message • ${new Date(firstOutbound.createdAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`,
    );
  }

  const firstInbound = sorted.find(
    (m) => m.senderId !== currentProfileId && !isLikelySystemMessage(m),
  );
  if (firstInbound) {
    record(
      {
        type: "firstInbound",
        messageId: firstInbound.id,
        date: firstInbound.createdAt,
        timestamp: ts(firstInbound.createdAt),
      },
      `First inbound reply • ${new Date(firstInbound.createdAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`,
    );
  }

  const firstAttachment = sorted.find((m) => (m.attachments?.length ?? 0) > 0);
  if (firstAttachment) {
    record(
      {
        type: "firstAttachment",
        messageId: firstAttachment.id,
        date: firstAttachment.createdAt,
        timestamp: ts(firstAttachment.createdAt),
      },
      `First attachment • ${new Date(firstAttachment.createdAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`,
    );
  }

  const firstTemplate = sorted.find((m) => Boolean(m.templateId));
  if (firstTemplate) {
    record(
      {
        type: "firstTemplate",
        messageId: firstTemplate.id,
        date: firstTemplate.createdAt,
        timestamp: ts(firstTemplate.createdAt),
      },
      `First template message • ${new Date(firstTemplate.createdAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`,
    );
  }

  const firstTest = sorted.find((m) => isMessageTestMessage(m));
  if (firstTest) {
    record(
      {
        type: "firstTest",
        messageId: firstTest.id,
        date: firstTest.createdAt,
        timestamp: ts(firstTest.createdAt),
      },
      `First test message • ${new Date(firstTest.createdAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`,
    );
  }

  const messageById = new Map(sorted.map((m) => [m.id, m] as const));

  for (const evt of pulseEvents) {
    const t = ts(evt.timestamp);
    rawEvents.push({
      type: evt.type,
      messageId: evt.messageId,
      reaction: evt.reaction,
      date: evt.timestamp,
      timestamp: t,
    });
  }

  return {
    orderedMessageIds: buildOrderedMessageIds(days),
    messageById,
    milestoneByMessageId,
    rawEvents,
  };
}
