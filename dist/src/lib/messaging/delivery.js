import "server-only";
import { listDeliveries, upsertDelivery, } from "@data/messageDeliveries";
import { resolveMessagingEmailIdentity } from "@/lib/branding/messagingIntegration";
function rowToDelivery(row) {
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
export async function enqueueDelivery(req) {
    let metadata = Object.assign({}, req.metadata);
    if (req.channelType === "email") {
        const env = await resolveMessagingEmailIdentity(req.tenantId);
        metadata = Object.assign(Object.assign({}, metadata), { email_from_name: env.fromName, email_from: env.fromEmail, email_reply_to: env.replyTo });
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
async function dispatch(req, attempt) {
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
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "DISPATCH_ERROR" };
    }
}
export async function processDelivery(deliveryId, req) {
    var _a, _b;
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
    const attempt = ((_a = queued.attempts) !== null && _a !== void 0 ? _a : 0) + 1;
    const result = await dispatch(req, attempt);
    const now = new Date().toISOString();
    if (result.ok) {
        let emailBranding = {};
        if (req.channelType === "email") {
            const env = await resolveMessagingEmailIdentity(req.tenantId);
            emailBranding = {
                email_from_name: env.fromName,
                email_from: env.fromEmail,
                email_reply_to: env.replyTo,
                email_identity_verified: env.verified,
            };
        }
        const sent = await upsertDelivery(req.tenantId, Object.assign(Object.assign({}, queued), { status: "delivered", attempts: attempt, sent_at: now, delivered_at: now, metadata: Object.assign(Object.assign(Object.assign({}, ((_b = queued.metadata) !== null && _b !== void 0 ? _b : {})), { provider_id: result.providerId, attachment_count: req.attachments.length, attachments: req.attachments.map((a) => ({
                    id: a.id,
                    name: a.name,
                    url: a.url,
                    mimeType: a.mimeType,
                    sizeBytes: a.sizeBytes,
                })) }), emailBranding) }));
        return rowToDelivery(sent);
    }
    const failed = await upsertDelivery(req.tenantId, Object.assign(Object.assign({}, queued), { status: "failed", attempts: attempt, error_message: result.error, failed_at: now }));
    return rowToDelivery(failed);
}
export async function enqueueAndDeliver(req) {
    const queued = await enqueueDelivery(req);
    return processDelivery(queued.id, req);
}
export async function listDeliveriesForMessage(tenantId, messageId) {
    const rows = await listDeliveries(tenantId, { message_id: messageId });
    return rows.map(rowToDelivery);
}
export async function listDeliveriesForThread(tenantId, threadId) {
    const rows = await listDeliveries(tenantId, { thread_id: threadId });
    return rows.map(rowToDelivery);
}
export async function markDeliveryRead(tenantId, deliveryId) {
    const rows = await listDeliveries(tenantId, {});
    const row = rows.find((r) => r.id === deliveryId);
    if (!row)
        return null;
    const updated = await upsertDelivery(tenantId, Object.assign(Object.assign({}, row), { status: "read", read_at: new Date().toISOString() }));
    return rowToDelivery(updated);
}
export { rowToDelivery };
