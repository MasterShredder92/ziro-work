import "server-only";
import {
  listMessages as listMessageRows,
  getMessage as getMessageRow,
  upsertMessage,
  type MessageRow,
} from "@data/messageRecords";
import {
  getThread as getThreadRow,
  upsertThread,
  type MessageThreadRow,
} from "@data/messageThreads";
import {
  listParticipants,
  upsertParticipant,
} from "@data/messageParticipants";
import { getProfilesByIds, type Profile } from "@data/profiles";
import { getPrimaryBrandingEmailIdentity } from "@/lib/branding/queries";
import { applyEmailIdentity } from "@/lib/branding/runtime";
import { enqueueAndDeliver, listDeliveriesForMessage } from "./delivery";
import { renderTemplate } from "./integrations";
import { recordUsage } from "@/lib/billing/billingOps";
import type {
  ChannelType,
  DeliveryStatus,
  Message,
  MessageAttachment,
  MessageDelivery,
  SendMessageInput,
  UnreadSummary,
  SearchHit,
  MessageThread,
} from "./types";
import { rowToThread as rowToThreadFull } from "./threads";

function previewOf(body: string): string {
  const trimmed = body.trim();
  return trimmed.length > 280 ? `${trimmed.slice(0, 277)}…` : trimmed;
}

function profileNameFromMap(
  map: Map<string, Profile>,
  id: string,
): string | null {
  const p = map.get(id);
  if (!p) return null;
  return (
    `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || p.id
  );
}

function attachmentsFromRow(
  list: MessageRow["attachments"],
): MessageAttachment[] {
  return (list ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    url: a.url,
    mimeType: a.mime_type,
    sizeBytes: a.size_bytes,
  }));
}

function attachmentsToRow(
  list: MessageAttachment[] | undefined,
): MessageRow["attachments"] {
  return (list ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    url: a.url,
    mime_type: a.mimeType,
    size_bytes: a.sizeBytes,
  }));
}

function rowToMessage(
  row: MessageRow,
  senderName: string | null,
  deliveries: MessageDelivery[],
): Message {
  const deletedAt = (row as MessageRow & { deleted_at?: string | null }).deleted_at ?? null;
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

async function hydrateMessages(
  tenantId: string,
  rows: MessageRow[],
): Promise<Message[]> {
  if (rows.length === 0) return [];
  const senderIds = Array.from(new Set(rows.map((r) => r.sender_id)));
  const profiles = senderIds.length
    ? await getProfilesByIds(senderIds, tenantId)
    : [];
  const map = new Map(profiles.map((p) => [p.id, p]));
  const deliveriesByMsg = await Promise.all(
    rows.map((r) => listDeliveriesForMessage(tenantId, r.id)),
  );
  return rows.map((r, i) =>
    rowToMessage(r, profileNameFromMap(map, r.sender_id), deliveriesByMsg[i]),
  );
}

export async function listMessagesForThread(
  tenantId: string,
  threadId: string,
): Promise<Message[]> {
  const rows = await listMessageRows(
    tenantId,
    { thread_id: threadId },
    { orderBy: "created_at", ascending: true, limit: 500 },
  );
  return hydrateMessages(tenantId, rows);
}

export async function getMessageFor(
  tenantId: string,
  messageId: string,
): Promise<Message | null> {
  const row = await getMessageRow(messageId, tenantId);
  if (!row) return null;
  const [hydrated] = await hydrateMessages(tenantId, [row]);
  return hydrated ?? null;
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
  const row = await getMessageRow(messageId, tenantId);
  if (!row) throw new Error("MESSAGE_NOT_FOUND");
  if (row.sender_id !== senderId) throw new Error("FORBIDDEN");
  const isSoftDelete = patch.deletedAt !== undefined;
  const nextDeletedAt =
    patch.deletedAt === null
      ? null
      : patch.deletedAt instanceof Date
        ? patch.deletedAt.toISOString()
        : (patch.deletedAt ?? new Date().toISOString());
  const deletedRow = row as MessageRow & { deleted_at?: string | null };
  const existingDeletedAt = deletedRow.deleted_at ?? null;

  if (!isSoftDelete) {
    if (existingDeletedAt) throw new Error("MESSAGE_DELETED");
    const nextBody = typeof patch.body === "string" ? patch.body.trim() : row.body;
    if (!nextBody) throw new Error("EMPTY_BODY");

    const nextRow: MessageRow = {
      ...row,
      body: nextBody,
      body_html:
        typeof patch.bodyHtml === "string" || patch.bodyHtml === null
          ? patch.bodyHtml
          : row.body_html,
      subject:
        typeof patch.subject === "string" || patch.subject === null
          ? patch.subject
          : row.subject,
      updated_at: new Date().toISOString(),
    };

    const updatedRow = await upsertMessage(tenantId, nextRow);
    const [message] = await hydrateMessages(tenantId, [updatedRow]);
    if (!message) throw new Error("MESSAGE_UPDATE_FAILED");
    return message;
  }

  const nextRow: MessageRow & { deleted_at?: string | null } = {
    ...row,
    deleted_at: nextDeletedAt,
    updated_at: new Date().toISOString(),
  };

  const updatedRow = await upsertMessage(tenantId, nextRow);
  const [message] = await hydrateMessages(tenantId, [updatedRow]);
  if (!message) throw new Error("MESSAGE_UPDATE_FAILED");
  return message;
}

async function updateThreadAfterMessage(
  tenantId: string,
  thread: MessageThreadRow,
  message: MessageRow,
): Promise<MessageThreadRow> {
  const unread: Record<string, number> = { ...(thread.unread_by ?? {}) };
  for (const id of thread.participant_ids) {
    if (id === message.sender_id) {
      unread[id] = 0;
    } else {
      unread[id] = (unread[id] ?? 0) + 1;
    }
  }
  return upsertThread(tenantId, {
    ...thread,
    last_message_preview: previewOf(message.body),
    last_message_at: message.created_at,
    unread_by: unread,
    status: "open",
  });
}

export async function sendMessage(
  tenantId: string,
  senderId: string,
  input: SendMessageInput,
): Promise<{ message: Message; thread: MessageThread }> {
  if (!tenantId) throw new Error("MISSING_TENANT");
  if (!senderId) throw new Error("MISSING_SENDER");

  let subject: string | null = input.subject ?? null;
  let body = (input.body ?? "").trim();
  let bodyHtml = input.bodyHtml ?? null;

  if (input.templateId) {
    const rendered = await renderTemplate(
      tenantId,
      input.templateId,
      (input.mergeVars ?? {}) as Record<string, unknown>,
    );
    if (rendered) {
      subject = subject ?? rendered.subject;
      body = body || rendered.body;
      bodyHtml = bodyHtml ?? rendered.bodyHtml;
    }
  }

  if (body.length === 0) throw new Error("EMPTY_BODY");

  let threadRow: MessageThreadRow | null = null;
  if (input.threadId) {
    threadRow = await getThreadRow(input.threadId, tenantId);
    if (!threadRow) throw new Error("THREAD_NOT_FOUND");
  } else {
    const recipients = Array.from(
      new Set(
        [senderId, ...(input.recipientIds ?? [])].filter(
          (id) => typeof id === "string" && id.length > 0,
        ),
      ),
    );
    if (recipients.length < 2) throw new Error("MISSING_RECIPIENT");
    threadRow = await upsertThread(tenantId, {
      tenant_id: tenantId,
      subject,
      channel_type: (input.channelType ?? "in_app") as ChannelType,
      status: "open",
      participant_ids: recipients,
      context_type: input.contextType ?? null,
      context_id: input.contextId ?? null,
      created_by: senderId,
      unread_by: recipients.reduce<Record<string, number>>((acc, id) => {
        acc[id] = 0;
        return acc;
      }, {}),
    });
    await Promise.all(
      recipients.map((id) =>
        upsertParticipant(tenantId, {
          tenant_id: tenantId,
          thread_id: threadRow!.id,
          profile_id: id,
          role: id === senderId ? "owner" : "member",
        }),
      ),
    );
  }

  const recipientIds = (threadRow.participant_ids ?? []).filter(
    (id) => id !== senderId,
  );
  const channelType =
    (input.channelType ?? threadRow.channel_type ?? "in_app") as ChannelType;

  const attachments: MessageAttachment[] = input.attachments ?? [];

  const messageRow = await upsertMessage(tenantId, {
    tenant_id: tenantId,
    thread_id: threadRow.id,
    sender_id: senderId,
    recipient_ids: recipientIds,
    channel_type: channelType,
    subject,
    body,
    body_html: bodyHtml,
    template_id: input.templateId ?? null,
    merge_vars: input.mergeVars ?? null,
    attachments: attachmentsToRow(attachments),
    delivery_status: "queued" as DeliveryStatus,
    reply_to_message_id: input.replyToMessageId ?? null,
  });

  let emailBrandingMeta: Record<string, unknown> | undefined;
  if (channelType === "email") {
    const identity = await getPrimaryBrandingEmailIdentity(tenantId).catch(
      () => null,
    );
    const env = applyEmailIdentity(identity);
    emailBrandingMeta = {
      emailFrom: `${env.fromName} <${env.fromEmail}>`,
      emailReplyTo: env.replyTo,
      brandingEmailVerified: env.verified,
      branding_from_name: env.fromName,
      branding_from_email: env.fromEmail,
    };
  }

  const deliveries: MessageDelivery[] = [];
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
  const finalStatus: DeliveryStatus = anyFailed ? "failed" : "delivered";
  await upsertMessage(tenantId, { ...messageRow, delivery_status: finalStatus });

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
  } catch {
    /* noop */
  }

  const [message] = await hydrateMessages(tenantId, [
    { ...messageRow, delivery_status: finalStatus },
  ]);

  const profiles = threadRow.participant_ids.length
    ? await getProfilesByIds(threadRow.participant_ids, tenantId)
    : [];
  const pmap = new Map(profiles.map((p) => [p.id, p]));
  const thread = rowToThreadFull(threadRow, senderId, pmap);

  return { message, thread };
}

export async function markRead(
  tenantId: string,
  threadId: string,
  profileId: string,
): Promise<MessageThreadRow | null> {
  const thread = await getThreadRow(threadId, tenantId);
  if (!thread) return null;
  const unread = { ...(thread.unread_by ?? {}) };
  unread[profileId] = 0;
  const readBy = { ...(thread.read_by ?? {}), [profileId]: new Date().toISOString() };
  const updated = await upsertThread(tenantId, {
    ...thread,
    unread_by: unread,
    read_by: readBy,
  });
  const participants = await listParticipants(tenantId, {
    thread_id: threadId,
    profile_id: profileId,
  });
  await Promise.all(
    participants.map((p) =>
      upsertParticipant(tenantId, {
        ...p,
        last_read_at: new Date().toISOString(),
      }),
    ),
  );
  return updated;
}

export async function searchMessages(
  tenantId: string,
  profileId: string,
  query: string,
  opts?: { limit?: number },
): Promise<SearchHit[]> {
  const q = (query ?? "").trim();
  if (!q) return [];
  const rows = await listMessageRows(
    tenantId,
    { search: q },
    { orderBy: "created_at", ascending: false, limit: opts?.limit ?? 50 },
  );
  if (rows.length === 0) return [];

  const threadIds = Array.from(new Set(rows.map((r) => r.thread_id)));
  const threadRows: MessageThreadRow[] = [];
  for (const tid of threadIds) {
    const t = await getThreadRow(tid, tenantId);
    if (t) threadRows.push(t);
  }
  const profilesIds = new Set<string>();
  for (const row of threadRows)
    for (const id of row.participant_ids) profilesIds.add(id);
  for (const row of rows) profilesIds.add(row.sender_id);
  const profiles = profilesIds.size
    ? await getProfilesByIds(Array.from(profilesIds), tenantId)
    : [];
  const pmap = new Map(profiles.map((p) => [p.id, p]));

  const threadsById = new Map(
    threadRows.map((t) => [t.id, rowToThreadFull(t, profileId, pmap)]),
  );

  const messages = await hydrateMessages(tenantId, rows);
  const qLower = q.toLowerCase();
  return messages
    .filter((m) => {
      const thread = threadsById.get(m.threadId);
      if (!thread) return false;
      // restrict to threads the profile participates in (admins see all upstream)
      return thread.participantIds.includes(profileId);
    })
    .map((m) => {
      const thread = threadsById.get(m.threadId)!;
      const idx = m.body.toLowerCase().indexOf(qLower);
      const start = Math.max(0, idx - 32);
      const end = Math.min(m.body.length, (idx === -1 ? 0 : idx) + q.length + 64);
      const snippet = m.body.slice(start, end);
      return { message: m, thread, snippet };
    });
}

export async function getUnreadSummary(
  tenantId: string,
  profileId: string,
): Promise<UnreadSummary> {
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
