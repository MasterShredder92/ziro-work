"use server";
import { requirePermission } from "@/lib/auth/guards";
import { updateMessage } from "@/lib/messaging/messageOps";
export async function updateMessageAction(id, patch) {
    const session = await requirePermission("messages.write")();
    return updateMessage(session.tenantId, id, session.userId, patch);
}
