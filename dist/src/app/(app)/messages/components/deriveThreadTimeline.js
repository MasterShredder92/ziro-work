import { isLikelySystemMessage, splitIntoSenderRuns, } from "./threadConversationUtils";
function ts(iso) {
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? t : 0;
}
function channelLabel(channel) {
    if (channel === "email")
        return "email";
    if (channel === "sms")
        return "SMS";
    if (channel === "in_app")
        return "in-app";
    if (channel === "push")
        return "push";
    return channel;
}
export function isMessageTestMessage(message) {
    var _a, _b;
    const ext = message;
    if (ext.isTest === true || ext.is_test === true)
        return true;
    const sub = (_b = (_a = message.subject) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
    if (sub.startsWith("[Test]"))
        return true;
    return false;
}
/** Dot color priority: system → test → template → direction. */
export function messageDotTailwindClass(message, currentProfileId) {
    if (isLikelySystemMessage(message))
        return "bg-yellow-500";
    if (isMessageTestMessage(message))
        return "bg-purple-500";
    if (message.templateId)
        return "bg-teal-500";
    if (message.senderId === currentProfileId)
        return "bg-blue-500";
    return "bg-zinc-500";
}
export function formatMessageTimelineTitle(message, currentProfileId) {
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
export function formatDayTimelineTitle(dayKey, label) {
    if (label.trim())
        return label;
    return dayKey;
}
export function buildOrderedMessageIds(days) {
    const ids = [];
    for (const day of days) {
        for (const run of splitIntoSenderRuns(day.messages)) {
            for (const m of run) {
                ids.push(m.id);
            }
        }
    }
    return ids;
}
function pushMilestone(map, messageId, iso, line) {
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
export function deriveThreadTimeline(messages, currentProfileId, days, pulseEvents = []) {
    const sorted = [...messages].sort((a, b) => ts(a.createdAt) - ts(b.createdAt));
    const rawEvents = [];
    const milestoneByMessageId = new Map();
    const record = (e, milestoneLine) => {
        rawEvents.push(e);
        if (!e.messageId || !milestoneLine)
            return;
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
    const first = sorted[0];
    record({
        type: "threadCreated",
        messageId: first.id,
        date: first.createdAt,
        timestamp: ts(first.createdAt),
    }, `Thread created • ${new Date(first.createdAt).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    })}`);
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
    const firstOutbound = sorted.find((m) => m.senderId === currentProfileId && !isLikelySystemMessage(m));
    if (firstOutbound) {
        record({
            type: "firstOutbound",
            messageId: firstOutbound.id,
            date: firstOutbound.createdAt,
            timestamp: ts(firstOutbound.createdAt),
        }, `First outbound message • ${new Date(firstOutbound.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        })}`);
    }
    const firstInbound = sorted.find((m) => m.senderId !== currentProfileId && !isLikelySystemMessage(m));
    if (firstInbound) {
        record({
            type: "firstInbound",
            messageId: firstInbound.id,
            date: firstInbound.createdAt,
            timestamp: ts(firstInbound.createdAt),
        }, `First inbound reply • ${new Date(firstInbound.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        })}`);
    }
    const firstAttachment = sorted.find((m) => { var _a, _b; return ((_b = (_a = m.attachments) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0; });
    if (firstAttachment) {
        record({
            type: "firstAttachment",
            messageId: firstAttachment.id,
            date: firstAttachment.createdAt,
            timestamp: ts(firstAttachment.createdAt),
        }, `First attachment • ${new Date(firstAttachment.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        })}`);
    }
    const firstTemplate = sorted.find((m) => Boolean(m.templateId));
    if (firstTemplate) {
        record({
            type: "firstTemplate",
            messageId: firstTemplate.id,
            date: firstTemplate.createdAt,
            timestamp: ts(firstTemplate.createdAt),
        }, `First template message • ${new Date(firstTemplate.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        })}`);
    }
    const firstTest = sorted.find((m) => isMessageTestMessage(m));
    if (firstTest) {
        record({
            type: "firstTest",
            messageId: firstTest.id,
            date: firstTest.createdAt,
            timestamp: ts(firstTest.createdAt),
        }, `First test message • ${new Date(firstTest.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        })}`);
    }
    const messageById = new Map(sorted.map((m) => [m.id, m]));
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
