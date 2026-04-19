import "server-only";
import type { NotificationBadge, UnreadSummary } from "./types";
import { getUnreadSummary } from "./messageOps";

/**
 * Compute a notification badge for the global nav. Includes unread counts,
 * direct mentions, and alerts flagged via metadata.
 */
export async function computeNotificationBadge(
  tenantId: string,
  profileId: string,
): Promise<NotificationBadge> {
  const summary = await getUnreadSummary(tenantId, profileId);
  const mentions = summary.threads.filter((t) =>
    (t.subject ?? "").toLowerCase().includes(`@${profileId.toLowerCase()}`),
  ).length;
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
export async function pushNotification(input: {
  tenantId: string;
  profileId: string;
  title: string;
  body: string;
  href?: string;
}): Promise<void> {
  try {
    const { logAuditWithContext } = await import("@/lib/audit/log");
    await logAuditWithContext(
      "messaging.notification.push",
      { tenantId: input.tenantId, profileId: input.profileId },
      {
        title: input.title,
        body: input.body,
        href: input.href ?? null,
      },
    );
  } catch {
    /* noop */
  }
}

export async function listUnreadForNav(
  tenantId: string,
  profileId: string,
): Promise<UnreadSummary> {
  return getUnreadSummary(tenantId, profileId);
}
