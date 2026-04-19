import type { Message } from "@/lib/messaging/types";
import type { ThreadTimelinePulseEvent } from "./deriveThreadTimeline";
import { isMessageTestMessage } from "./deriveThreadTimeline";
import { dayKeyFromIso, isLikelySystemMessage } from "./threadConversationUtils";
import type { MessageReactionsState } from "./useMessageReactions";

type ThreadAnalyticsMilestoneKey =
  | "threadCreated"
  | "firstOutbound"
  | "firstInbound"
  | "firstAttachment"
  | "firstTemplate"
  | "firstTest"
  | "firstReaction"
  | "firstPin"
  | "firstEdit"
  | "firstEditUndo"
  | "firstDelete";

export type ThreadAnalyticsMilestone = {
  key: ThreadAnalyticsMilestoneKey;
  label: string;
  timestamp: string;
  messageId: string;
};

export type ThreadAnalytics = {
  counts: {
    totalMessages: number;
    outboundMessages: number;
    inboundMessages: number;
    systemMessages: number;
    templateMessages: number;
    testMessages: number;
    messagesWithAttachments: number;
    attachmentItems: number;
    reactionsTotal: number;
    reactionsByType: Record<string, number>;
    pinsTotal: number;
    editsTotal: number;
    editUndosTotal: number;
    deletesTotal: number;
  };
  timing: {
    threadAgeMs: number | null;
    avgInboundToOutboundMs: number | null;
    avgOutboundToInboundMs: number | null;
    longestGapMs: number | null;
    firstResponseMs: number | null;
  };
  engagement: {
    daysActive: number;
    messagesPerDay: number;
    attachmentsPerDay: number;
    templatesPerDay: number;
    testSendsPerDay: number;
    reactionsPerDay: number;
    pinsPerDay: number;
    editsPerDay: number;
    editUndosPerDay: number;
    deletesPerDay: number;
  };
  channels: {
    email: number;
    sms: number;
    internalSystem: number;
    other: Record<string, number>;
  };
  milestones: ThreadAnalyticsMilestone[] & {
    firstReaction: ThreadAnalyticsMilestone | null;
    firstPin: ThreadAnalyticsMilestone | null;
    firstEdit: ThreadAnalyticsMilestone | null;
    firstEditUndo: ThreadAnalyticsMilestone | null;
    firstDelete: ThreadAnalyticsMilestone | null;
  };
};

function toMs(iso: string): number | null {
  const n = new Date(iso).getTime();
  return Number.isFinite(n) ? n : null;
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  let total = 0;
  for (const n of nums) total += n;
  return total / nums.length;
}

export function deriveThreadAnalytics(
  messages: Message[],
  currentProfileId: string,
  reactionCountsByMessage: MessageReactionsState = {},
  pinnedByMessage: Record<string, true> = {},
  pulseEvents: ThreadTimelinePulseEvent[] = [],
): ThreadAnalytics {
  if (messages.length === 0) {
    return {
      counts: {
        totalMessages: 0,
        outboundMessages: 0,
        inboundMessages: 0,
        systemMessages: 0,
        templateMessages: 0,
        testMessages: 0,
        messagesWithAttachments: 0,
        attachmentItems: 0,
        reactionsTotal: 0,
        reactionsByType: {},
        pinsTotal: 0,
        editsTotal: 0,
        editUndosTotal: 0,
        deletesTotal: 0,
      },
      timing: {
        threadAgeMs: null,
        avgInboundToOutboundMs: null,
        avgOutboundToInboundMs: null,
        longestGapMs: null,
        firstResponseMs: null,
      },
      engagement: {
        daysActive: 0,
        messagesPerDay: 0,
        attachmentsPerDay: 0,
        templatesPerDay: 0,
        testSendsPerDay: 0,
        reactionsPerDay: 0,
        pinsPerDay: 0,
        editsPerDay: 0,
        editUndosPerDay: 0,
        deletesPerDay: 0,
      },
      channels: {
        email: 0,
        sms: 0,
        internalSystem: 0,
        other: {},
      },
      milestones: Object.assign([], {
        firstReaction: null,
        firstPin: null,
        firstEdit: null,
        firstEditUndo: null,
        firstDelete: null,
      }),
    };
  }

  let outboundMessages = 0;
  let inboundMessages = 0;
  let systemMessages = 0;
  let templateMessages = 0;
  let testMessages = 0;
  let messagesWithAttachments = 0;
  let attachmentItems = 0;
  let email = 0;
  let sms = 0;
  let internalSystem = 0;
  const other: Record<string, number> = {};
  const days = new Set<string>();

  let firstTimestamp: number | null = null;
  let lastTimestamp: number | null = null;
  let prevTimestamp: number | null = null;
  let longestGapMs: number | null = null;

  let prevDirection: "inbound" | "outbound" | null = null;
  let prevDirectionTimestamp: number | null = null;
  const inboundToOutboundGaps: number[] = [];
  const outboundToInboundGaps: number[] = [];

  let firstOutboundTimestamp: number | null = null;
  let firstResponseMs: number | null = null;

  let firstOutboundMilestone: ThreadAnalyticsMilestone | null = null;
  let firstInboundMilestone: ThreadAnalyticsMilestone | null = null;
  let firstAttachmentMilestone: ThreadAnalyticsMilestone | null = null;
  let firstTemplateMilestone: ThreadAnalyticsMilestone | null = null;
  let firstTestMilestone: ThreadAnalyticsMilestone | null = null;
  let firstReactionMilestone: ThreadAnalyticsMilestone | null = null;
  let firstPinMilestone: ThreadAnalyticsMilestone | null = null;
  let firstEditMilestone: ThreadAnalyticsMilestone | null = null;
  let firstEditUndoMilestone: ThreadAnalyticsMilestone | null = null;
  let firstDeleteMilestone: ThreadAnalyticsMilestone | null = null;

  for (const message of messages) {
    const ts = toMs(message.createdAt);
    if (ts == null) continue;

    days.add(dayKeyFromIso(message.createdAt));
    if (firstTimestamp == null) firstTimestamp = ts;
    lastTimestamp = ts;

    if (prevTimestamp != null) {
      const gap = ts - prevTimestamp;
      if (longestGapMs == null || gap > longestGapMs) longestGapMs = gap;
    }
    prevTimestamp = ts;

    const isSystem = isLikelySystemMessage(message);
    const isOutbound = message.senderId === currentProfileId;
    const direction = isOutbound ? "outbound" : "inbound";

    if (isSystem) {
      systemMessages += 1;
    } else if (isOutbound) {
      outboundMessages += 1;
    } else {
      inboundMessages += 1;
    }

    if (message.templateId) {
      templateMessages += 1;
      if (!firstTemplateMilestone) {
        firstTemplateMilestone = {
          key: "firstTemplate",
          label: "First template",
          timestamp: message.createdAt,
          messageId: message.id,
        };
      }
    }

    if (isMessageTestMessage(message)) {
      testMessages += 1;
      if (!firstTestMilestone) {
        firstTestMilestone = {
          key: "firstTest",
          label: "First test",
          timestamp: message.createdAt,
          messageId: message.id,
        };
      }
    }

    const messageAttachmentCount = message.attachments?.length ?? 0;
    if (messageAttachmentCount > 0) {
      messagesWithAttachments += 1;
      attachmentItems += messageAttachmentCount;
      if (!firstAttachmentMilestone) {
        firstAttachmentMilestone = {
          key: "firstAttachment",
          label: "First attachment",
          timestamp: message.createdAt,
          messageId: message.id,
        };
      }
    }

    if (isSystem || message.channelType === "in_app") {
      internalSystem += 1;
    } else if (message.channelType === "email") {
      email += 1;
    } else if (message.channelType === "sms") {
      sms += 1;
    } else {
      other[message.channelType] = (other[message.channelType] ?? 0) + 1;
    }

    if (!isSystem) {
      if (!firstOutboundMilestone && direction === "outbound") {
        firstOutboundMilestone = {
          key: "firstOutbound",
          label: "First outbound",
          timestamp: message.createdAt,
          messageId: message.id,
        };
        firstOutboundTimestamp = ts;
      }
      if (!firstInboundMilestone && direction === "inbound") {
        firstInboundMilestone = {
          key: "firstInbound",
          label: "First inbound",
          timestamp: message.createdAt,
          messageId: message.id,
        };
      }
      if (
        firstOutboundTimestamp != null &&
        direction === "inbound" &&
        firstResponseMs == null &&
        ts >= firstOutboundTimestamp
      ) {
        firstResponseMs = ts - firstOutboundTimestamp;
      }

      if (prevDirection && prevDirectionTimestamp != null && prevDirection !== direction) {
        const gap = ts - prevDirectionTimestamp;
        if (prevDirection === "inbound") inboundToOutboundGaps.push(gap);
        else outboundToInboundGaps.push(gap);
      }
      prevDirection = direction;
      prevDirectionTimestamp = ts;
    }
  }

  const daysActive = days.size;
  const reactionsByType: Record<string, number> = {};
  let reactionsTotal = 0;
  const pinsTotal = Object.keys(pinnedByMessage).length;
  let editsTotal = 0;
  let editUndosTotal = 0;
  let deletesTotal = 0;
  for (const counts of Object.values(reactionCountsByMessage)) {
    for (const [reaction, count] of Object.entries(counts)) {
      const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0;
      reactionsByType[reaction] = (reactionsByType[reaction] ?? 0) + safeCount;
      reactionsTotal += safeCount;
    }
  }

  for (const evt of pulseEvents) {
    const t = toMs(evt.timestamp);
    if (t == null) continue;
    if (evt.type === "reaction") {
      const firstReactionTs = firstReactionMilestone
        ? toMs(firstReactionMilestone.timestamp)
        : null;
      if (
        !firstReactionMilestone ||
        firstReactionTs == null ||
        t < firstReactionTs
      ) {
        firstReactionMilestone = {
          key: "firstReaction",
          label: "First reaction",
          timestamp: evt.timestamp,
          messageId: evt.messageId,
        };
      }
      continue;
    }
    if (evt.type === "edit") {
      editsTotal += 1;
      const firstEditTs = firstEditMilestone ? toMs(firstEditMilestone.timestamp) : null;
      if (!firstEditMilestone || firstEditTs == null || t < firstEditTs) {
        firstEditMilestone = {
          key: "firstEdit",
          label: "First edit",
          timestamp: evt.timestamp,
          messageId: evt.messageId,
        };
      }
      continue;
    }
    if (evt.type === "edit-undo") {
      editUndosTotal += 1;
      const firstEditUndoTs = firstEditUndoMilestone
        ? toMs(firstEditUndoMilestone.timestamp)
        : null;
      if (!firstEditUndoMilestone || firstEditUndoTs == null || t < firstEditUndoTs) {
        firstEditUndoMilestone = {
          key: "firstEditUndo",
          label: "First edit undo",
          timestamp: evt.timestamp,
          messageId: evt.messageId,
        };
      }
      continue;
    }
    if (evt.type === "delete") {
      deletesTotal += 1;
      const firstDeleteTs = firstDeleteMilestone
        ? toMs(firstDeleteMilestone.timestamp)
        : null;
      if (!firstDeleteMilestone || firstDeleteTs == null || t < firstDeleteTs) {
        firstDeleteMilestone = {
          key: "firstDelete",
          label: "First delete",
          timestamp: evt.timestamp,
          messageId: evt.messageId,
        };
      }
      continue;
    }
    const firstPinTs = firstPinMilestone ? toMs(firstPinMilestone.timestamp) : null;
    if (!firstPinMilestone || firstPinTs == null || t < firstPinTs) {
      firstPinMilestone = {
        key: "firstPin",
        label: "First pin",
        timestamp: evt.timestamp,
        messageId: evt.messageId,
      };
    }
  }

  const milestones: ThreadAnalyticsMilestone[] = [];
  const firstMessage = messages.find((m) => toMs(m.createdAt) != null);
  if (firstMessage) {
    milestones.push({
      key: "threadCreated",
      label: "Thread created",
      timestamp: firstMessage.createdAt,
      messageId: firstMessage.id,
    });
  }
  if (firstOutboundMilestone) milestones.push(firstOutboundMilestone);
  if (firstInboundMilestone) milestones.push(firstInboundMilestone);
  if (firstAttachmentMilestone) milestones.push(firstAttachmentMilestone);
  if (firstTemplateMilestone) milestones.push(firstTemplateMilestone);
  if (firstTestMilestone) milestones.push(firstTestMilestone);
  if (firstReactionMilestone) milestones.push(firstReactionMilestone);
  if (firstPinMilestone) milestones.push(firstPinMilestone);
  if (firstEditMilestone) milestones.push(firstEditMilestone);
  if (firstEditUndoMilestone) milestones.push(firstEditUndoMilestone);
  if (firstDeleteMilestone) milestones.push(firstDeleteMilestone);

  return {
    counts: {
      totalMessages: messages.length,
      outboundMessages,
      inboundMessages,
      systemMessages,
      templateMessages,
      testMessages,
      messagesWithAttachments,
      attachmentItems,
      reactionsTotal,
      reactionsByType,
      pinsTotal,
      editsTotal,
      editUndosTotal,
      deletesTotal,
    },
    timing: {
      threadAgeMs:
        firstTimestamp != null && lastTimestamp != null
          ? Math.max(0, lastTimestamp - firstTimestamp)
          : null,
      avgInboundToOutboundMs: avg(inboundToOutboundGaps),
      avgOutboundToInboundMs: avg(outboundToInboundGaps),
      longestGapMs,
      firstResponseMs,
    },
    engagement: {
      daysActive,
      messagesPerDay: daysActive > 0 ? messages.length / daysActive : 0,
      attachmentsPerDay: daysActive > 0 ? attachmentItems / daysActive : 0,
      templatesPerDay: daysActive > 0 ? templateMessages / daysActive : 0,
      testSendsPerDay: daysActive > 0 ? testMessages / daysActive : 0,
      reactionsPerDay: daysActive > 0 ? reactionsTotal / daysActive : 0,
      pinsPerDay: daysActive > 0 ? pinsTotal / daysActive : 0,
      editsPerDay: daysActive > 0 ? editsTotal / daysActive : 0,
      editUndosPerDay: daysActive > 0 ? editUndosTotal / daysActive : 0,
      deletesPerDay: daysActive > 0 ? deletesTotal / daysActive : 0,
    },
    channels: {
      email,
      sms,
      internalSystem,
      other,
    },
    milestones: Object.assign(milestones, {
      firstReaction: firstReactionMilestone,
      firstPin: firstPinMilestone,
      firstEdit: firstEditMilestone,
      firstEditUndo: firstEditUndoMilestone,
      firstDelete: firstDeleteMilestone,
    }),
  };
}
