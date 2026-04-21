import "server-only";
import { createAIConversation, createAIMessage, getAIConversationById, listAIConversations, listAIMessages, } from "@data/aiConversations";
import { getProfilesByIds, listProfiles } from "@data/profiles";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { MESSAGING_SOURCE, } from "./types";
async function resolveTenantId() {
    var _a;
    const session = await getSession();
    return ((_a = session === null || session === void 0 ? void 0 : session.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
}
function readMeta(c) {
    var _a;
    const raw = (_a = c.metadata) !== null && _a !== void 0 ? _a : {};
    return raw;
}
function participantsOf(c) {
    const meta = readMeta(c);
    const list = Array.isArray(meta.participants) ? meta.participants : [];
    const cleaned = list
        .filter((v) => typeof v === "string" && v.length > 0)
        .slice();
    if (c.profile_id && !cleaned.includes(c.profile_id)) {
        cleaned.unshift(c.profile_id);
    }
    return cleaned;
}
function subjectOf(c) {
    const meta = readMeta(c);
    return typeof meta.subject === "string" && meta.subject.trim().length > 0
        ? meta.subject
        : null;
}
function previewOf(c) {
    const meta = readMeta(c);
    return typeof meta.last_message === "string" && meta.last_message.length > 0
        ? meta.last_message
        : null;
}
function lastMessageAt(c) {
    var _a, _b;
    const meta = readMeta(c);
    if (typeof meta.last_message_at === "string" && meta.last_message_at) {
        return meta.last_message_at;
    }
    return (_b = (_a = c.updated_at) !== null && _a !== void 0 ? _a : c.created_at) !== null && _b !== void 0 ? _b : null;
}
function unreadCountFor(c, profileId) {
    var _a;
    const meta = readMeta(c);
    const readAt = (_a = meta.read_by) === null || _a === void 0 ? void 0 : _a[profileId];
    const last = lastMessageAt(c);
    if (!last)
        return 0;
    if (!readAt)
        return 1;
    return new Date(last).getTime() > new Date(readAt).getTime() ? 1 : 0;
}
function profileToParticipant(p) {
    var _a, _b, _c, _d;
    const fullName = `${(_a = p.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = p.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() || p.email || p.id;
    return {
        profileId: p.id,
        fullName,
        role: (_c = p.role) !== null && _c !== void 0 ? _c : null,
        avatarUrl: (_d = p.avatar_url) !== null && _d !== void 0 ? _d : null,
    };
}
function toInboxThread(c, profileId, participantMap) {
    var _a, _b, _c, _d, _e;
    const participantIds = participantsOf(c);
    const counterpartId = (_a = participantIds.find((id) => id !== profileId)) !== null && _a !== void 0 ? _a : null;
    const counterpart = counterpartId
        ? (_b = participantMap.get(counterpartId)) !== null && _b !== void 0 ? _b : null
        : null;
    return {
        id: c.id,
        tenantId: c.tenant_id,
        participantIds,
        counterpart,
        subject: subjectOf(c),
        lastMessagePreview: previewOf(c),
        lastMessageAt: lastMessageAt(c),
        unreadCount: unreadCountFor(c, profileId),
        updatedAt: (_d = (_c = c.updated_at) !== null && _c !== void 0 ? _c : c.created_at) !== null && _d !== void 0 ? _d : "",
        createdAt: (_e = c.created_at) !== null && _e !== void 0 ? _e : "",
    };
}
export async function listThreads(profileId) {
    if (!profileId)
        return [];
    const tenantId = await resolveTenantId();
    const owned = await listAIConversations(tenantId, { profile_id: profileId, source: MESSAGING_SOURCE }, { orderBy: "updated_at", ascending: false, limit: 100 });
    const everyone = await listAIConversations(tenantId, { source: MESSAGING_SOURCE }, { orderBy: "updated_at", ascending: false, limit: 200 });
    const combined = new Map();
    for (const c of owned)
        combined.set(c.id, c);
    for (const c of everyone) {
        const ids = participantsOf(c);
        if (ids.includes(profileId))
            combined.set(c.id, c);
    }
    const conversations = Array.from(combined.values()).sort((a, b) => {
        var _a, _b, _c, _d;
        const aT = new Date((_b = (_a = a.updated_at) !== null && _a !== void 0 ? _a : a.created_at) !== null && _b !== void 0 ? _b : 0).getTime();
        const bT = new Date((_d = (_c = b.updated_at) !== null && _c !== void 0 ? _c : b.created_at) !== null && _d !== void 0 ? _d : 0).getTime();
        return bT - aT;
    });
    const participantIds = new Set();
    for (const c of conversations) {
        for (const id of participantsOf(c))
            participantIds.add(id);
    }
    participantIds.delete(profileId);
    const profiles = participantIds.size > 0
        ? await getProfilesByIds(Array.from(participantIds), tenantId)
        : [];
    const map = new Map(profiles.map((p) => [p.id, profileToParticipant(p)]));
    return conversations.map((c) => toInboxThread(c, profileId, map));
}
export async function getThread(threadId) {
    if (!threadId)
        return null;
    const tenantId = await resolveTenantId();
    const conv = await getAIConversationById(threadId, tenantId);
    if (!conv || conv.source !== MESSAGING_SOURCE)
        return null;
    const ids = participantsOf(conv);
    const profiles = ids.length > 0 ? await getProfilesByIds(ids, tenantId) : [];
    const participants = profiles.map(profileToParticipant);
    return { conversation: conv, participants };
}
export async function listMessages(threadId) {
    if (!threadId)
        return [];
    const tenantId = await resolveTenantId();
    return listAIMessages(threadId, tenantId, {
        orderBy: "seq",
        ascending: true,
        limit: 500,
    });
}
export function toInboxMessage(msg, profileId, authorName) {
    var _a;
    return {
        id: msg.id,
        threadId: msg.conversation_id,
        authorProfileId: msg.profile_id,
        authorName,
        role: msg.role,
        body: (_a = msg.content) !== null && _a !== void 0 ? _a : "",
        createdAt: msg.created_at,
        seq: msg.seq,
        isMine: msg.profile_id === profileId,
    };
}
export { toInboxThread };
async function findOrCreateThread(tenantId, profileId, targetId) {
    const mine = await listAIConversations(tenantId, { profile_id: profileId, source: MESSAGING_SOURCE }, { orderBy: "updated_at", ascending: false, limit: 200 });
    for (const c of mine) {
        const ids = participantsOf(c);
        if (ids.includes(profileId) && ids.includes(targetId))
            return c;
    }
    const theirs = await listAIConversations(tenantId, { profile_id: targetId, source: MESSAGING_SOURCE }, { orderBy: "updated_at", ascending: false, limit: 200 });
    for (const c of theirs) {
        const ids = participantsOf(c);
        if (ids.includes(profileId) && ids.includes(targetId))
            return c;
    }
    const metadata = {
        participants: [profileId, targetId],
    };
    const created = await createAIConversation(tenantId, {
        profile_id: profileId,
        source: MESSAGING_SOURCE,
        metadata: metadata,
    });
    return created;
}
export async function sendMessage(profileId, targetId, body) {
    var _a, _b;
    const trimmed = (body !== null && body !== void 0 ? body : "").trim();
    if (!profileId)
        throw new Error("MISSING_PROFILE");
    if (!targetId)
        throw new Error("MISSING_TARGET");
    if (trimmed.length === 0)
        throw new Error("EMPTY_BODY");
    const tenantId = await resolveTenantId();
    const thread = await findOrCreateThread(tenantId, profileId, targetId);
    const { updateAIConversation } = await import("@data/aiConversations");
    const message = await createAIMessage(tenantId, {
        conversation_id: thread.id,
        profile_id: profileId,
        role: "user",
        content: trimmed,
    });
    const meta = readMeta(thread);
    const nextMeta = Object.assign(Object.assign({}, meta), { participants: Array.from(new Set([...((_a = meta.participants) !== null && _a !== void 0 ? _a : []), profileId, targetId])), last_message: trimmed.length > 280 ? `${trimmed.slice(0, 277)}…` : trimmed, last_message_at: message.created_at, read_by: Object.assign(Object.assign({}, ((_b = meta.read_by) !== null && _b !== void 0 ? _b : {})), { [profileId]: message.created_at }) });
    await updateAIConversation(thread.id, tenantId, {
        metadata: nextMeta,
    });
    return { thread, message };
}
export async function listPotentialRecipients(profileId) {
    const tenantId = await resolveTenantId();
    const rows = await listProfiles(tenantId, { is_active: true }, { limit: 200, orderBy: "first_name", ascending: true });
    return rows
        .filter((p) => p.id !== profileId)
        .map(profileToParticipant);
}
export function buildInboxThreadsFromConversations(conversations, profileId, participants) {
    const map = new Map(participants.map((p) => [p.id, profileToParticipant(p)]));
    return conversations.map((c) => toInboxThread(c, profileId, map));
}
export function buildConversationDetail(conv, messages, profileId, participantProfiles) {
    const participants = participantProfiles.map(profileToParticipant);
    const nameByProfile = new Map(participants.map((p) => [p.profileId, p.fullName]));
    const mapForThread = new Map(participants.map((p) => [p.profileId, p]));
    const thread = toInboxThread(conv, profileId, mapForThread);
    const inboxMessages = messages
        .slice()
        .sort((a, b) => a.seq - b.seq)
        .map((m) => { var _a; return toInboxMessage(m, profileId, (_a = nameByProfile.get(m.profile_id)) !== null && _a !== void 0 ? _a : null); });
    return { thread, messages: inboxMessages, participants };
}
