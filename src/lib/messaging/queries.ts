import "server-only";
import {
  createAIConversation,
  createAIMessage,
  getAIConversationById,
  listAIConversations,
  listAIMessages,
} from "@data/aiConversations";
import { getProfilesByIds, listProfiles, type Profile } from "@data/profiles";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import type {
  AIConversation,
  AIMessage,
  Json,
} from "@/lib/types/entities";
import {
  MESSAGING_SOURCE,
  type ConversationDetail,
  type InboxMessage,
  type InboxThread,
  type MessagingParticipant,
} from "./types";

type MessagingMetadata = {
  participants?: string[];
  subject?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  read_by?: Record<string, string>;
};

async function resolveTenantId(): Promise<string> {
  const session = await getSession();
  return session?.tenantId?.trim() || DEFAULT_TENANT_ID;
}

function readMeta(c: AIConversation): MessagingMetadata {
  const raw = (c.metadata as Record<string, unknown> | null | undefined) ?? {};
  return raw as MessagingMetadata;
}

function participantsOf(c: AIConversation): string[] {
  const meta = readMeta(c);
  const list = Array.isArray(meta.participants) ? meta.participants : [];
  const cleaned = list
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .slice();
  if (c.profile_id && !cleaned.includes(c.profile_id)) {
    cleaned.unshift(c.profile_id);
  }
  return cleaned;
}

function subjectOf(c: AIConversation): string | null {
  const meta = readMeta(c);
  return typeof meta.subject === "string" && meta.subject.trim().length > 0
    ? meta.subject
    : null;
}

function previewOf(c: AIConversation): string | null {
  const meta = readMeta(c);
  return typeof meta.last_message === "string" && meta.last_message.length > 0
    ? meta.last_message
    : null;
}

function lastMessageAt(c: AIConversation): string | null {
  const meta = readMeta(c);
  if (typeof meta.last_message_at === "string" && meta.last_message_at) {
    return meta.last_message_at;
  }
  return c.updated_at ?? c.created_at ?? null;
}

function unreadCountFor(c: AIConversation, profileId: string): number {
  const meta = readMeta(c);
  const readAt = meta.read_by?.[profileId];
  const last = lastMessageAt(c);
  if (!last) return 0;
  if (!readAt) return 1;
  return new Date(last).getTime() > new Date(readAt).getTime() ? 1 : 0;
}

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

function toInboxThread(
  c: AIConversation,
  profileId: string,
  participantMap: Map<string, MessagingParticipant>,
): InboxThread {
  const participantIds = participantsOf(c);
  const counterpartId = participantIds.find((id) => id !== profileId) ?? null;
  const counterpart = counterpartId
    ? participantMap.get(counterpartId) ?? null
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
    updatedAt: c.updated_at ?? c.created_at ?? "",
    createdAt: c.created_at ?? "",
  };
}

export async function listThreads(profileId: string): Promise<InboxThread[]> {
  if (!profileId) return [];
  const tenantId = await resolveTenantId();

  const owned = await listAIConversations(
    tenantId,
    { profile_id: profileId, source: MESSAGING_SOURCE },
    { orderBy: "updated_at", ascending: false, limit: 100 },
  );

  const everyone = await listAIConversations(
    tenantId,
    { source: MESSAGING_SOURCE },
    { orderBy: "updated_at", ascending: false, limit: 200 },
  );

  const combined = new Map<string, AIConversation>();
  for (const c of owned) combined.set(c.id, c);
  for (const c of everyone) {
    const ids = participantsOf(c);
    if (ids.includes(profileId)) combined.set(c.id, c);
  }

  const conversations = Array.from(combined.values()).sort((a, b) => {
    const aT = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
    const bT = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
    return bT - aT;
  });

  const participantIds = new Set<string>();
  for (const c of conversations) {
    for (const id of participantsOf(c)) participantIds.add(id);
  }
  participantIds.delete(profileId);

  const profiles =
    participantIds.size > 0
      ? await getProfilesByIds(Array.from(participantIds), tenantId)
      : [];
  const map = new Map<string, MessagingParticipant>(
    profiles.map((p) => [p.id, profileToParticipant(p)]),
  );

  return conversations.map((c) => toInboxThread(c, profileId, map));
}

export async function getThread(threadId: string): Promise<{
  conversation: AIConversation;
  participants: MessagingParticipant[];
} | null> {
  if (!threadId) return null;
  const tenantId = await resolveTenantId();
  const conv = await getAIConversationById(threadId, tenantId);
  if (!conv || conv.source !== MESSAGING_SOURCE) return null;

  const ids = participantsOf(conv);
  const profiles = ids.length > 0 ? await getProfilesByIds(ids, tenantId) : [];
  const participants = profiles.map(profileToParticipant);
  return { conversation: conv, participants };
}

export async function listMessages(threadId: string): Promise<AIMessage[]> {
  if (!threadId) return [];
  const tenantId = await resolveTenantId();
  return listAIMessages(threadId, tenantId, {
    orderBy: "seq",
    ascending: true,
    limit: 500,
  });
}

export function toInboxMessage(
  msg: AIMessage,
  profileId: string,
  authorName: string | null,
): InboxMessage {
  return {
    id: msg.id,
    threadId: msg.conversation_id,
    authorProfileId: msg.profile_id,
    authorName,
    role: msg.role,
    body: msg.content ?? "",
    createdAt: msg.created_at,
    seq: msg.seq,
    isMine: msg.profile_id === profileId,
  };
}

export { toInboxThread };

async function findOrCreateThread(
  tenantId: string,
  profileId: string,
  targetId: string,
): Promise<AIConversation> {
  const mine = await listAIConversations(
    tenantId,
    { profile_id: profileId, source: MESSAGING_SOURCE },
    { orderBy: "updated_at", ascending: false, limit: 200 },
  );
  for (const c of mine) {
    const ids = participantsOf(c);
    if (ids.includes(profileId) && ids.includes(targetId)) return c;
  }

  const theirs = await listAIConversations(
    tenantId,
    { profile_id: targetId, source: MESSAGING_SOURCE },
    { orderBy: "updated_at", ascending: false, limit: 200 },
  );
  for (const c of theirs) {
    const ids = participantsOf(c);
    if (ids.includes(profileId) && ids.includes(targetId)) return c;
  }

  const metadata: MessagingMetadata = {
    participants: [profileId, targetId],
  };
  const created = await createAIConversation(tenantId, {
    profile_id: profileId,
    source: MESSAGING_SOURCE,
    metadata: metadata as unknown as Json,
  });
  return created;
}

export async function sendMessage(
  profileId: string,
  targetId: string,
  body: string,
): Promise<{ thread: AIConversation; message: AIMessage }> {
  const trimmed = (body ?? "").trim();
  if (!profileId) throw new Error("MISSING_PROFILE");
  if (!targetId) throw new Error("MISSING_TARGET");
  if (trimmed.length === 0) throw new Error("EMPTY_BODY");

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
  const nextMeta: MessagingMetadata = {
    ...meta,
    participants: Array.from(
      new Set([...(meta.participants ?? []), profileId, targetId]),
    ),
    last_message: trimmed.length > 280 ? `${trimmed.slice(0, 277)}…` : trimmed,
    last_message_at: message.created_at,
    read_by: { ...(meta.read_by ?? {}), [profileId]: message.created_at },
  };
  await updateAIConversation(thread.id, tenantId, {
    metadata: nextMeta as unknown as Json,
  });

  return { thread, message };
}

export async function listPotentialRecipients(
  profileId: string,
): Promise<MessagingParticipant[]> {
  const tenantId = await resolveTenantId();
  const rows = await listProfiles(
    tenantId,
    { is_active: true },
    { limit: 200, orderBy: "first_name", ascending: true },
  );
  return rows
    .filter((p) => p.id !== profileId)
    .map(profileToParticipant);
}

export function buildInboxThreadsFromConversations(
  conversations: AIConversation[],
  profileId: string,
  participants: Profile[],
): InboxThread[] {
  const map = new Map<string, MessagingParticipant>(
    participants.map((p) => [p.id, profileToParticipant(p)]),
  );
  return conversations.map((c) => toInboxThread(c, profileId, map));
}

export function buildConversationDetail(
  conv: AIConversation,
  messages: AIMessage[],
  profileId: string,
  participantProfiles: Profile[],
): ConversationDetail {
  const participants = participantProfiles.map(profileToParticipant);
  const nameByProfile = new Map(
    participants.map((p) => [p.profileId, p.fullName]),
  );
  const mapForThread = new Map<string, MessagingParticipant>(
    participants.map((p) => [p.profileId, p]),
  );
  const thread = toInboxThread(conv, profileId, mapForThread);
  const inboxMessages = messages
    .slice()
    .sort((a, b) => a.seq - b.seq)
    .map((m) =>
      toInboxMessage(m, profileId, nameByProfile.get(m.profile_id) ?? null),
    );
  return { thread, messages: inboxMessages, participants };
}
