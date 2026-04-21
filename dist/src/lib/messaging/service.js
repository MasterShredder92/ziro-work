import "server-only";
import { getProfilesByIds } from "@data/profiles";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { buildConversationDetail, getThread, listMessages, listThreads, sendMessage as sendMessageQuery, } from "./queries";
async function resolveTenantId() {
    var _a;
    const session = await getSession();
    return ((_a = session === null || session === void 0 ? void 0 : session.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
}
export async function getInbox(profileId) {
    const tenantId = await resolveTenantId();
    const threads = await listThreads(profileId);
    const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);
    return {
        profileId,
        tenantId,
        threads,
        totalThreads: threads.length,
        totalUnread,
    };
}
export async function getConversation(threadId) {
    var _a;
    const session = await getSession();
    const profileId = (_a = session === null || session === void 0 ? void 0 : session.userId) !== null && _a !== void 0 ? _a : "";
    const threadData = await getThread(threadId);
    if (!threadData)
        return null;
    const tenantId = await resolveTenantId();
    const [messages, participantProfiles] = await Promise.all([
        listMessages(threadId),
        threadData.conversation
            ? getProfilesByIds(threadData.participants.map((p) => p.profileId), tenantId)
            : Promise.resolve([]),
    ]);
    return buildConversationDetail(threadData.conversation, messages, profileId, participantProfiles);
}
export async function sendMessage(profileId, targetId, body) {
    const { thread } = await sendMessageQuery(profileId, targetId, body);
    const detail = await getConversation(thread.id);
    if (!detail)
        throw new Error("THREAD_NOT_FOUND_AFTER_SEND");
    return detail;
}
// ============================================================================
// First-class Messaging OS service layer (MessageThread / Message / Delivery).
// Uses the new top-level data facades in lib/data/message*.ts. All surfaces
// built on /api/messages/* and the MessagingDashboard consume these helpers.
// ============================================================================
import { listChannels } from "@data/messageChannels";
import { assertTenantAccess } from "@/lib/auth/guards";
import { listThreadsFor, getThreadFor, listThreadParticipants, createThread as createThreadOp, archiveThread as archiveThreadOp, deleteThread as deleteThreadOp, addParticipant as addParticipantOp, removeParticipant as removeParticipantOp, } from "./threads";
import { sendMessage as sendMessageOp, updateMessage as updateMessageOp, markRead as markReadOp, searchMessages as searchMessagesOp, listMessagesForThread, getUnreadSummary as getUnreadSummaryOp, } from "./messageOps";
import { listDeliveriesForThread } from "./delivery";
function channelRowToChannel(row) {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        channelType: row.channel_type,
        label: row.label,
        isActive: row.is_active,
        isDefault: row.is_default,
        config: row.config,
    };
}
async function ensureTenant(tenantId) {
    await assertTenantAccess(tenantId);
}
export async function listThreadsForUser(tenantId, profileId, filter) {
    await ensureTenant(tenantId);
    return listThreadsFor(tenantId, profileId, filter);
}
export async function getThreadDetail(tenantId, threadId, profileId) {
    await ensureTenant(tenantId);
    const t = await getThreadFor(threadId, tenantId, profileId);
    if (!t)
        return null;
    const [messages, participants, channelRows] = await Promise.all([
        listMessagesForThread(tenantId, threadId),
        listThreadParticipants(tenantId, threadId),
        listChannels(tenantId),
    ]);
    // Enrich thread.unreadCount with deliveries for this profile where available.
    const _deliveries = await listDeliveriesForThread(tenantId, threadId);
    void _deliveries;
    return {
        thread: t.thread,
        messages,
        participants,
        channels: channelRows.map(channelRowToChannel),
    };
}
export async function createThread(tenantId, creatorProfileId, input) {
    await ensureTenant(tenantId);
    const row = await createThreadOp(tenantId, Object.assign(Object.assign({}, input), { createdBy: creatorProfileId }));
    const full = await getThreadFor(row.id, tenantId, creatorProfileId);
    if (!full)
        throw new Error("THREAD_CREATE_FAILED");
    return full.thread;
}
export async function sendMessageOnThread(tenantId, senderId, input) {
    await ensureTenant(tenantId);
    return sendMessageOp(tenantId, senderId, input);
}
export async function updateMessage(tenantId, messageId, senderId, patch) {
    await ensureTenant(tenantId);
    return updateMessageOp(tenantId, messageId, senderId, patch);
}
export async function markThreadRead(tenantId, threadId, profileId) {
    await ensureTenant(tenantId);
    await markReadOp(tenantId, threadId, profileId);
}
export async function archiveThread(tenantId, threadId) {
    await ensureTenant(tenantId);
    await archiveThreadOp(threadId, tenantId);
}
export async function deleteThread(tenantId, threadId) {
    await ensureTenant(tenantId);
    await deleteThreadOp(threadId, tenantId);
}
export async function addParticipantToThread(tenantId, threadId, profileId) {
    await ensureTenant(tenantId);
    await addParticipantOp(tenantId, threadId, profileId);
    return listThreadParticipants(tenantId, threadId);
}
export async function removeParticipantFromThread(tenantId, threadId, participantId) {
    await ensureTenant(tenantId);
    await removeParticipantOp(tenantId, threadId, participantId);
    return listThreadParticipants(tenantId, threadId);
}
export async function searchMessages(tenantId, profileId, query, limit) {
    await ensureTenant(tenantId);
    return searchMessagesOp(tenantId, profileId, query, { limit });
}
export async function getUnreadSummary(tenantId, profileId) {
    await ensureTenant(tenantId);
    return getUnreadSummaryOp(tenantId, profileId);
}
export async function listMessagingChannels(tenantId) {
    await ensureTenant(tenantId);
    const rows = await listChannels(tenantId);
    return rows.map(channelRowToChannel);
}
