import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getUnreadSummary, listThreadsForUser, } from "@/lib/messaging/service";
import { computeNotificationBadge } from "@/lib/messaging/notifications";
import { listPotentialRecipients } from "@/lib/messaging/queries";
import { MessagingDashboard, NotificationCenter } from "./components";
export const dynamic = "force-dynamic";
export default async function MessagesPage() {
    const session = await getSession();
    if (!session) {
        redirect("/login?next=/messages");
    }
    const canWrite = can(session.role, "messages.write");
    const [threadsResult, unread, badge, recipientProfiles] = await Promise.all([
        listThreadsForUser(session.tenantId, session.userId, { limit: 100 }),
        getUnreadSummary(session.tenantId, session.userId),
        computeNotificationBadge(session.tenantId, session.userId),
        canWrite
            ? listPotentialRecipients(session.userId)
            : Promise.resolve([]),
    ]);
    const recipients = recipientProfiles.map((p) => ({
        id: p.profileId,
        label: p.fullName || p.profileId,
        role: p.role,
    }));
    return (_jsxs("div", { className: "grid gap-4 lg:grid-cols-[1fr_320px]", children: [_jsx(MessagingDashboard, { threads: threadsResult.threads, unread: unread, badge: badge, currentProfileId: session.userId, recipients: recipients, canWrite: canWrite }), _jsx(NotificationCenter, { badge: badge, unread: unread, threads: threadsResult.threads })] }));
}
