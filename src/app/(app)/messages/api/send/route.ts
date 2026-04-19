import "server-only";
import type { NextRequest } from "next/server";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { sendMessage } from "@/lib/messaging/messageOps";
import { getThread } from "@/lib/messaging/queries";
import { createFile, createSignedFileUrl } from "@/lib/files/service";
import { badRequest, ok, readJson, serverError } from "@/lib/http";
import type { MessageAttachment } from "@/lib/messaging/types";
import type { FileUploadPayload } from "@/lib/files/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SendBody = {
  body?: string;
  targetId?: string;
  threadId?: string;
  uploads?: Array<{
    fileName: string;
    mimeType?: string | null;
    size: number;
    base64: string;
    checksum?: string | null;
  }>;
};

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("messages.write")();
    await assertTenantAccess(session.tenantId);

    const payload = (await readJson<SendBody>(req)) ?? {};
    const body = (payload.body ?? "").trim();
    if (!body) return badRequest("Missing message body");

    let targetId = (payload.targetId ?? "").trim();
    const threadId = (payload.threadId ?? "").trim();

    if (!targetId && threadId) {
      const thread = await getThread(threadId);
      if (!thread) return badRequest("Thread not found");
      if (
        thread.conversation.tenant_id !== session.tenantId &&
        session.role !== "admin"
      ) {
        return badRequest("Forbidden");
      }
      const participants = thread.participants.map((p) => p.profileId);
      if (!participants.includes(session.userId) && session.role !== "admin") {
        return badRequest("Forbidden");
      }
      targetId =
        participants.find((id) => id !== session.userId) ??
        thread.conversation.profile_id;
    }

    if (!targetId) return badRequest("Missing target recipient");

    const uploadedAttachments: MessageAttachment[] = [];
    if (Array.isArray(payload.uploads) && payload.uploads.length > 0) {
      for (const upload of payload.uploads) {
        const file = await createFile({
          tenantId: session.tenantId,
          input: { name: upload.fileName, folderId: null },
          upload: {
            fileName: upload.fileName,
            mimeType: upload.mimeType ?? "application/octet-stream",
            size: upload.size,
            base64: upload.base64,
            checksum: upload.checksum ?? null,
          } as FileUploadPayload,
          context: {
            role: session.role,
            userId: session.userId,
            profileId: session.userId,
            tenantId: session.tenantId,
          },
        });
        const signed = await createSignedFileUrl(
          file.id,
          session.tenantId,
          {
            role: session.role,
            userId: session.userId,
            profileId: session.userId,
            tenantId: session.tenantId,
          },
          { ttlSeconds: 3600 },
        );
        uploadedAttachments.push({
          id: file.id,
          name: file.name,
          url: signed.url,
          mimeType: file.mimeType,
          sizeBytes: file.size,
        });
      }
    }

    const detail = await sendMessage(session.tenantId, session.userId, {
      threadId: threadId || undefined,
      recipientIds: [targetId],
      body,
      channelType: "in_app",
      attachments: uploadedAttachments,
    });

    return ok({ thread: detail.thread, data: detail });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "FORBIDDEN") return badRequest("Forbidden");
      if (err.message === "EMPTY_BODY") return badRequest("Empty body");
      if (err.message === "MISSING_TARGET")
        return badRequest("Missing recipient");
    }
    return serverError(err);
  }
}
