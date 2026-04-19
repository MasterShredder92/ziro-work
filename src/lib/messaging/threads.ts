import "server-only";
import {
  listThreads as listThreadRows,
  getThread as getThreadRow,
  upsertThread,
  deleteThread as deleteThreadRow,
  type MessageThreadRow,
} from "@data/messageThreads";
import {
  listParticipants,
  upsertParticipant,
  removeParticipant as removeParticipantRow,
  type MessageParticipantRow,
} from "@data/messageParticipants";
import { getProfilesByIds, type Profile } from "@data/profiles";
import type {
  ChannelType,
  CreateThreadInput,
  MessageParticipant,
  MessageThread,
  MessagingParticipant,
  ParticipantRole,
  ThreadFilter,
  ThreadListResult,
  ThreadStatus,
} from "./types";

function profileToParticipant(p: Profile): MessagingParticipant {
  const fullName =
    `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || p.id;
  return {
    profileId: p.id,
    fullName,
    role: (p.role as string | null) ?? null,
    avatarUrl: (p.avatar_url as string | null) ?? null,
  };
}

function rowToThread(
  row: MessageThreadRow,
  profileId: string,
  profilesById: Map<string, Profile>,
): MessageThread {
  const participants = row.participant_ids
    .map((id) => profilesById.get(id))
    .filter((p): p is Profile => Boolean(p))
    .map(profileToParticipant);
  const unreadCount = row.unread_by?.[profileId] ?? 0;
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

export async function listThreadsFor(
  tenantId: string,
  profileId: string,
  filter?: ThreadFilter,
): Promise<ThreadListResult> {
  const rows = await listThreadRows(
    tenantId,
    {
      status: filter?.status,
      channel_type: filter?.channelType,
      participant_id: filter?.participantId ?? profileId,
      context_type: filter?.contextType,
      context_id: filter?.contextId,
      search: filter?.search,
    },
    { limit: filter?.limit ?? 200, offset: filter?.offset },
  );

  const ids = new Set<string>();
  for (const row of rows) for (const id of row.participant_ids) ids.add(id);
  const profiles = ids.size
    ? await getProfilesByIds(Array.from(ids), tenantId)
    : [];
  const map = new Map(profiles.map((p) => [p.id, p]));

  const threads = rows.map((r) => rowToThread(r, profileId, map));
  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);
  return { threads, totalUnread };
}

export async function getThreadFor(
  threadId: string,
  tenantId: string,
  profileId: string,
): Promise<{
  row: MessageThreadRow;
  thread: MessageThread;
} | null> {
  const row = await getThreadRow(threadId, tenantId);
  if (!row) return null;
  const profiles = row.participant_ids.length
    ? await getProfilesByIds(row.participant_ids, tenantId)
    : [];
  const map = new Map(profiles.map((p) => [p.id, p]));
  return { row, thread: rowToThread(row, profileId, map) };
}

export async function createThread(
  tenantId: string,
  input: CreateThreadInput & { createdBy: string },
): Promise<MessageThreadRow> {
  const participantIds = Array.from(
    new Set(
      [input.createdBy, ...(input.participantIds ?? [])].filter(
        (id) => typeof id === "string" && id.length > 0,
      ),
    ),
  );
  const row = await upsertThread(tenantId, {
    tenant_id: tenantId,
    subject: input.subject ?? null,
    channel_type: (input.channelType ?? "in_app") as ChannelType,
    status: "open" as ThreadStatus,
    participant_ids: participantIds,
    context_type: input.contextType ?? null,
    context_id: input.contextId ?? null,
    created_by: input.createdBy,
    metadata: input.metadata ?? null,
    unread_by: participantIds.reduce<Record<string, number>>((acc, id) => {
      acc[id] = 0;
      return acc;
    }, {}),
  });

  await Promise.all(
    participantIds.map((id, index) =>
      upsertParticipant(tenantId, {
        tenant_id: tenantId,
        thread_id: row.id,
        profile_id: id,
        role:
          index === 0 && id === input.createdBy
            ? ("owner" as ParticipantRole)
            : ("member" as ParticipantRole),
      }),
    ),
  );
  return row;
}

export async function archiveThread(
  threadId: string,
  tenantId: string,
): Promise<MessageThreadRow | null> {
  const row = await getThreadRow(threadId, tenantId);
  if (!row) return null;
  return upsertThread(tenantId, { ...row, status: "archived" });
}

export async function reopenThread(
  threadId: string,
  tenantId: string,
): Promise<MessageThreadRow | null> {
  const row = await getThreadRow(threadId, tenantId);
  if (!row) return null;
  return upsertThread(tenantId, { ...row, status: "open" });
}

export async function deleteThread(
  threadId: string,
  tenantId: string,
): Promise<void> {
  await deleteThreadRow(threadId, tenantId);
}

export async function addParticipant(
  tenantId: string,
  threadId: string,
  profileId: string,
  role: ParticipantRole = "member",
): Promise<MessageParticipantRow | null> {
  const row = await getThreadRow(threadId, tenantId);
  if (!row) return null;
  if (!row.participant_ids.includes(profileId)) {
    await upsertThread(tenantId, {
      ...row,
      participant_ids: [...row.participant_ids, profileId],
      unread_by: { ...(row.unread_by ?? {}), [profileId]: 0 },
    });
  }
  return upsertParticipant(tenantId, {
    tenant_id: tenantId,
    thread_id: threadId,
    profile_id: profileId,
    role,
  });
}

export async function removeParticipant(
  tenantId: string,
  threadId: string,
  participantId: string,
): Promise<void> {
  await removeParticipantRow(participantId, tenantId);
}

export async function listThreadParticipants(
  tenantId: string,
  threadId: string,
): Promise<MessageParticipant[]> {
  const rows = await listParticipants(tenantId, { thread_id: threadId });
  const profiles = await getProfilesByIds(
    rows.map((r) => r.profile_id),
    tenantId,
  );
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
      ? profileToParticipant(map.get(r.profile_id) as Profile)
      : null,
  }));
}

export { rowToThread };
