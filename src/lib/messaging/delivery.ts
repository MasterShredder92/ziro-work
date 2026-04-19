import "server-only";
import {
  listDeliveries,
  upsertDelivery,
  type MessageDeliveryRow,
} from "@data/messageDeliveries";
import { resolveMessagingEmailIdentity } from "@/lib/branding/messagingIntegration";
import type {
  ChannelType,
  DeliveryStatus,
  MessageAttachment,
  MessageDelivery,
} from "./types";

export type DeliveryRequest = {
  tenantId: string;
  messageId: string;
  threadId: string;
  recipientId: string;
  channelType: ChannelType;
  subject: string | null;
  body: string;
  bodyHtml: string | null;
  attachments: MessageAttachment[];
  metadata?: Record<string, unknown>;
};

function rowToDelivery(row: MessageDeliveryRow): MessageDelivery {
  return {
    id: row.id,
    messageId: row.message_id,
    threadId: row.thread_id,
    recipientId: row.recipient_id,
    channelType: row.channel_type,
    status: row.status,
    attempts: row.attempts,
    errorMessage: row.error_message,
    queuedAt: row.queued_at,
    sentAt: row.sent_at,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    failedAt: row.failed_at,
  };
}

/**
 * Enqueue a delivery for a single recipient on a single channel. Returns the
 * queued row. The actual dispatch happens in processDelivery().
 */
export async function enqueueDelivery(
  req: DeliveryRequest,
): Promise<MessageDelivery> {
  let metadata: Record<string, unknown> = {
    ...(req.metadata as Record<string, unknown> | undefined),
  };
  if (req.channelType === "email") {
    const env = await resolveMessagingEmailIdentity(req.tenantId);
    metadata = {
      ...metadata,
      email_from_name: env.fromName,
      email_from: env.fromEmail,
      email_reply_to: env.replyTo,
    };
  }
  const row = await upsertDelivery(req.tenantId, {
    tenant_id: req.tenantId,
    message_id: req.messageId,
    thread_id: req.threadId,
    recipient_id: req.recipientId,
    channel_type: req.channelType,
    status: "queued",
    attempts: 0,
    error_message: null,
    queued_at: new Date().toISOString(),
    metadata,
  });
  return rowToDelivery(row);
}

/**
 * Simulate channel dispatch. In production this would call out to a real email
 * / SMS / push provider; here we mark the delivery sent/delivered and record a
 * metadata trail so the UI can surface status and providers can be swapped in.
 */
async function dispatch(
  req: DeliveryRequest,
  attempt: number,
): Promise<{ ok: true; providerId: string } | { ok: false; error: string }> {
  try {
    switch (req.channelType) {
      case "email": {
        await resolveMessagingEmailIdentity(req.tenantId);
        const providerId = `${req.channelType}_${Date.now()}_${attempt}`;
        return { ok: true, providerId };
      }
      case "sms":
      case "push":
      case "in_app": {
        const providerId = `${req.channelType}_${Date.now()}_${attempt}`;
        return { ok: true, providerId };
      }
      default:
        return { ok: false, error: "UNSUPPORTED_CHANNEL" };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "DISPATCH_ERROR" };
  }
}

export async function processDelivery(
  deliveryId: string,
  req: DeliveryRequest,
): Promise<MessageDelivery> {
  const queuedAt = new Date().toISOString();
  const queued = await upsertDelivery(req.tenantId, {
    id: deliveryId,
    tenant_id: req.tenantId,
    message_id: req.messageId,
    thread_id: req.threadId,
    recipient_id: req.recipientId,
    channel_type: req.channelType,
    status: "sending",
    queued_at: queuedAt,
  });
  const attempt = (queued.attempts ?? 0) + 1;
  const result = await dispatch(req, attempt);

  const now = new Date().toISOString();
  if (result.ok) {
    let emailBranding: Record<string, unknown> = {};
    if (req.channelType === "email") {
      const env = await resolveMessagingEmailIdentity(req.tenantId);
      emailBranding = {
        email_from_name: env.fromName,
        email_from: env.fromEmail,
        email_reply_to: env.replyTo,
        email_identity_verified: env.verified,
      };
    }
    const sent = await upsertDelivery(req.tenantId, {
      ...queued,
      status: "delivered" as DeliveryStatus,
      attempts: attempt,
      sent_at: now,
      delivered_at: now,
      metadata: {
        ...(queued.metadata ?? {}),
        provider_id: result.providerId,
        attachment_count: req.attachments.length,
        attachments: req.attachments.map((a) => ({
          id: a.id,
          name: a.name,
          url: a.url,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
        })),
        ...emailBranding,
      },
    });
    return rowToDelivery(sent);
  }
  const failed = await upsertDelivery(req.tenantId, {
    ...queued,
    status: "failed" as DeliveryStatus,
    attempts: attempt,
    error_message: result.error,
    failed_at: now,
  });
  return rowToDelivery(failed);
}

export async function enqueueAndDeliver(
  req: DeliveryRequest,
): Promise<MessageDelivery> {
  const queued = await enqueueDelivery(req);
  return processDelivery(queued.id, req);
}

export async function listDeliveriesForMessage(
  tenantId: string,
  messageId: string,
): Promise<MessageDelivery[]> {
  const rows = await listDeliveries(tenantId, { message_id: messageId });
  return rows.map(rowToDelivery);
}

export async function listDeliveriesForThread(
  tenantId: string,
  threadId: string,
): Promise<MessageDelivery[]> {
  const rows = await listDeliveries(tenantId, { thread_id: threadId });
  return rows.map(rowToDelivery);
}

export async function markDeliveryRead(
  tenantId: string,
  deliveryId: string,
): Promise<MessageDelivery | null> {
  const rows = await listDeliveries(tenantId, {});
  const row = rows.find((r) => r.id === deliveryId);
  if (!row) return null;
  const updated = await upsertDelivery(tenantId, {
    ...row,
    status: "read" as DeliveryStatus,
    read_at: new Date().toISOString(),
  });
  return rowToDelivery(updated);
}

export { rowToDelivery };
