import "server-only";
import { getProfilesByIds } from "@data/profiles";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import {
  buildConversationDetail,
  getThread,
  listMessages,
  listThreads,
  sendMessage as sendMessageQuery,
} from "./queries";
import type {
  ConversationDetail,
  InboxSummary,
  InboxThread,
} from "./types";

async function resolveTenantId(): Promise<string> {
  const session = await getSession();
  return session?.tenantId?.trim() || DEFAULT_TENANT_ID;
}

export async function getInbox(profileId: string): Promise<InboxSummary> {
  const tenantId = await resolveTenantId();
  const threads = await listThreads(profileId);
  const totalUnread = threads.reduce(
    (sum: number, t: InboxThread) => sum + t.unreadCount,
    0,
  );
  return {
    profileId,
    tenantId,
    threads,
    totalThreads: threads.length,
    totalUnread,
  };
}

export async function getConversation(
  threadId: string,
): Promise<ConversationDetail | null> {
  const session = await getSession();
  const profileId = session?.userId ?? "";

  const threadData = await getThread(threadId);
  if (!threadData) return null;

  const tenantId = await resolveTenantId();
  const [messages, participantProfiles] = await Promise.all([
    listMessages(threadId),
    threadData.conversation
      ? getProfilesByIds(
          threadData.participants.map((p) => p.profileId),
          tenantId,
        )
      : Promise.resolve([]),
  ]);

  return buildConversationDetail(
    threadData.conversation,
    messages,
    profileId,
    participantProfiles,
  );
}

export async function sendMessage(
  profileId: string,
  targetId: string,
  body: string,
): Promise<ConversationDetail> {
  const { thread } = await sendMessageQuery(profileId, targetId, body);
  const detail = await getConversation(thread.id);
  if (!detail) throw new Error("THREAD_NOT_FOUND_AFTER_SEND");
  return detail;
}

// ============================================================================
// First-class Messaging OS service layer (MessageThread / Message / Delivery).
// Uses the new top-level data facades in lib/data/message*.ts. All surfaces
// built on /api/messages/* and the MessagingDashboard consume these helpers.
// ============================================================================

import { listChannels, type MessageChannelRow } from "@data/messageChannels";
import { assertTenantAccess } from "@/lib/auth/guards";
import {
  listThreadsFor,
  getThreadFor,
  listThreadParticipants,
  createThread as createThreadOp,
  archiveThread as archiveThreadOp,
  deleteThread as deleteThreadOp,
  addParticipant as addParticipantOp,
  removeParticipant as removeParticipantOp,
} from "./threads";
import {
  sendMessage as sendMessageOp,
  updateMessage as updateMessageOp,
  markRead as markReadOp,
  searchMessages as searchMessagesOp,
  listMessagesForThread,
  getUnreadSummary as getUnreadSummaryOp,
} from "./messageOps";
import { listDeliveriesForThread } from "./delivery";
import type {
  ChannelType,
  CreateThreadInput,
  Message,
  MessageChannel,
  MessageParticipant,
  MessageThread,
  SearchHit,
  SendMessageInput,
  ThreadDetail,
  ThreadFilter,
  ThreadListResult,
  UnreadSummary,
} from "./types";

function channelRowToChannel(row: MessageChannelRow): MessageChannel {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    channelType: row.channel_type as ChannelType,
    label: row.label,
    isActive: row.is_active,
    isDefault: row.is_default,
    config: row.config,
  };
}

async function ensureTenant(tenantId: string): Promise<void> {
  await assertTenantAccess(tenantId);
}

export async function listThreadsForUser(
  tenantId: string,
  profileId: string,
  filter?: ThreadFilter,
): Promise<ThreadListResult> {
  await ensureTenant(tenantId);
  return listThreadsFor(tenantId, profileId, filter);
}

export async function getThreadDetail(
  tenantId: string,
  threadId: string,
  profileId: string,
): Promise<ThreadDetail | null> {
  await ensureTenant(tenantId);
  const t = await getThreadFor(threadId, tenantId, profileId);
  if (!t) return null;
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

export async function createThread(
  tenantId: string,
  creatorProfileId: string,
  input: CreateThreadInput,
): Promise<MessageThread> {
  await ensureTenant(tenantId);
  const row = await createThreadOp(tenantId, {
    ...input,
    createdBy: creatorProfileId,
  });
  const full = await getThreadFor(row.id, tenantId, creatorProfileId);
  if (!full) throw new Error("THREAD_CREATE_FAILED");
  return full.thread;
}

export async function sendMessageOnThread(
  tenantId: string,
  senderId: string,
  input: SendMessageInput,
): Promise<{ message: Message; thread: MessageThread }> {
  await ensureTenant(tenantId);
  return sendMessageOp(tenantId, senderId, input);
}

export async function updateMessage(
  tenantId: string,
  messageId: string,
  senderId: string,
  patch: {
    body?: string;
    bodyHtml?: string | null;
    subject?: string | null;
    deletedAt?: string | Date | null;
  },
): Promise<Message> {
  await ensureTenant(tenantId);
  return updateMessageOp(tenantId, messageId, senderId, patch);
}

export async function markThreadRead(
  tenantId: string,
  threadId: string,
  profileId: string,
): Promise<void> {
  await ensureTenant(tenantId);
  await markReadOp(tenantId, threadId, profileId);
}

export async function archiveThread(
  tenantId: string,
  threadId: string,
): Promise<void> {
  await ensureTenant(tenantId);
  await archiveThreadOp(threadId, tenantId);
}

export async function deleteThread(
  tenantId: string,
  threadId: string,
): Promise<void> {
  await ensureTenant(tenantId);
  await deleteThreadOp(threadId, tenantId);
}

export async function addParticipantToThread(
  tenantId: string,
  threadId: string,
  profileId: string,
): Promise<MessageParticipant[]> {
  await ensureTenant(tenantId);
  await addParticipantOp(tenantId, threadId, profileId);
  return listThreadParticipants(tenantId, threadId);
}

export async function removeParticipantFromThread(
  tenantId: string,
  threadId: string,
  participantId: string,
): Promise<MessageParticipant[]> {
  await ensureTenant(tenantId);
  await removeParticipantOp(tenantId, threadId, participantId);
  return listThreadParticipants(tenantId, threadId);
}

export async function searchMessages(
  tenantId: string,
  profileId: string,
  query: string,
  limit?: number,
): Promise<SearchHit[]> {
  await ensureTenant(tenantId);
  return searchMessagesOp(tenantId, profileId, query, { limit });
}

export async function getUnreadSummary(
  tenantId: string,
  profileId: string,
): Promise<UnreadSummary> {
  await ensureTenant(tenantId);
  return getUnreadSummaryOp(tenantId, profileId);
}

export async function listMessagingChannels(
  tenantId: string,
): Promise<MessageChannel[]> {
  await ensureTenant(tenantId);
  const rows = await listChannels(tenantId);
  return rows.map(channelRowToChannel);
}
