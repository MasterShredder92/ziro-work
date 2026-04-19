"use server";

import { requirePermission } from "@/lib/auth/guards";
import { updateMessage } from "@/lib/messaging/messageOps";

export async function updateMessageAction(
  id: string,
  patch: {
    body?: string;
    bodyHtml?: string | null;
    subject?: string | null;
    deletedAt?: string | Date | null;
  },
) {
  const session = await requirePermission("messages.write")();
  return updateMessage(session.tenantId, id, session.userId, patch);
}
