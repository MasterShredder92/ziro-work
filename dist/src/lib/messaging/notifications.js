import "server-only";
import { getUnreadSummary } from "./messageOps";
/**
 * Compute a notification badge for the global nav. Includes unread counts,
 * direct mentions, and alerts flagged via metadata.
 */
export async function computeNotificationBadge(tenantId, profileId) {
    const summary = await getUnreadSummary(tenantId, profileId);
    const mentions = summary.threads.filter((t) => { var _a; return ((_a = t.subject) !== null && _a !== void 0 ? _a : "").toLowerCase().includes(`@${profileId.toLowerCase()}`); }).length;
    const alerts = summary.threads.filter((t) => t.channelType === "sms").length;
    return {
        profileId,
        totalUnread: summary.totalUnread,
        mentions,
        alerts,
    };
}
/**
 * Fire an in-app push notification hint. In production this would broadcast to
 * a websocket / realtime channel; here we write an audit trail so consumers can
 * poll.
 */
export async function pushNotification(input) {
    var _a;
    try {
        const { logAuditWithContext } = await import("@/lib/audit/log");
        await logAuditWithContext("messaging.notification.push", { tenantId: input.tenantId, profileId: input.profileId }, {
            title: input.title,
            body: input.body,
            href: (_a = input.href) !== null && _a !== void 0 ? _a : null,
        });
    }
    catch (_b) {
        /* noop */
    }
}
export async function listUnreadForNav(tenantId, profileId) {
    return getUnreadSummary(tenantId, profileId);
}
