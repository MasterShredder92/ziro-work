import "server-only";
import { listThreads as listThreadRows, getThread as getThreadRow, upsertThread, deleteThread as deleteThreadRow, } from "@data/messageThreads";
import { listParticipants, upsertParticipant, removeParticipant as removeParticipantRow, } from "@data/messageParticipants";
import { getProfilesByIds } from "@data/profiles";
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
function rowToThread(row, profileId, profilesById) {
    var _a, _b;
    const participants = row.participant_ids
        .map((id) => profilesById.get(id))
        .filter((p) => Boolean(p))
        .map(profileToParticipant);
    const unreadCount = (_b = (_a = row.unread_by) === null || _a === void 0 ? void 0 : _a[profileId]) !== null && _b !== void 0 ? _b : 0;
    return {
        id: row.id,
        tenantId: row.tenant_id,
        subject: row.subject,
        channelType: row.channel_type,
        status: row.status,
        participantIds: row.participant_ids,
        lastMessagePreview: row.last_message_preview,
        lastMessageAt: row.last_message_at,
        unreadCount,
        contextType: row.context_type,
        contextId: row.context_id,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        participants,
    };
}
export async function listThreadsFor(tenantId, profileId, filter) {
    var _a, _b;
    const rows = await listThreadRows(tenantId, {
        status: filter === null || filter === void 0 ? void 0 : filter.status,
        channel_type: filter === null || filter === void 0 ? void 0 : filter.channelType,
        participant_id: (_a = filter === null || filter === void 0 ? void 0 : filter.participantId) !== null && _a !== void 0 ? _a : profileId,
        context_type: filter === null || filter === void 0 ? void 0 : filter.contextType,
        context_id: filter === null || filter === void 0 ? void 0 : filter.contextId,
        search: filter === null || filter === void 0 ? void 0 : filter.search,
    }, { limit: (_b = filter === null || filter === void 0 ? void 0 : filter.limit) !== null && _b !== void 0 ? _b : 200, offset: filter === null || filter === void 0 ? void 0 : filter.offset });
    const ids = new Set();
    for (const row of rows)
        for (const id of row.participant_ids)
            ids.add(id);
    const profiles = ids.size
        ? await getProfilesByIds(Array.from(ids), tenantId)
        : [];
    const map = new Map(profiles.map((p) => [p.id, p]));
    const threads = rows.map((r) => rowToThread(r, profileId, map));
    const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);
    return { threads, totalUnread };
}
export async function getThreadFor(threadId, tenantId, profileId) {
    const row = await getThreadRow(threadId, tenantId);
    if (!row)
        return null;
    const profiles = row.participant_ids.length
        ? await getProfilesByIds(row.participant_ids, tenantId)
        : [];
    const map = new Map(profiles.map((p) => [p.id, p]));
    return { row, thread: rowToThread(row, profileId, map) };
}
export async function createThread(tenantId, input) {
    var _a, _b, _c, _d, _e, _f;
    const participantIds = Array.from(new Set([input.createdBy, ...((_a = input.participantIds) !== null && _a !== void 0 ? _a : [])].filter((id) => typeof id === "string" && id.length > 0)));
    const row = await upsertThread(tenantId, {
        tenant_id: tenantId,
        subject: (_b = input.subject) !== null && _b !== void 0 ? _b : null,
        channel_type: ((_c = input.channelType) !== null && _c !== void 0 ? _c : "in_app"),
        status: "open",
        participant_ids: participantIds,
        context_type: (_d = input.contextType) !== null && _d !== void 0 ? _d : null,
        context_id: (_e = input.contextId) !== null && _e !== void 0 ? _e : null,
        created_by: input.createdBy,
        metadata: (_f = input.metadata) !== null && _f !== void 0 ? _f : null,
        unread_by: participantIds.reduce((acc, id) => {
            acc[id] = 0;
            return acc;
        }, {}),
    });
    await Promise.all(participantIds.map((id, index) => upsertParticipant(tenantId, {
        tenant_id: tenantId,
        thread_id: row.id,
        profile_id: id,
        role: index === 0 && id === input.createdBy
            ? "owner"
            : "member",
    })));
    return row;
}
export async function archiveThread(threadId, tenantId) {
    const row = await getThreadRow(threadId, tenantId);
    if (!row)
        return null;
    return upsertThread(tenantId, Object.assign(Object.assign({}, row), { status: "archived" }));
}
export async function reopenThread(threadId, tenantId) {
    const row = await getThreadRow(threadId, tenantId);
    if (!row)
        return null;
    return upsertThread(tenantId, Object.assign(Object.assign({}, row), { status: "open" }));
}
export async function deleteThread(threadId, tenantId) {
    await deleteThreadRow(threadId, tenantId);
}
export async function addParticipant(tenantId, threadId, profileId, role = "member") {
    var _a;
    const row = await getThreadRow(threadId, tenantId);
    if (!row)
        return null;
    if (!row.participant_ids.includes(profileId)) {
        await upsertThread(tenantId, Object.assign(Object.assign({}, row), { participant_ids: [...row.participant_ids, profileId], unread_by: Object.assign(Object.assign({}, ((_a = row.unread_by) !== null && _a !== void 0 ? _a : {})), { [profileId]: 0 }) }));
    }
    return upsertParticipant(tenantId, {
        tenant_id: tenantId,
        thread_id: threadId,
        profile_id: profileId,
        role,
    });
}
export async function removeParticipant(tenantId, threadId, participantId) {
    await removeParticipantRow(participantId, tenantId);
}
export async function listThreadParticipants(tenantId, threadId) {
    const rows = await listParticipants(tenantId, { thread_id: threadId });
    const profiles = await getProfilesByIds(rows.map((r) => r.profile_id), tenantId);
    const map = new Map(profiles.map((p) => [p.id, p]));
    return rows.map((r) => ({
        id: r.id,
        threadId: r.thread_id,
        profileId: r.profile_id,
        role: r.role,
        isMuted: r.is_muted,
        lastReadAt: r.last_read_at,
        joinedAt: r.joined_at,
        display: map.has(r.profile_id)
            ? profileToParticipant(map.get(r.profile_id))
            : null,
    }));
}
export { rowToThread };
