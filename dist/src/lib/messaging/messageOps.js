import "server-only";
import { listMessages as listMessageRows, getMessage as getMessageRow, upsertMessage, } from "@data/messageRecords";
import { getThread as getThreadRow, upsertThread, } from "@data/messageThreads";
import { listParticipants, upsertParticipant, } from "@data/messageParticipants";
import { getProfilesByIds } from "@data/profiles";
import { getPrimaryBrandingEmailIdentity } from "@/lib/branding/queries";
import { applyEmailIdentity } from "@/lib/branding/runtime";
import { enqueueAndDeliver, listDeliveriesForMessage } from "./delivery";
import { renderTemplate } from "./integrations";
import { recordUsage } from "@/lib/billing/billingOps";
import { rowToThread as rowToThreadFull } from "./threads";
function previewOf(body) {
    const trimmed = body.trim();
    return trimmed.length > 280 ? `${trimmed.slice(0, 277)}…` : trimmed;
}
function profileNameFromMap(map, id) {
    var _a, _b;
    const p = map.get(id);
    if (!p)
        return null;
    return (`${(_a = p.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = p.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() || p.email || p.id);
}
function attachmentsFromRow(list) {
    return (list !== null && list !== void 0 ? list : []).map((a) => ({
        id: a.id,
        name: a.name,
        url: a.url,
        mimeType: a.mime_type,
        sizeBytes: a.size_bytes,
    }));
}
function attachmentsToRow(list) {
    return (list !== null && list !== void 0 ? list : []).map((a) => ({
        id: a.id,
        name: a.name,
        url: a.url,
        mime_type: a.mimeType,
        size_bytes: a.sizeBytes,
    }));
}
function rowToMessage(row, senderName, deliveries) {
    var _a;
    const deletedAt = (_a = row.deleted_at) !== null && _a !== void 0 ? _a : null;
    return {
        id: row.id,
        tenantId: row.tenant_id,
        threadId: row.thread_id,
        senderId: row.sender_id,
        senderName,
        recipientIds: row.recipient_ids,
        channelType: row.channel_type,
        subject: row.subject,
        body: deletedAt ? "" : row.body,
        bodyHtml: deletedAt ? null : row.body_html,
        templateId: row.template_id,
        mergeVars: row.merge_vars,
        attachments: attachmentsFromRow(row.attachments),
        deliveryStatus: row.delivery_status,
        deliveries,
        replyToMessageId: row.reply_to_message_id,
        deletedAt,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
async function hydrateMessages(tenantId, rows) {
    if (rows.length === 0)
        return [];
    const senderIds = Array.from(new Set(rows.map((r) => r.sender_id)));
    const profiles = senderIds.length
        ? await getProfilesByIds(senderIds, tenantId)
        : [];
    const map = new Map(profiles.map((p) => [p.id, p]));
    const deliveriesByMsg = await Promise.all(rows.map((r) => listDeliveriesForMessage(tenantId, r.id)));
    return rows.map((r, i) => rowToMessage(r, profileNameFromMap(map, r.sender_id), deliveriesByMsg[i]));
}
export async function listMessagesForThread(tenantId, threadId) {
    const rows = await listMessageRows(tenantId, { thread_id: threadId }, { orderBy: "created_at", ascending: true, limit: 500 });
    return hydrateMessages(tenantId, rows);
}
export async function getMessageFor(tenantId, messageId) {
    const row = await getMessageRow(messageId, tenantId);
    if (!row)
        return null;
    const [hydrated] = await hydrateMessages(tenantId, [row]);
    return hydrated !== null && hydrated !== void 0 ? hydrated : null;
}
export async function updateMessage(tenantId, messageId, senderId, patch) {
    var _a, _b;
    const row = await getMessageRow(messageId, tenantId);
    if (!row)
        throw new Error("MESSAGE_NOT_FOUND");
    if (row.sender_id !== senderId)
        throw new Error("FORBIDDEN");
    const isSoftDelete = patch.deletedAt !== undefined;
    const nextDeletedAt = patch.deletedAt === null
        ? null
        : patch.deletedAt instanceof Date
            ? patch.deletedAt.toISOString()
            : ((_a = patch.deletedAt) !== null && _a !== void 0 ? _a : new Date().toISOString());
    const deletedRow = row;
    const existingDeletedAt = (_b = deletedRow.deleted_at) !== null && _b !== void 0 ? _b : null;
    if (!isSoftDelete) {
        if (existingDeletedAt)
            throw new Error("MESSAGE_DELETED");
        const nextBody = typeof patch.body === "string" ? patch.body.trim() : row.body;
        if (!nextBody)
            throw new Error("EMPTY_BODY");
        const nextRow = Object.assign(Object.assign({}, row), { body: nextBody, body_html: typeof patch.bodyHtml === "string" || patch.bodyHtml === null
                ? patch.bodyHtml
                : row.body_html, subject: typeof patch.subject === "string" || patch.subject === null
                ? patch.subject
                : row.subject, updated_at: new Date().toISOString() });
        const updatedRow = await upsertMessage(tenantId, nextRow);
        const [message] = await hydrateMessages(tenantId, [updatedRow]);
        if (!message)
            throw new Error("MESSAGE_UPDATE_FAILED");
        return message;
    }
    const nextRow = Object.assign(Object.assign({}, row), { deleted_at: nextDeletedAt, updated_at: new Date().toISOString() });
    const updatedRow = await upsertMessage(tenantId, nextRow);
    const [message] = await hydrateMessages(tenantId, [updatedRow]);
    if (!message)
        throw new Error("MESSAGE_UPDATE_FAILED");
    return message;
}
async function updateThreadAfterMessage(tenantId, thread, message) {
    var _a, _b;
    const unread = Object.assign({}, ((_a = thread.unread_by) !== null && _a !== void 0 ? _a : {}));
    for (const id of thread.participant_ids) {
        if (id === message.sender_id) {
            unread[id] = 0;
        }
        else {
            unread[id] = ((_b = unread[id]) !== null && _b !== void 0 ? _b : 0) + 1;
        }
    }
    return upsertThread(tenantId, Object.assign(Object.assign({}, thread), { last_message_preview: previewOf(message.body), last_message_at: message.created_at, unread_by: unread, status: "open" }));
}
export async function sendMessage(tenantId, senderId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    if (!tenantId)
        throw new Error("MISSING_TENANT");
    if (!senderId)
        throw new Error("MISSING_SENDER");
    let subject = (_a = input.subject) !== null && _a !== void 0 ? _a : null;
    let body = ((_b = input.body) !== null && _b !== void 0 ? _b : "").trim();
    let bodyHtml = (_c = input.bodyHtml) !== null && _c !== void 0 ? _c : null;
    if (input.templateId) {
        const rendered = await renderTemplate(tenantId, input.templateId, ((_d = input.mergeVars) !== null && _d !== void 0 ? _d : {}));
        if (rendered) {
            subject = subject !== null && subject !== void 0 ? subject : rendered.subject;
            body = body || rendered.body;
            bodyHtml = bodyHtml !== null && bodyHtml !== void 0 ? bodyHtml : rendered.bodyHtml;
        }
    }
    if (body.length === 0)
        throw new Error("EMPTY_BODY");
    let threadRow = null;
    if (input.threadId) {
        threadRow = await getThreadRow(input.threadId, tenantId);
        if (!threadRow)
            throw new Error("THREAD_NOT_FOUND");
    }
    else {
        const recipients = Array.from(new Set([senderId, ...((_e = input.recipientIds) !== null && _e !== void 0 ? _e : [])].filter((id) => typeof id === "string" && id.length > 0)));
        if (recipients.length < 2)
            throw new Error("MISSING_RECIPIENT");
        threadRow = await upsertThread(tenantId, {
            tenant_id: tenantId,
            subject,
            channel_type: ((_f = input.channelType) !== null && _f !== void 0 ? _f : "in_app"),
            status: "open",
            participant_ids: recipients,
            context_type: (_g = input.contextType) !== null && _g !== void 0 ? _g : null,
            context_id: (_h = input.contextId) !== null && _h !== void 0 ? _h : null,
            created_by: senderId,
            unread_by: recipients.reduce((acc, id) => {
                acc[id] = 0;
                return acc;
            }, {}),
        });
        await Promise.all(recipients.map((id) => upsertParticipant(tenantId, {
            tenant_id: tenantId,
            thread_id: threadRow.id,
            profile_id: id,
            role: id === senderId ? "owner" : "member",
        })));
    }
    const recipientIds = ((_j = threadRow.participant_ids) !== null && _j !== void 0 ? _j : []).filter((id) => id !== senderId);
    const channelType = ((_l = (_k = input.channelType) !== null && _k !== void 0 ? _k : threadRow.channel_type) !== null && _l !== void 0 ? _l : "in_app");
    const attachments = (_m = input.attachments) !== null && _m !== void 0 ? _m : [];
    const messageRow = await upsertMessage(tenantId, {
        tenant_id: tenantId,
        thread_id: threadRow.id,
        sender_id: senderId,
        recipient_ids: recipientIds,
        channel_type: channelType,
        subject,
        body,
        body_html: bodyHtml,
        template_id: (_o = input.templateId) !== null && _o !== void 0 ? _o : null,
        merge_vars: (_p = input.mergeVars) !== null && _p !== void 0 ? _p : null,
        attachments: attachmentsToRow(attachments),
        delivery_status: "queued",
        reply_to_message_id: (_q = input.replyToMessageId) !== null && _q !== void 0 ? _q : null,
    });
    let emailBrandingMeta;
    if (channelType === "email") {
        const identity = await getPrimaryBrandingEmailIdentity(tenantId).catch(() => null);
        const env = applyEmailIdentity(identity);
        emailBrandingMeta = {
            emailFrom: `${env.fromName} <${env.fromEmail}>`,
            emailReplyTo: env.replyTo,
            brandingEmailVerified: env.verified,
            branding_from_name: env.fromName,
            branding_from_email: env.fromEmail,
        };
    }
    const deliveries = [];
    for (const recipientId of recipientIds) {
        const delivery = await enqueueAndDeliver({
            tenantId,
            messageId: messageRow.id,
            threadId: threadRow.id,
            recipientId,
            channelType,
            subject,
            body,
            bodyHtml,
            attachments,
            metadata: emailBrandingMeta,
        });
        deliveries.push(delivery);
    }
    const anyFailed = deliveries.some((d) => d.status === "failed");
    const finalStatus = anyFailed ? "failed" : "delivered";
    await upsertMessage(tenantId, Object.assign(Object.assign({}, messageRow), { delivery_status: finalStatus }));
    if (!anyFailed) {
        await recordUsage({
            tenantId,
            metric: "messages",
            amount: 1,
            source: "messaging",
            metadata: {
                threadId: threadRow.id,
                messageId: messageRow.id,
            },
        }).catch(() => null);
    }
    threadRow = await updateThreadAfterMessage(tenantId, threadRow, messageRow);
    try {
        const { emitAutomationTrigger } = await import("./integrations");
        await emitAutomationTrigger(tenantId, "messaging.message.sent", {
            threadId: threadRow.id,
            messageId: messageRow.id,
            senderId,
            recipientIds,
            channelType,
        });
        const { evaluateTriggers } = await import("@/lib/automation/workflows/automationOps");
        await evaluateTriggers({
            tenantId,
            triggerType: "message.received",
            payload: {
                threadId: threadRow.id,
                messageId: messageRow.id,
                senderId,
                recipientIds,
                channelType,
            },
            triggeredBy: senderId,
        });
    }
    catch (_r) {
        /* noop */
    }
    const [message] = await hydrateMessages(tenantId, [
        Object.assign(Object.assign({}, messageRow), { delivery_status: finalStatus }),
    ]);
    const profiles = threadRow.participant_ids.length
        ? await getProfilesByIds(threadRow.participant_ids, tenantId)
        : [];
    const pmap = new Map(profiles.map((p) => [p.id, p]));
    const thread = rowToThreadFull(threadRow, senderId, pmap);
    return { message, thread };
}
export async function markRead(tenantId, threadId, profileId) {
    var _a, _b;
    const thread = await getThreadRow(threadId, tenantId);
    if (!thread)
        return null;
    const unread = Object.assign({}, ((_a = thread.unread_by) !== null && _a !== void 0 ? _a : {}));
    unread[profileId] = 0;
    const readBy = Object.assign(Object.assign({}, ((_b = thread.read_by) !== null && _b !== void 0 ? _b : {})), { [profileId]: new Date().toISOString() });
    const updated = await upsertThread(tenantId, Object.assign(Object.assign({}, thread), { unread_by: unread, read_by: readBy }));
    const participants = await listParticipants(tenantId, {
        thread_id: threadId,
        profile_id: profileId,
    });
    await Promise.all(participants.map((p) => upsertParticipant(tenantId, Object.assign(Object.assign({}, p), { last_read_at: new Date().toISOString() }))));
    return updated;
}
export async function searchMessages(tenantId, profileId, query, opts) {
    var _a;
    const q = (query !== null && query !== void 0 ? query : "").trim();
    if (!q)
        return [];
    const rows = await listMessageRows(tenantId, { search: q }, { orderBy: "created_at", ascending: false, limit: (_a = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _a !== void 0 ? _a : 50 });
    if (rows.length === 0)
        return [];
    const threadIds = Array.from(new Set(rows.map((r) => r.thread_id)));
    const threadRows = [];
    for (const tid of threadIds) {
        const t = await getThreadRow(tid, tenantId);
        if (t)
            threadRows.push(t);
    }
    const profilesIds = new Set();
    for (const row of threadRows)
        for (const id of row.participant_ids)
            profilesIds.add(id);
    for (const row of rows)
        profilesIds.add(row.sender_id);
    const profiles = profilesIds.size
        ? await getProfilesByIds(Array.from(profilesIds), tenantId)
        : [];
    const pmap = new Map(profiles.map((p) => [p.id, p]));
    const threadsById = new Map(threadRows.map((t) => [t.id, rowToThreadFull(t, profileId, pmap)]));
    const messages = await hydrateMessages(tenantId, rows);
    const qLower = q.toLowerCase();
    return messages
        .filter((m) => {
        const thread = threadsById.get(m.threadId);
        if (!thread)
            return false;
        // restrict to threads the profile participates in (admins see all upstream)
        return thread.participantIds.includes(profileId);
    })
        .map((m) => {
        const thread = threadsById.get(m.threadId);
        const idx = m.body.toLowerCase().indexOf(qLower);
        const start = Math.max(0, idx - 32);
        const end = Math.min(m.body.length, (idx === -1 ? 0 : idx) + q.length + 64);
        const snippet = m.body.slice(start, end);
        return { message: m, thread, snippet };
    });
}
export async function getUnreadSummary(tenantId, profileId) {
    const { listThreadsFor } = await import("./threads");
    const { threads, totalUnread } = await listThreadsFor(tenantId, profileId);
    return {
        profileId,
        tenantId,
        totalUnread,
        threads: threads
            .filter((t) => t.unreadCount > 0)
            .map((t) => ({
            threadId: t.id,
            unreadCount: t.unreadCount,
            lastMessageAt: t.lastMessageAt,
            subject: t.subject,
            channelType: t.channelType,
        })),
    };
}
export { rowToMessage, hydrateMessages };
